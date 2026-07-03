import type { NormalizedLandmark } from './gestureTypes';
import type { RpsMove } from '../game/gameTypes';
import { GESTURE_CONFIG } from './gestureConfig';

interface Point2D {
  x: number;
  y: number;
}

interface MotionFrame {
  timestamp: number;
  wrist: Point2D;
  palmCenter: Point2D;
  mcpCenter: Point2D;
}

export interface MotionState {
  motion: number;
  moving: boolean;
  enteringMoving: boolean;
  exitingMoving: boolean;
}

export interface GestureEvidence {
  move: RpsMove;
  confidence: number;
}

export interface ConsensusResult {
  stable: boolean;
  move: RpsMove | null;
  confidence: number;
  weightedScore: number;
  weightedMargin: number;
  consecutiveCount: number;
  evidenceCount: number;
}

const WRIST = 0;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pointFrom(landmark: NormalizedLandmark): Point2D {
  return { x: landmark.x, y: landmark.y };
}

function distance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function average(points: Point2D[]): Point2D {
  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

export class GestureMotionTracker {
  private history: MotionFrame[] = [];
  private motionSamples: number[] = [];
  private moving = false;
  private exitHold = 0;

  reset(): void {
    this.history = [];
    this.motionSamples = [];
    this.moving = false;
    this.exitHold = 0;
  }

  update(landmarks: NormalizedLandmark[], timestamp: number): MotionState {
    if (landmarks.length <= PINKY_MCP) {
      this.reset();
      return {
        motion: 0,
        moving: false,
        enteringMoving: false,
        exitingMoving: false,
      };
    }

    const currentFrame: MotionFrame = {
      timestamp,
      wrist: pointFrom(landmarks[WRIST]),
      palmCenter: average([
        pointFrom(landmarks[WRIST]),
        pointFrom(landmarks[INDEX_MCP]),
        pointFrom(landmarks[MIDDLE_MCP]),
        pointFrom(landmarks[RING_MCP]),
        pointFrom(landmarks[PINKY_MCP]),
      ]),
      mcpCenter: average([
        pointFrom(landmarks[INDEX_MCP]),
        pointFrom(landmarks[MIDDLE_MCP]),
        pointFrom(landmarks[RING_MCP]),
        pointFrom(landmarks[PINKY_MCP]),
      ]),
    };

    const previousFrame = this.history[this.history.length - 1];
    this.history.push(currentFrame);
    if (this.history.length > GESTURE_CONFIG.MOTION_HISTORY_SIZE) {
      this.history.shift();
    }

    if (!previousFrame) {
      return {
        motion: 0,
        moving: this.moving,
        enteringMoving: false,
        exitingMoving: false,
      };
    }

    const dt = Math.max(1, timestamp - previousFrame.timestamp) / 1000;
    const wristVelocity = distance(currentFrame.wrist, previousFrame.wrist) / dt;
    const palmVelocity =
      distance(currentFrame.palmCenter, previousFrame.palmCenter) / dt;
    const mcpVelocity =
      distance(currentFrame.mcpCenter, previousFrame.mcpCenter) / dt;

    const motion =
      wristVelocity * 0.45 + palmVelocity * 0.35 + mcpVelocity * 0.2;

    this.motionSamples.push(motion);
    if (this.motionSamples.length > GESTURE_CONFIG.MOTION_HISTORY_SIZE) {
      this.motionSamples.shift();
    }

    const smoothedMotion =
      this.motionSamples.reduce((sum, sample) => sum + sample, 0) /
      this.motionSamples.length;

    const wasMoving = this.moving;

    if (!this.moving && smoothedMotion >= GESTURE_CONFIG.MOTION_ENTER_THRESHOLD) {
      this.moving = true;
      this.exitHold = 0;
    } else if (this.moving) {
      if (smoothedMotion <= GESTURE_CONFIG.MOTION_EXIT_THRESHOLD) {
        this.exitHold += 1;
        if (this.exitHold >= 2) {
          this.moving = false;
          this.exitHold = 0;
        }
      } else {
        this.exitHold = 0;
      }
    }

    return {
      motion: smoothedMotion,
      moving: this.moving,
      enteringMoving: !wasMoving && this.moving,
      exitingMoving: wasMoving && !this.moving,
    };
  }
}

export class TemporalConsensusBuffer {
  private buffer: (GestureEvidence | null)[];
  private head = 0;
  private consecutiveCount = 0;
  private lastMove: RpsMove | null = null;

  constructor(size: number = GESTURE_CONFIG.BUFFER_SIZE) {
    this.buffer = new Array(size).fill(null);
  }

  reset(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.consecutiveCount = 0;
    this.lastMove = null;
  }

  push(sample: GestureEvidence | null): void {
    this.buffer[this.head] = sample;
    this.head = (this.head + 1) % this.buffer.length;

    if (sample && sample.move === this.lastMove) {
      this.consecutiveCount += 1;
    } else {
      this.consecutiveCount = sample ? 1 : 0;
      this.lastMove = sample ? sample.move : null;
    }
  }

  evaluate(): ConsensusResult {
    const scores: Record<RpsMove, number> = {
      rock: 0,
      paper: 0,
      scissors: 0,
    };

    let evidenceCount = 0;
    let totalWeight = 0;

    for (let i = 0; i < this.buffer.length; i++) {
      const index = (this.head + i) % this.buffer.length;
      const sample = this.buffer[index];
      if (!sample) continue;

      evidenceCount += 1;
      const recency = (i + 1) / this.buffer.length;
      const weight = 0.75 + recency * 0.5;
      const weightedConfidence = weight * clamp(sample.confidence, 0, 1);
      scores[sample.move] += weightedConfidence;
      totalWeight += weight;
    }

    if (evidenceCount === 0 || totalWeight <= 0) {
      return {
        stable: false,
        move: null,
        confidence: 0,
        weightedScore: 0,
        weightedMargin: 0,
        consecutiveCount: 0,
        evidenceCount: 0,
      };
    }

    const sortedScores = (Object.entries(scores) as Array<[RpsMove, number]>)
      .sort((left, right) => right[1] - left[1]);
    const [bestMove, bestScore] = sortedScores[0];
    const secondBestScore = sortedScores[1][1];
    const weightedScore = bestScore / totalWeight;
    const weightedMargin = (bestScore - secondBestScore) / totalWeight;
    const stable =
      weightedScore >= GESTURE_CONFIG.MIN_WEIGHTED_SCORE &&
      weightedMargin >= GESTURE_CONFIG.MIN_WEIGHTED_MARGIN &&
      this.consecutiveCount >= GESTURE_CONFIG.MIN_CONSECUTIVE;

    return {
      stable,
      move: stable ? bestMove : null,
      confidence: weightedScore,
      weightedScore,
      weightedMargin,
      consecutiveCount: this.consecutiveCount,
      evidenceCount,
    };
  }
}