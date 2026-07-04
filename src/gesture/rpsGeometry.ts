import type { RpsMove } from '../game/gameTypes';
import type { NormalizedLandmark } from './gestureTypes';
import { GESTURE_CONFIG } from './gestureConfig';

const LANDMARK_COUNT = 21;
const EDGE_MARGIN = 0.03;

const WRIST = 0;
const THUMB_CMC = 1;
const THUMB_MCP = 2;
const THUMB_IP = 3;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_DIP = 7;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_DIP = 11;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_DIP = 15;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_DIP = 19;
const PINKY_TIP = 20;

type HandednessLabel = 'Left' | 'Right' | 'Unknown';

interface Vector2 {
  x: number;
  y: number;
}

interface NormalizedPoint extends Vector2 {
  z: number;
}

export interface NormalizedHandFrame {
  points: NormalizedPoint[];
  handedness: HandednessLabel;
  scale: number;
  quality: number;
}

export interface FingerFeature {
  extension: number;
  curl: number;
  tipDistance: number;
  jointAngle: number;
}

export interface HandFeatureSet {
  quality: number;
  indexMiddleSeparation: number;
  middleRingSeparation: number;
  ringPinkySeparation: number;
  thumbIndexSeparation: number;
  palmCompactness: number;
  fingers: {
    thumb: FingerFeature;
    index: FingerFeature;
    middle: FingerFeature;
    ring: FingerFeature;
    pinky: FingerFeature;
  };
}

