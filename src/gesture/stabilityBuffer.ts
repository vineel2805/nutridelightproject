import type { RpsMove } from '../game/gameTypes';
import type { NormalizedLandmark, StabilityResult } from './gestureTypes';
import { GESTURE_CONFIG } from './gestureConfig';

// ============================================================
// Stability rolling buffer
// ============================================================

/**
 * Circular buffer of recent mapped move predictions.
 * Null entries represent frames where no valid move was detected.
 */
export class StabilityBuffer {
  private buffer: (RpsMove | null)[];
  private head: number = 0;
  private consecutiveCount: number = 0;
  private size: number;
  private lastMove: RpsMove | null = null;

  constructor(size: number = GESTURE_CONFIG.BUFFER_SIZE) {
    this.size = size;
    this.buffer = new Array(size).fill(null);
  }

  /** Add a new prediction to the buffer */
  push(move: RpsMove | null): void {
    this.buffer[this.head] = move;
    this.head = (this.head + 1) % this.size;

    if (move !== null && move === this.lastMove) {
      this.consecutiveCount++;
    } else {
      this.consecutiveCount = move !== null ? 1 : 0;
      this.lastMove = move;
    }
  }

  /** Compute majority vote result */
  evaluate(): StabilityResult {
    const counts: Record<string, number> = {};
    let total = 0;

    for (const m of this.buffer) {
      if (m !== null) {
        counts[m] = (counts[m] ?? 0) + 1;
        total++;
      }
    }

    if (total === 0) {
      return { stable: false, move: null, voteRatio: 0, consecutiveCount: 0 };
    }

    // Find the majority move
    let bestMove: RpsMove | null = null;
    let bestCount = 0;
    for (const [move, count] of Object.entries(counts)) {
      if (count > bestCount) {
        bestCount = count;
        bestMove = move as RpsMove;
      }
    }

    const voteRatio = bestCount / this.size; // vs total buffer size
    const stable =
      voteRatio >= GESTURE_CONFIG.MIN_VOTE_RATIO &&
      this.consecutiveCount >= GESTURE_CONFIG.MIN_CONSECUTIVE &&
      bestMove !== null;

    return {
      stable,
      move: bestMove,
      voteRatio,
      consecutiveCount: this.consecutiveCount,
    };
  }

  /** Clear the buffer (e.g., on phase change) */
  clear(): void {
    this.buffer = new Array(this.size).fill(null);
    this.head = 0;
    this.consecutiveCount = 0;
    this.lastMove = null;
  }
}

// ============================================================
// Motion analyzer
// ============================================================

/** WRIST landmark index in MediaPipe hand model */
const WRIST_INDEX = 0;

/**
 * Compute the Euclidean distance of the wrist between two landmark frames.
 * Returns 0 if landmarks are unavailable.
 */
export function computeWristMotion(
  prevLandmarks: NormalizedLandmark[][] | null,
  currLandmarks: NormalizedLandmark[][]
): number {
  if (!prevLandmarks || prevLandmarks.length === 0 || currLandmarks.length === 0) {
    return 0;
  }
  const prev = prevLandmarks[0]?.[WRIST_INDEX];
  const curr = currLandmarks[0]?.[WRIST_INDEX];
  if (!prev || !curr) return 0;

  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Returns true if the hand is moving too fast to lock a gesture.
 */
export function isHandMoving(motion: number): boolean {
  return motion > GESTURE_CONFIG.MOTION_THRESHOLD;
}
