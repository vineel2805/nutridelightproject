// ============================================================
// Centralized gesture recognition configuration
// Change thresholds here — not scattered across components
// ============================================================

export const GESTURE_CONFIG = {
  /** Target inference frequency (Hz) */
  INFERENCE_FPS: 12,

  /** Minimum confidence to accept a MediaPipe prediction */
  CONFIDENCE_THRESHOLD: 0.72,

  /** Number of frames in the stability rolling buffer */
  BUFFER_SIZE: 8,

  /**
   * Fraction of buffer that must agree on the same move
   * e.g. 0.7 means 70% of buffer frames must be the same move
   */
  MIN_VOTE_RATIO: 0.7,

  /**
   * How many consecutive frames must agree before we publish 'stable'
   * (secondary gate to MIN_VOTE_RATIO)
   */
  MIN_CONSECUTIVE: 4,

  /**
   * Maximum wrist displacement (normalized 0-1) between frames
   * before the move is considered "in motion" and not lockable
   */
  MOTION_THRESHOLD: 0.04,

  /** Number of consecutive "moving" results before we suppress stable */
  MOTION_WINDOW: 2,
} as const;

export type GestureConfig = typeof GESTURE_CONFIG;
