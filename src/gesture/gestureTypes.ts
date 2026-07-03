import type { RpsMove } from '../game/gameTypes';

// ============================================================
// Gesture recognition types — internal abstractions
// ============================================================

/** Raw MediaPipe gesture category name */
export type MediaPipeGestureLabel =
  | 'Closed_Fist'
  | 'Open_Palm'
  | 'Victory'
  | 'Pointing_Up'
  | 'Thumb_Down'
  | 'Thumb_Up'
  | 'ILoveYou'
  | 'None'
  | string;

export interface RawGestureResult {
  label: MediaPipeGestureLabel;
  confidence: number;
  landmarks: NormalizedLandmark[][];
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

/** The result after confidence filtering and label mapping */
export interface MappedGesture {
  move: RpsMove;
  confidence: number;
  landmarks: NormalizedLandmark[][];
}

/** Stability buffer result after majority vote */
export interface StabilityResult {
  stable: boolean;
  move: RpsMove | null;
  voteRatio: number;
  consecutiveCount: number;
}

/** What the gesture hook publishes to game logic */
export type GestureStatus =
  | { kind: 'none' }
  | { kind: 'noHand' }
  | { kind: 'detecting'; move: RpsMove | null; confidence: number }
  | { kind: 'stable'; move: RpsMove; confidence: number }
  | { kind: 'moving' }
  | { kind: 'error'; message: string };
