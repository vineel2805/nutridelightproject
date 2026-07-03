// ============================================================
// Centralized gesture recognition configuration
// Change thresholds here — not scattered across components
// ============================================================

export const GESTURE_CONFIG = {
  /** Target inference frequency (Hz) */
  INFERENCE_FPS: 12,

  /** Legacy confidence threshold used by compatibility helpers */
  CONFIDENCE_THRESHOLD: 0.66,

  /** Minimum confidence for geometric gesture acceptance */
  CLASSIFIER_MIN_CONFIDENCE: 0.66,

  /** Minimum margin between the best and second-best gesture scores */
  CLASSIFIER_MIN_MARGIN: 0.08,

  /** Number of recent predictions used for temporal consensus */
  BUFFER_SIZE: 5,

  /** Legacy majority threshold used by compatibility helpers */
  MIN_VOTE_RATIO: 0.66,

  /**
   * Minimum weighted evidence required for a stable lock.
   */
  MIN_WEIGHTED_SCORE: 0.66,

  /**
   * How much stronger the best gesture must be than the runner-up.
   */
  MIN_WEIGHTED_MARGIN: 0.08,

  /** How many consecutive matching frames are required before lock */
  MIN_CONSECUTIVE: 3,

  /**
   * Motion hysteresis thresholds in normalized image space.
   */
  MOTION_ENTER_THRESHOLD: 0.045,

  /** Exit threshold is lower than enter threshold to prevent oscillation. */
  MOTION_EXIT_THRESHOLD: 0.028,

  /** Legacy motion threshold used by compatibility helpers */
  MOTION_THRESHOLD: 0.028,

  /** Number of recent motion samples used to smooth motion estimates */
  MOTION_HISTORY_SIZE: 3,

  /** Legacy motion window used by compatibility helpers */
  MOTION_WINDOW: 2,

  /** Landmark quality threshold below which the pose is rejected */
  LANDMARK_QUALITY_THRESHOLD: 0.55,
} as const;

export type GestureConfig = typeof GESTURE_CONFIG;
