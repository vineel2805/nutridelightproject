import type { RpsMove } from '../game/gameTypes';
import type { MediaPipeGestureLabel } from './gestureTypes';
import { GESTURE_CONFIG } from './gestureConfig';

// ============================================================
// MediaPipe label → internal RPS move mapping
// ============================================================

const LABEL_MAP: Partial<Record<string, RpsMove>> = {
  Closed_Fist: 'rock',
  Open_Palm: 'paper',
  Victory: 'scissors',
};

/**
 * Map a raw MediaPipe gesture label and confidence to an RPS move.
 * Returns null if the label is not an RPS move or confidence is too low.
 */
export function mapGestureToMove(
  label: MediaPipeGestureLabel,
  confidence: number
): RpsMove | null {
  if (confidence < GESTURE_CONFIG.CONFIDENCE_THRESHOLD) return null;
  return LABEL_MAP[label] ?? null;
}
