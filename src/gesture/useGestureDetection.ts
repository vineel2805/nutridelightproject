import { useEffect, useRef, useCallback, useState } from 'react';
import { gestureService } from './GestureRecognizerService';
import { mapGestureToMove } from './gestureMapping';
import {
  StabilityBuffer,
  computeWristMotion,
  isHandMoving,
} from './stabilityBuffer';
import { GESTURE_CONFIG } from './gestureConfig';
import type { GestureStatus, NormalizedLandmark } from './gestureTypes';
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
  consecutiveCount: number;
  motion: number;
  status: GestureStatus;
  serviceStatus: string;
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

  const stableBufferRef = useRef(new StabilityBuffer());
  const prevLandmarksRef = useRef<NormalizedLandmark[][] | null>(null);
  const lastInferenceTime = useRef(0);
  const rafRef = useRef<number | null>(null);
  const rvfcRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const onStableRef = useRef(onStableGesture);
  onStableRef.current = onStableGesture;

  // Initialize MediaPipe service on mount
  useEffect(() => {
    gestureService
      .initialize()
      .then(() => setServiceReady(true))
      .catch(() => {
        setGestureStatus({ kind: 'error', message: 'Gesture model failed to load' });
      });

    return () => {
      gestureService.destroy();
    };
  }, []);

  const processFrame = useCallback(
    (timestamp: number) => {
      if (!activeRef.current) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !gestureService.isReady()) return;

      // Throttle to INFERENCE_FPS
      const minInterval = 1000 / GESTURE_CONFIG.INFERENCE_FPS;
      if (timestamp - lastInferenceTime.current < minInterval) return;
      lastInferenceTime.current = timestamp;

      const result = gestureService.recognize(video, timestamp);

      if (!result) return;

      const hasHand = result.landmarks.length > 0;

      if (!hasHand) {
        stableBufferRef.current.push(null);
        const newStatus: GestureStatus = { kind: 'noHand' };
        setGestureStatus(newStatus);
        setDebugInfo((d) =>
          d ? { ...d, label: 'None', confidence: 0, status: newStatus } : null
        );
        prevLandmarksRef.current = null;
        return;
      }

      const topGesture = result.gestures[0];
      const label = topGesture?.label ?? 'None';
      const confidence = topGesture?.confidence ?? 0;

      const mappedMove = mapGestureToMove(label, confidence);

      // Motion check
      const motion = computeWristMotion(prevLandmarksRef.current, result.landmarks);
      prevLandmarksRef.current = result.landmarks;
      const moving = isHandMoving(motion);

      // Push to stability buffer (null if moving or no valid move)
      stableBufferRef.current.push(moving ? null : mappedMove);
      const stability = stableBufferRef.current.evaluate();

      let newStatus: GestureStatus;
      if (moving) {
        newStatus = { kind: 'moving' };
      } else if (stability.stable && stability.move) {
        newStatus = { kind: 'stable', move: stability.move, confidence };
        onStableRef.current?.(stability.move);
      } else {
        newStatus = { kind: 'detecting', move: mappedMove, confidence };
      }

      setGestureStatus(newStatus);
      setDebugInfo({
        label,
        confidence,
        voteRatio: stability.voteRatio,
        consecutiveCount: stability.consecutiveCount,
        motion,
        status: newStatus,
        serviceStatus: gestureService.getStatus(),
      });
    },
    [videoRef]
  );

  // Main inference loop — prefers requestVideoFrameCallback, falls back to rAF
  useEffect(() => {
    const active = ACTIVE_PHASES.includes(phase) && serviceReady;
    activeRef.current = active;

    if (!active) {
      stableBufferRef.current.clear();
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
  }, [phase, serviceReady, processFrame, videoRef]);

  return { gestureStatus, debugInfo, serviceReady };
}
