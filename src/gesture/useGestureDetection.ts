import { useEffect, useRef, useCallback, useState } from 'react';
import { gestureService } from './GestureRecognizerService';
import {
  GestureMotionTracker,
  TemporalConsensusBuffer,
} from './gestureTemporal';
import {
  classifyNormalizedHand,
  normalizeHandLandmarks,
} from './rpsGeometry';
import { GESTURE_CONFIG } from './gestureConfig';
import type { GestureStatus } from './gestureTypes';
import type { GamePhase } from '../game/gameTypes';

// ============================================================
// useGestureDetection hook
// ============================================================

/** Phases where we actively run inference */
const ACTIVE_PHASES: GamePhase[] = [
  'waitingForStart',
  'roundReady',
  'countdown',
  'capture',
];

interface UseGestureDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  phase: GamePhase;
  onStableGesture?: (move: import('../game/gameTypes').RpsMove) => void;
}

export interface GestureDebugInfo {
  label: string;
  confidence: number;
  voteRatio: number;
  weightedMargin: number;
  consecutiveCount: number;
  motion: number;
  status: GestureStatus;
  serviceStatus: string;
  rejectionReason: string | null;
}

export function useGestureDetection({
  videoRef,
  phase,
  onStableGesture,
}: UseGestureDetectionOptions) {
  const [gestureStatus, setGestureStatus] = useState<GestureStatus>({
    kind: 'none',
  });
  const [debugInfo, setDebugInfo] = useState<GestureDebugInfo | null>(null);
  const [serviceReady, setServiceReady] = useState(false);

  const stableBufferRef = useRef(new TemporalConsensusBuffer());
  const motionTrackerRef = useRef(new GestureMotionTracker());
  const lastInferenceTime = useRef(0);
  const rafRef = useRef<number | null>(null);
  const rvfcRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const warmedUpRef = useRef(false);
  const previousPhaseRef = useRef<GamePhase>(phase);
  const lastStatusRef = useRef<GestureStatus>({ kind: 'none' });
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
  const onStableRef = useRef(onStableGesture);
  onStableRef.current = onStableGesture;

  const emitGestureStatus = useCallback((nextStatus: GestureStatus) => {
    const previous = lastStatusRef.current;

    const sameStatus = (() => {
      if (previous.kind !== nextStatus.kind) return false;

      switch (nextStatus.kind) {
        case 'detecting':
          return (
            previous.kind === 'detecting' &&
            previous.move === nextStatus.move
          );
        case 'stable':
          return (
            previous.kind === 'stable' &&
            previous.move === nextStatus.move
          );
        case 'error':
          return previous.kind === 'error' && previous.message === nextStatus.message;
        default:
          return true;
      }
    })();

    if (!sameStatus) {
      lastStatusRef.current = nextStatus;
      setGestureStatus(nextStatus);
    }
  }, []);

  // Initialize MediaPipe service on mount
  useEffect(() => {
    const video = videoRef.current;

    gestureService
      .initialize()
      .then(() => setServiceReady(true))
      .catch(() => {
        emitGestureStatus({ kind: 'error', message: 'Gesture model failed to load' });
      });

    return () => {
      activeRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (rvfcRef.current !== null) {
        if (video) {
          video.cancelVideoFrameCallback(rvfcRef.current);
        }
        rvfcRef.current = null;
      }
    };
  }, [emitGestureStatus, videoRef]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState !== 'hidden';
      setPageVisible(visible);

      if (!visible) {
        stableBufferRef.current.reset();
        motionTrackerRef.current.reset();
        warmedUpRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const processFrame = useCallback(
    (timestamp: number) => {
      if (!activeRef.current) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !gestureService.isReady()) return;

      if (!gestureService.isWarmedUp() && !warmedUpRef.current) {
        if (gestureService.warmup(video, timestamp)) {
          warmedUpRef.current = true;
        }
        return;
      }

      // Throttle to INFERENCE_FPS
      const minInterval = 1000 / GESTURE_CONFIG.INFERENCE_FPS;
      if (timestamp - lastInferenceTime.current < minInterval) return;
      lastInferenceTime.current = timestamp;

      const result = gestureService.recognize(video, timestamp);

      if (!result) return;

      const hasHand = result.landmarks.length > 0;

      if (!hasHand) {
        stableBufferRef.current.reset();
        motionTrackerRef.current.reset();
        const newStatus: GestureStatus = { kind: 'noHand' };
        emitGestureStatus(newStatus);
        if (import.meta.env.DEV) {
          setDebugInfo({
            label: 'None',
            confidence: 0,
            voteRatio: 0,
            weightedMargin: 0,
            consecutiveCount: 0,
            motion: 0,
            status: newStatus,
            serviceStatus: gestureService.getStatus(),
            rejectionReason: 'no_hand',
          });
        }
        return;
      }

      const motionState = motionTrackerRef.current.update(result.landmarks[0], timestamp);

      if (motionState.enteringMoving) {
        stableBufferRef.current.reset();
      }

      const normalized = normalizeHandLandmarks(
        result.landmarks[0],
        result.handedness[0]?.label
      );

      if (!normalized) {
        stableBufferRef.current.push(null);
        const newStatus: GestureStatus = motionState.moving
          ? { kind: 'moving' }
          : { kind: 'detecting', move: null, confidence: 0 };

        emitGestureStatus(newStatus);

        if (import.meta.env.DEV) {
          setDebugInfo({
            label: 'Unknown',
            confidence: 0,
            voteRatio: 0,
            weightedMargin: 0,
            consecutiveCount: 0,
            motion: motionState.motion,
            status: newStatus,
            serviceStatus: gestureService.getStatus(),
            rejectionReason: 'low_landmark_quality',
          });
        }

        return;
      }

      const classification = classifyNormalizedHand(normalized);

      if (
        phase === 'capture' &&
        !motionState.moving &&
        classification.move &&
        classification.confidence >= GESTURE_CONFIG.CAPTURE_FAST_CONFIDENCE
      ) {
        stableBufferRef.current.reset();
        const fastStatus: GestureStatus = {
          kind: 'stable',
          move: classification.move,
          confidence: classification.confidence,
        };

        emitGestureStatus(fastStatus);
        onStableRef.current?.(classification.move);

        if (import.meta.env.DEV) {
          setDebugInfo({
            label: classification.move,
            confidence: classification.confidence,
            voteRatio: 1,
            weightedMargin: 1,
            consecutiveCount: 1,
            motion: motionState.motion,
            status: fastStatus,
            serviceStatus: gestureService.getStatus(),
            rejectionReason: classification.rejectionReason,
          });
        }

        return;
      }

      if (motionState.moving) {
        stableBufferRef.current.push(null);
      } else if (classification.move) {
        stableBufferRef.current.push({
          move: classification.move,
          confidence: classification.confidence,
        });
      } else {
        stableBufferRef.current.push(null);
      }

      const consensus = stableBufferRef.current.evaluate();

      let newStatus: GestureStatus;
      if (motionState.moving) {
        newStatus = { kind: 'moving' };
      } else if (consensus.stable && consensus.move) {
        newStatus = {
          kind: 'stable',
          move: consensus.move,
          confidence: consensus.confidence,
        };
        onStableRef.current?.(consensus.move);
      } else {
        newStatus = {
          kind: 'detecting',
          move: classification.move,
          confidence: classification.confidence,
        };
      }

      emitGestureStatus(newStatus);

      if (import.meta.env.DEV) {
        setDebugInfo({
          label: classification.move ?? 'Unknown',
          confidence: classification.confidence,
          voteRatio: consensus.weightedScore,
          weightedMargin: consensus.weightedMargin,
          consecutiveCount: consensus.consecutiveCount,
          motion: motionState.motion,
          status: newStatus,
          serviceStatus: gestureService.getStatus(),
          rejectionReason: classification.rejectionReason,
        });
      }
    },
    [emitGestureStatus, videoRef]
  );

  // Main inference loop — prefers requestVideoFrameCallback, falls back to rAF
  useEffect(() => {
    const active = ACTIVE_PHASES.includes(phase) && serviceReady && pageVisible;
    activeRef.current = active;

    if (phase === 'capture' && previousPhaseRef.current !== 'capture') {
      stableBufferRef.current.reset();
      motionTrackerRef.current.reset();
      warmedUpRef.current = false;
      emitGestureStatus({ kind: 'none' });
      if (import.meta.env.DEV) {
        setDebugInfo(null);
      }
    }

    previousPhaseRef.current = phase;

    if (!active) {
      if (!pageVisible) {
        stableBufferRef.current.reset();
        motionTrackerRef.current.reset();
        warmedUpRef.current = false;
      }
      return;
    }

    const video = videoRef.current;
    const supportsRVFC =
      video && 'requestVideoFrameCallback' in video;

    if (supportsRVFC && video) {
      const loop = (now: number, _meta: VideoFrameCallbackMetadata) => {
        processFrame(now);
        if (activeRef.current) {
          rvfcRef.current = video.requestVideoFrameCallback(loop);
        }
      };
      rvfcRef.current = video.requestVideoFrameCallback(loop);

      return () => {
        if (rvfcRef.current !== null && video) {
          video.cancelVideoFrameCallback(rvfcRef.current);
          rvfcRef.current = null;
        }
      };
    } else {
      // RAF fallback
      const loop = (now: number) => {
        processFrame(now);
        if (activeRef.current) {
          rafRef.current = requestAnimationFrame(loop);
        }
      };
      rafRef.current = requestAnimationFrame(loop);

      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }
  }, [emitGestureStatus, pageVisible, phase, processFrame, serviceReady, videoRef]);

  return { gestureStatus, debugInfo, serviceReady };
}