export interface RpsClassificationResult {
  move: RpsMove | null;
  confidence: number;
  margin: number;
  rejectionReason: string | null;
  scores: Record<RpsMove, number>;
  features: HandFeatureSet;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function magnitude(vector: Vector2): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

function normalize(vector: Vector2): Vector2 | null {
  const length = magnitude(vector);
  if (length < 1e-6) return null;
  return { x: vector.x / length, y: vector.y / length };
}

function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(vector: Vector2, factor: number): Vector2 {
  return { x: vector.x * factor, y: vector.y * factor };
}

function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

function perpendicular(vector: Vector2): Vector2 {
  return { x: -vector.y, y: vector.x };
}

function angleAt(a: Vector2, b: Vector2, c: Vector2): number {
  const ba = subtract(a, b);
  const bc = subtract(c, b);
  const baLength = magnitude(ba);
  const bcLength = magnitude(bc);

  if (baLength < 1e-6 || bcLength < 1e-6) return 0;

  const cosine = clamp(dot(ba, bc) / (baLength * bcLength), -1, 1);
  return Math.acos(cosine);
}

function angleScore(angleRadians: number): number {
  const angleDegrees = (angleRadians * 180) / Math.PI;
  return clamp((angleDegrees - 90) / 75, 0, 1);
}

function pointFromLandmark(landmark: NormalizedLandmark): Vector2 {
  return { x: landmark.x, y: landmark.y };
}

function averagePoints(points: Vector2[]): Vector2 {
  const total = points.reduce(
    (accumulator, point) => add(accumulator, point),
    { x: 0, y: 0 }
  );
  return scale(total, 1 / points.length);
}

function isEdgePoint(point: Vector2): boolean {
  return (
    point.x <= EDGE_MARGIN ||
    point.x >= 1 - EDGE_MARGIN ||
    point.y <= EDGE_MARGIN ||
    point.y >= 1 - EDGE_MARGIN
  );
}

function projectPoint(
  point: NormalizedLandmark,
  origin: Vector2,
  xBasis: Vector2,
  yBasis: Vector2,
  scaleFactor: number
): NormalizedPoint {
  const relative = subtract(pointFromLandmark(point), origin);
  return {
    x: dot(relative, xBasis) / scaleFactor,
    y: dot(relative, yBasis) / scaleFactor,
    z: (point.z ?? 0) / scaleFactor,
  };
}

function normalizeHandedness(label?: string): HandednessLabel {
  if (label === 'Left' || label === 'Right') return label;
  return 'Unknown';
}

function computeFingerFeature(
  points: NormalizedPoint[],
  mcp: number,
  pip: number,
  dip: number,
  tip: number,
  palmCenter: Vector2
): FingerFeature {
  const pipAngle = angleAt(points[mcp], points[pip], points[dip]);
  const dipAngle = angleAt(points[pip], points[dip], points[tip]);
  const jointAngle = (pipAngle + dipAngle) / 2;

  const straightness = (angleScore(pipAngle) + angleScore(dipAngle)) / 2;
  const baseDistance = distance(points[mcp], palmCenter);
  const tipDistance = distance(points[tip], palmCenter);
  const tipDistanceScore = clamp((tipDistance - baseDistance) / 0.65, 0, 1);
  const extension = clamp(straightness * 0.7 + tipDistanceScore * 0.3, 0, 1);

  return {
    extension,
    curl: 1 - extension,
    tipDistance,
    jointAngle,
  };
}

export function normalizeHandLandmarks(
  landmarks: NormalizedLandmark[],
  handednessLabel?: string
): NormalizedHandFrame | null {
  if (!landmarks || landmarks.length < LANDMARK_COUNT) return null;

  const wrist = landmarks[WRIST];
  const indexMcp = landmarks[INDEX_MCP];
  const middleMcp = landmarks[MIDDLE_MCP];
  const ringMcp = landmarks[RING_MCP];
  const pinkyMcp = landmarks[PINKY_MCP];

  if (!wrist || !indexMcp || !middleMcp || !ringMcp || !pinkyMcp) {
    return null;
  }

  const primaryScale = distance(wrist, middleMcp);
  const secondaryScale = distance(indexMcp, pinkyMcp);
  const fallbackScale =
    (distance(wrist, indexMcp) + distance(wrist, pinkyMcp)) / 2;

  const validScaleCandidates = [primaryScale, secondaryScale, fallbackScale].filter(
    (value) => value > 1e-4
  );

  if (validScaleCandidates.length === 0) return null;

  const scaleFactor =
    validScaleCandidates.reduce((sum, value) => sum + value, 0) /
    validScaleCandidates.length;

  if (scaleFactor < 0.01) return null;

  let xBasis = normalize(subtract(indexMcp, pinkyMcp));
  let yBasis = normalize(subtract(middleMcp, wrist));

  if (!xBasis && !yBasis) return null;
  if (!xBasis && yBasis) xBasis = perpendicular(yBasis);
  if (!yBasis && xBasis) yBasis = perpendicular(xBasis);

  if (!xBasis || !yBasis) return null;

  const xOrthogonal = subtract(xBasis, scale(yBasis, dot(xBasis, yBasis)));
  const xOrthoNormalized = normalize(xOrthogonal);
  if (xOrthoNormalized) {
    xBasis = xOrthoNormalized;
  }

  const qualityPenalty = [
    wrist,
    indexMcp,
    middleMcp,
    ringMcp,
    pinkyMcp,
    landmarks[INDEX_TIP],
    landmarks[MIDDLE_TIP],
    landmarks[RING_TIP],
    landmarks[PINKY_TIP],
  ].filter((point) => isEdgePoint(point)).length;

  const quality = clamp(1 - qualityPenalty * 0.18, 0, 1);
  const handedness = normalizeHandedness(handednessLabel);

  const points = landmarks.map((landmark) =>
    projectPoint(landmark, wrist, xBasis!, yBasis!, scaleFactor)
  );

  return {
    points,
    handedness,
    scale: scaleFactor,
    quality,
  };
}

export function extractHandFeatures(frame: NormalizedHandFrame): HandFeatureSet {
  const points = frame.points;
  const palmCenter = averagePoints([
    points[WRIST],
    points[INDEX_MCP],
    points[MIDDLE_MCP],
    points[RING_MCP],
    points[PINKY_MCP],
  ]);

  const thumb = computeFingerFeature(
    points,
    THUMB_CMC,
    THUMB_MCP,
    THUMB_IP,
    THUMB_TIP,
    palmCenter
  );
  const index = computeFingerFeature(
    points,
    INDEX_MCP,
    INDEX_PIP,
    INDEX_DIP,
    INDEX_TIP,
    palmCenter
  );
  const middle = computeFingerFeature(
    points,
    MIDDLE_MCP,
    MIDDLE_PIP,
    MIDDLE_DIP,
    MIDDLE_TIP,
    palmCenter
  );
  const ring = computeFingerFeature(
    points,
    RING_MCP,
    RING_PIP,
    RING_DIP,
    RING_TIP,
    palmCenter
  );
  const pinky = computeFingerFeature(
    points,
    PINKY_MCP,
    PINKY_PIP,
    PINKY_DIP,
    PINKY_TIP,
    palmCenter
  );

  const indexMiddleSeparation = distance(points[INDEX_TIP], points[MIDDLE_TIP]);
  const middleRingSeparation = distance(points[MIDDLE_TIP], points[RING_TIP]);
  const ringPinkySeparation = distance(points[RING_TIP], points[PINKY_TIP]);
  const thumbIndexSeparation = distance(points[THUMB_TIP], points[INDEX_TIP]);
  const palmCompactness =
    1 -
    clamp(
      (index.tipDistance + middle.tipDistance + ring.tipDistance + pinky.tipDistance) /
        4,
      0,
      1.2
    );

  return {
    quality: frame.quality,
    indexMiddleSeparation,
    middleRingSeparation,
    ringPinkySeparation,
    thumbIndexSeparation,
    palmCompactness,
    fingers: {
      thumb,
      index,
      middle,
      ring,
      pinky,
    },
  };
}

function scoreRock(features: HandFeatureSet): number {
  const { index, middle, ring, pinky } = features.fingers;
  const curledAverage =
    (index.curl + middle.curl + ring.curl + pinky.curl) / 4;
  const compactnessScore = clamp(features.palmCompactness, 0, 1);
  return clamp(curledAverage * 0.82 + compactnessScore * 0.18, 0, 1);
}

function scorePaper(features: HandFeatureSet): number {
  const { index, middle, ring, pinky } = features.fingers;
  const openAverage =
    (index.extension + middle.extension + ring.extension + pinky.extension) / 4;
  const spreadScore = clamp(
    ((features.indexMiddleSeparation + features.middleRingSeparation + features.ringPinkySeparation) / 3 -
      0.06) /
      0.2,
    0,
    1
  );
  return clamp(openAverage * 0.84 + spreadScore * 0.16, 0, 1);
}

function scoreScissors(features: HandFeatureSet): number {
  const { index, middle, ring, pinky } = features.fingers;
  const patternScore =
    (index.extension + middle.extension + ring.curl + pinky.curl) / 4;
  const separationScore = clamp(
    (features.indexMiddleSeparation - 0.05) / 0.16,
    0,
    1
  );
  return clamp(patternScore * 0.7 + separationScore * 0.3, 0, 1);
}

function getSecondBestScore(scores: Record<RpsMove, number>, bestMove: RpsMove): number {
  return (['rock', 'paper', 'scissors'] as RpsMove[])
    .filter((move) => move !== bestMove)
    .map((move) => scores[move])
    .reduce((highest, score) => Math.max(highest, score), 0);
}

export function classifyNormalizedHand(
  frame: NormalizedHandFrame
): RpsClassificationResult {
  const features = extractHandFeatures(frame);

  if (features.quality < GESTURE_CONFIG.LANDMARK_QUALITY_THRESHOLD) {
    return {
      move: null,
      confidence: 0,
      margin: 0,
      rejectionReason: 'low_landmark_quality',
      scores: { rock: 0, paper: 0, scissors: 0 },
      features,
    };
  }

  const scores: Record<RpsMove, number> = {
    rock: scoreRock(features),
    paper: scorePaper(features),
    scissors: scoreScissors(features),
  };

  const bestMoveEntry = (Object.entries(scores) as Array<[RpsMove, number]>).reduce(
    (winner, entry) => (entry[1] > winner[1] ? entry : winner),
    ['rock', scores.rock]
  ) as [RpsMove, number];

  const [move, confidence] = bestMoveEntry;
  const secondBest = getSecondBestScore(scores, move);
  const margin = confidence - secondBest;

  const { index, middle, ring, pinky } = features.fingers;
  const extensionCount = [index, middle, ring, pinky].filter(
    (finger) => finger.extension >= 0.62
  ).length;
  const curledCount = [index, middle, ring, pinky].filter(
    (finger) => finger.curl >= 0.62
  ).length;

  const rockAccepted =
    curledCount >= 3 &&
    extensionCount <= 1 &&
    scores.rock >= GESTURE_CONFIG.CLASSIFIER_MIN_CONFIDENCE;

  const paperAccepted =
    extensionCount >= 3 &&
    index.extension >= 0.42 &&
    middle.extension >= 0.42 &&
    ring.extension >= 0.42 &&
    pinky.extension >= 0.42 &&
    scores.paper >= GESTURE_CONFIG.CLASSIFIER_MIN_CONFIDENCE;

  const scissorsAccepted =
    index.extension >= 0.56 &&
    middle.extension >= 0.56 &&
    ring.extension <= 0.5 &&
    pinky.extension <= 0.5 &&
    scores.scissors >= GESTURE_CONFIG.CLASSIFIER_MIN_CONFIDENCE;

  const accepted =
    (move === 'rock' && rockAccepted) ||
    (move === 'paper' && paperAccepted) ||
    (move === 'scissors' && scissorsAccepted);

  if (!accepted) {
    return {
      move: null,
      confidence,
      margin: confidence - secondBest,
      rejectionReason: 'no_pattern_match',
      scores,
      features,
    };
  }

  if (
    confidence < GESTURE_CONFIG.CLASSIFIER_MIN_CONFIDENCE ||
    margin < GESTURE_CONFIG.CLASSIFIER_MIN_MARGIN
  ) {
    return {
      move: null,
      confidence,
      margin,
      rejectionReason: 'low_margin',
      scores,
      features,
    };
  }

  return {
    move,
    confidence,
    margin,
    rejectionReason: null,
    scores,
    features,
  };
}