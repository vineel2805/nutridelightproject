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
import { drawHandSkeleton } from './handSkeleton';
import { GESTURE_CONFIG } from './gestureConfig';
import type { GestureStatus } from './gestureTypes';
import type { GamePhase, RpsMove } from '../game/gameTypes';

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

/** Direct label-to-move mapping for the MediaPipe primary path.
 *  Bypasses mapGestureToMove to avoid the double-threshold conflict. */
const MEDIAPIPE_LABEL_TO_MOVE: Record<string, RpsMove> = {
  Closed_Fist: 'rock',
  Open_Palm: 'paper',
  Victory: 'scissors',
};

interface UseGestureDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  phase: GamePhase;
  onStableGesture?: (move: RpsMove) => void;
  landmarkCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export interface GestureDebugInfo {
  label: string;
  confidence: number;
  margin: number;
  voteRatio: number;
  weightedMargin: number;
  consecutiveCount: number;
  motion: number;
  globalMotion: number;
  poseMotion: number;
  status: GestureStatus;
  serviceStatus: string;
  rejectionReason: string | null;
  blockReason: string | null;
  mediapipeLabel: string | null;
  mediapipeConfidence: number;
  classificationSource: 'mediapipe' | 'geometry' | null;
}

export function useGestureDetection({
  videoRef,
  phase,
  onStableGesture,
  landmarkCanvasRef,
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
  const previousPhaseRef = useRef<GamePhase>(phase);
  const lastStatusRef = useRef<GestureStatus>({ kind: 'none' });
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
  const onStableRef = useRef(onStableGesture);
  onStableRef.current = onStableGesture;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

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

      if (!gestureService.isWarmedUp()) {
        if (gestureService.warmup(video, timestamp)) {
          // warm-up only once per service lifecycle
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

        // Clear skeleton overlay
        const canvas = landmarkCanvasRef?.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (import.meta.env.DEV) {
          setDebugInfo({
            label: 'None',
            confidence: 0,
            margin: 0,
            voteRatio: 0,
            weightedMargin: 0,
            consecutiveCount: 0,
            motion: 0,
            globalMotion: 0,
            poseMotion: 0,
            status: newStatus,
            serviceStatus: gestureService.getStatus(),
            rejectionReason: 'no_hand',
            blockReason: 'no_hand',
            mediapipeLabel: null,
            mediapipeConfidence: 0,
            classificationSource: null,
          });
        }
        return;
      }

      const normalized = normalizeHandLandmarks(
        result.landmarks[0],
        result.handedness[0]?.label
      );

      const motionState = motionTrackerRef.current.update(result.landmarks[0], normalized);

      if (motionState.enteringMoving) {
        stableBufferRef.current.reset();
      }

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
            margin: 0,
            voteRatio: 0,
            weightedMargin: 0,
            consecutiveCount: 0,
            motion: motionState.motion,
            globalMotion: motionState.globalMotion,
            poseMotion: motionState.poseMotion,
            status: newStatus,
            serviceStatus: gestureService.getStatus(),
            rejectionReason: 'low_landmark_quality',
            blockReason: 'low_landmark_quality',
            mediapipeLabel: result.gestures[0]?.label ?? null,
            mediapipeConfidence: result.gestures[0]?.confidence ?? 0,
            classificationSource: null,
          });
        }

        return;
      }

      // ── Primary: MediaPipe built-in gesture classifier ──
      const topGesture = result.gestures[0];
      let mediapipeMove: RpsMove | null = null;
      let mediapipeConfidence = 0;
      let mediapipeMargin = 0;

      if (
        topGesture &&
        topGesture.confidence >= GESTURE_CONFIG.MEDIAPIPE_MIN_CONFIDENCE &&
        MEDIAPIPE_LABEL_TO_MOVE[topGesture.label]
      ) {
        mediapipeMove = MEDIAPIPE_LABEL_TO_MOVE[topGesture.label];
        mediapipeConfidence = topGesture.confidence;
        // Margin: gap between top and second-best gesture candidate
        const secondGesture = result.gestures[1];
        mediapipeMargin = secondGesture
          ? topGesture.confidence - secondGesture.confidence
          : topGesture.confidence; // only one candidate → max margin
      }

      // ── Classification selection: MediaPipe primary, geometry fallback ──
      let activeMove: RpsMove | null;
      let activeConfidence: number;
      let activeMargin: number;
      let classificationSource: 'mediapipe' | 'geometry';
      let rejectionReason: string | null = null;

      if (mediapipeMove) {
        // MediaPipe primary — skip geometry entirely
        activeMove = mediapipeMove;
        activeConfidence = mediapipeConfidence;
        activeMargin = mediapipeMargin;
        classificationSource = 'mediapipe';
      } else {
        // FALLBACK: geometry classifier — remove when MediaPipe is proven sufficient
        const geoResult = classifyNormalizedHand(normalized);
        activeMove = geoResult.move;
        activeConfidence = geoResult.confidence;
        activeMargin = geoResult.margin;
        classificationSource = 'geometry';
        rejectionReason = geoResult.rejectionReason;
      }

      // ── Fast-lock path (source-aware) ──
      if (
        phaseRef.current === 'capture' &&
        motionState.canFastLock &&
        activeMove
      ) {
        const fastLockOk = classificationSource === 'mediapipe'
          // MediaPipe path: confidence + margin only (no geometry quality concept)
          ? activeConfidence >= GESTURE_CONFIG.CAPTURE_FAST_CONFIDENCE
            && activeMargin >= GESTURE_CONFIG.CLASSIFIER_MIN_MARGIN
          // Geometry path: original full check including landmark quality
          : activeConfidence >= GESTURE_CONFIG.CAPTURE_FAST_CONFIDENCE
            && activeMargin >= GESTURE_CONFIG.CLASSIFIER_MIN_MARGIN
            && normalized.quality >= GESTURE_CONFIG.LANDMARK_QUALITY_THRESHOLD;

        if (fastLockOk) {
          stableBufferRef.current.reset();
          const fastStatus: GestureStatus = {
            kind: 'stable',
            move: activeMove,
            confidence: activeConfidence,
          };

          emitGestureStatus(fastStatus);
          onStableRef.current?.(activeMove);

          // Draw skeleton in brand green (stable)
          this_drawSkeleton(video, '#4db868');

          if (import.meta.env.DEV) {
            setDebugInfo({
              label: activeMove,
              confidence: activeConfidence,
              margin: activeMargin,
              voteRatio: 1,
              weightedMargin: 1,
              consecutiveCount: 1,
              motion: motionState.motion,
              globalMotion: motionState.globalMotion,
              poseMotion: motionState.poseMotion,
              status: fastStatus,
              serviceStatus: gestureService.getStatus(),
              rejectionReason,
              blockReason: null,
              mediapipeLabel: topGesture?.label ?? null,
              mediapipeConfidence: topGesture?.confidence ?? 0,
              classificationSource,
            });
          }

          return;
        }
      }

      // ── Feed into temporal consensus buffer ──
      if (motionState.moving) {
        stableBufferRef.current.push(null);
      } else if (activeMove) {
        stableBufferRef.current.push({
          move: activeMove,
          confidence: activeConfidence,
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
          move: activeMove,
          confidence: activeConfidence,
        };
      }

      emitGestureStatus(newStatus);

      // ── Draw hand skeleton overlay (imperative, no React state) ──
      const isStable = newStatus.kind === 'stable';
      this_drawSkeleton(video, isStable ? '#4db868' : 'rgba(255, 255, 255, 0.7)');

      const blockReason = motionState.moving
        ? 'moving'
        : rejectionReason ?? null;

      if (import.meta.env.DEV) {
        setDebugInfo({
          label: activeMove ?? 'Unknown',
          confidence: activeConfidence,
          margin: activeMargin,
          voteRatio: consensus.weightedScore,
          weightedMargin: consensus.weightedMargin,
          consecutiveCount: consensus.consecutiveCount,
          motion: motionState.motion,
          globalMotion: motionState.globalMotion,
          poseMotion: motionState.poseMotion,
          status: newStatus,
          serviceStatus: gestureService.getStatus(),
          rejectionReason,
          blockReason,
          mediapipeLabel: topGesture?.label ?? null,
          mediapipeConfidence: topGesture?.confidence ?? 0,
          classificationSource,
        });
      }

      // ── Helper: draw skeleton to landmark canvas ──
      function this_drawSkeleton(vid: HTMLVideoElement, color: string) {
        const canvas = landmarkCanvasRef?.current;
        const landmarks = result?.landmarks[0];
        if (!canvas || !landmarks) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        drawHandSkeleton(
          ctx,
          landmarks,
          vid.videoWidth || rect.width,
          vid.videoHeight || rect.height,
          rect.width,
          rect.height,
          color,
        );
      }
    },
    [emitGestureStatus, videoRef, landmarkCanvasRef]
  );

  // Main inference loop — prefers requestVideoFrameCallback, falls back to rAF
  useEffect(() => {
    const active = ACTIVE_PHASES.includes(phase) && serviceReady && pageVisible;
    activeRef.current = active;

    if (phase === 'capture' && previousPhaseRef.current !== 'capture') {
      stableBufferRef.current.reset();
      motionTrackerRef.current.reset();
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
      }

      // Clear skeleton when inference stops
      const canvas = landmarkCanvasRef?.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  }, [emitGestureStatus, landmarkCanvasRef, pageVisible, phase, processFrame, serviceReady, videoRef]);

  return { gestureStatus, debugInfo, serviceReady };
}
