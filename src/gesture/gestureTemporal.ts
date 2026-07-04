import type { NormalizedLandmark } from './gestureTypes';
import type { RpsMove } from '../game/gameTypes';
import type { NormalizedHandFrame } from './rpsGeometry';
import { GESTURE_CONFIG } from './gestureConfig';

interface Point2D {
  x: number;
  y: number;
}

interface MotionFrame {
  wrist: Point2D;
  palmCenter: Point2D;
  mcpCenter: Point2D;
  scale: number;
  normalizedPoints: Point2D[];
}

export interface MotionState {
  motion: number;
  globalMotion: number;
  poseMotion: number;
  moving: boolean;
  enteringMoving: boolean;
  exitingMoving: boolean;
  canFastLock: boolean;
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
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

const JITTER_DEAD_ZONE = 0.008;
const POSE_DEAD_ZONE = 0.012;
const ENTER_STRONG_THRESHOLD = 0.16;
const ENTER_THRESHOLD = 0.06;
const EXIT_THRESHOLD = 0.03;
const EXIT_LOW_FRAMES = 1;
const FAST_LOCK_MAX_MOTION = 0.028;

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

function subtract(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

function magnitude(vector: Point2D): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
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

function deadZone(value: number, threshold: number): number {
  return value > threshold ? value - threshold : 0;
}

function keyPosePointIndices(): number[] {
  return [INDEX_PIP, INDEX_TIP, MIDDLE_PIP, MIDDLE_TIP, RING_PIP, RING_TIP, PINKY_PIP, PINKY_TIP];
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

  update(landmarks: NormalizedLandmark[], normalizedFrame: NormalizedHandFrame | null): MotionState {
    if (landmarks.length <= PINKY_TIP) {
      this.reset();
      return {
        motion: 0,
        globalMotion: 0,
        poseMotion: 0,
        moving: false,
        enteringMoving: false,
        exitingMoving: false,
        canFastLock: false,
      };
    }

    const scale = Math.max(normalizedFrame?.scale ?? distance(landmarks[WRIST], landmarks[MIDDLE_MCP]), 0.0001);

    const currentFrame: MotionFrame = {
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
      scale,
      normalizedPoints: normalizedFrame?.points ?? [],
    };

    const previousFrame = this.history[this.history.length - 1];
    this.history.push(currentFrame);
    if (this.history.length > GESTURE_CONFIG.MOTION_HISTORY_SIZE) {
      this.history.shift();
    }

    if (!previousFrame) {
      return {
        motion: 0,
        globalMotion: 0,
        poseMotion: 0,
        moving: this.moving,
        enteringMoving: false,
        exitingMoving: false,
        canFastLock: true,
      };
    }

    const averageScale = Math.max((currentFrame.scale + previousFrame.scale) / 2, 0.0001);

    const wristShift = distance(currentFrame.wrist, previousFrame.wrist) / averageScale;
    const palmShift = distance(currentFrame.palmCenter, previousFrame.palmCenter) / averageScale;
    const mcpShift = distance(currentFrame.mcpCenter, previousFrame.mcpCenter) / averageScale;

    const rawGlobalMotion = wristShift * 0.25 + palmShift * 0.45 + mcpShift * 0.3;
    const globalMotion = deadZone(rawGlobalMotion, JITTER_DEAD_ZONE);

    let poseDelta = 0;
    let poseSamples = 0;
    if (currentFrame.normalizedPoints.length >= 21 && previousFrame.normalizedPoints.length >= 21) {
      const keyIndices = keyPosePointIndices();
      for (const index of keyIndices) {
        const current = currentFrame.normalizedPoints[index];
        const previous = previousFrame.normalizedPoints[index];
        poseDelta += magnitude(subtract(current, previous));
        poseSamples += 1;
      }
    }

    const rawPoseMotion = poseSamples > 0 ? poseDelta / poseSamples : 0;
    const poseMotion = deadZone(rawPoseMotion, POSE_DEAD_ZONE);

    const motion = poseMotion * 0.7 + globalMotion * 0.3;

    this.motionSamples.push(motion);
    if (this.motionSamples.length > GESTURE_CONFIG.MOTION_HISTORY_SIZE) {
      this.motionSamples.shift();
    }

    const smoothedMotion =
      this.motionSamples.reduce((sum, sample) => sum + sample, 0) /
      this.motionSamples.length;

    const wasMoving = this.moving;
    const strongMotion = rawGlobalMotion >= ENTER_STRONG_THRESHOLD || rawPoseMotion >= ENTER_STRONG_THRESHOLD;

    if (!this.moving && (strongMotion || smoothedMotion >= ENTER_THRESHOLD)) {
      this.moving = true;
      this.exitHold = 0;
    } else if (this.moving) {
      if (smoothedMotion <= EXIT_THRESHOLD) {
        this.exitHold += 1;
        if (this.exitHold >= EXIT_LOW_FRAMES) {
          this.moving = false;
          this.exitHold = 0;
        }
      } else {
        this.exitHold = 0;
      }
    }

    return {
      motion: smoothedMotion,
      globalMotion: rawGlobalMotion,
      poseMotion: rawPoseMotion,
      moving: this.moving,
      enteringMoving: !wasMoving && this.moving,
      exitingMoving: wasMoving && !this.moving,
      canFastLock:
        !this.moving &&
        smoothedMotion <= FAST_LOCK_MAX_MOTION &&
        rawPoseMotion <= FAST_LOCK_MAX_MOTION,
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
      scores[sample.move] += weight * clamp(sample.confidence, 0, 1);
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

    const sortedScores = (Object.entries(scores) as Array<[RpsMove, number]>).sort(
      (left, right) => right[1] - left[1]
    );
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