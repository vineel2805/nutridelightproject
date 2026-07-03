import { describe, expect, it } from 'vitest';
import {
  classifyNormalizedHand,
  normalizeHandLandmarks,
  type NormalizedHandFrame,
} from '../rpsGeometry';
import type { NormalizedLandmark } from '../gestureTypes';

function createBlankLandmarks(): NormalizedLandmark[] {
  return Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
}

function createCanonicalFrame(overrides: Partial<NormalizedHandFrame['points'][number]>[] = []): NormalizedHandFrame {
  const points = createBlankLandmarks();

  const assignments: Array<[number, NormalizedLandmark]> = [
    [0, { x: 0, y: 0, z: 0 }],
    [1, { x: 0.14, y: 0.03, z: 0 }],
    [2, { x: 0.22, y: 0.05, z: 0 }],
    [3, { x: 0.28, y: 0.09, z: 0 }],
    [4, { x: 0.34, y: 0.14, z: 0 }],
    [5, { x: 0.18, y: 0.22, z: 0 }],
    [6, { x: 0.20, y: 0.42, z: 0 }],
    [7, { x: 0.22, y: 0.63, z: 0 }],
    [8, { x: 0.24, y: 0.84, z: 0 }],
    [9, { x: 0.00, y: 0.24, z: 0 }],
    [10, { x: 0.01, y: 0.46, z: 0 }],
    [11, { x: 0.02, y: 0.68, z: 0 }],
    [12, { x: 0.03, y: 0.90, z: 0 }],
    [13, { x: -0.18, y: 0.22, z: 0 }],
    [14, { x: -0.20, y: 0.38, z: 0 }],
    [15, { x: -0.22, y: 0.49, z: 0 }],
    [16, { x: -0.24, y: 0.57, z: 0 }],
    [17, { x: -0.34, y: 0.16, z: 0 }],
    [18, { x: -0.36, y: 0.23, z: 0 }],
    [19, { x: -0.38, y: 0.30, z: 0 }],
    [20, { x: -0.40, y: 0.36, z: 0 }],
  ];

  for (const [index, point] of assignments) {
    points[index] = { ...point };
  }

  overrides.forEach((override, index) => {
    if (!override) return;
    points[index] = { ...points[index], ...override };
  });

  return {
    points: points.map((point) => ({ ...point })),
    handedness: 'Right',
    scale: 1,
    quality: 1,
  };
}

function buildRockFrame(): NormalizedHandFrame {
  const frame = createCanonicalFrame();
  frame.points[5] = { x: 0.18, y: 0.22, z: 0 };
  frame.points[6] = { x: 0.23, y: 0.20, z: 0 };
  frame.points[7] = { x: 0.21, y: 0.18, z: 0 };
  frame.points[8] = { x: 0.17, y: 0.17, z: 0 };
  frame.points[9] = { x: 0.00, y: 0.24, z: 0 };
  frame.points[10] = { x: 0.04, y: 0.22, z: 0 };
  frame.points[11] = { x: 0.02, y: 0.20, z: 0 };
  frame.points[12] = { x: -0.02, y: 0.19, z: 0 };
  frame.points[13] = { x: -0.18, y: 0.22, z: 0 };
  frame.points[14] = { x: -0.14, y: 0.20, z: 0 };
  frame.points[15] = { x: -0.16, y: 0.18, z: 0 };
  frame.points[16] = { x: -0.20, y: 0.17, z: 0 };
  frame.points[17] = { x: -0.34, y: 0.16, z: 0 };
  frame.points[18] = { x: -0.30, y: 0.14, z: 0 };
  frame.points[19] = { x: -0.32, y: 0.12, z: 0 };
  frame.points[20] = { x: -0.36, y: 0.11, z: 0 };
  return frame;
}

function buildPaperFrame(): NormalizedHandFrame {
  const frame = createCanonicalFrame();
  frame.points[6] = { x: 0.18, y: 0.42, z: 0 };
  frame.points[7] = { x: 0.18, y: 0.64, z: 0 };
  frame.points[8] = { x: 0.19, y: 0.87, z: 0 };
  frame.points[10] = { x: 0.00, y: 0.46, z: 0 };
  frame.points[11] = { x: 0.00, y: 0.70, z: 0 };
  frame.points[12] = { x: 0.00, y: 0.94, z: 0 };
  frame.points[14] = { x: -0.18, y: 0.43, z: 0 };
  frame.points[15] = { x: -0.18, y: 0.67, z: 0 };
  frame.points[16] = { x: -0.18, y: 0.91, z: 0 };
  frame.points[18] = { x: -0.34, y: 0.40, z: 0 };
  frame.points[19] = { x: -0.34, y: 0.63, z: 0 };
  frame.points[20] = { x: -0.34, y: 0.86, z: 0 };
  return frame;
}

function buildScissorsFrame(): NormalizedHandFrame {
  const frame = createCanonicalFrame();
  frame.points[6] = { x: 0.18, y: 0.41, z: 0 };
  frame.points[7] = { x: 0.19, y: 0.63, z: 0 };
  frame.points[8] = { x: 0.20, y: 0.85, z: 0 };
  frame.points[10] = { x: 0.02, y: 0.45, z: 0 };
  frame.points[11] = { x: 0.03, y: 0.68, z: 0 };
  frame.points[12] = { x: 0.04, y: 0.90, z: 0 };
  frame.points[13] = { x: -0.18, y: 0.22, z: 0 };
  frame.points[14] = { x: -0.14, y: 0.20, z: 0 };
  frame.points[15] = { x: -0.16, y: 0.18, z: 0 };
  frame.points[16] = { x: -0.20, y: 0.17, z: 0 };
  frame.points[17] = { x: -0.34, y: 0.16, z: 0 };
  frame.points[18] = { x: -0.30, y: 0.14, z: 0 };
  frame.points[19] = { x: -0.32, y: 0.12, z: 0 };
  frame.points[20] = { x: -0.36, y: 0.11, z: 0 };
  return frame;
}

function buildUnknownFrame(): NormalizedHandFrame {
  const frame = createCanonicalFrame();
  frame.points[6] = { x: 0.18, y: 0.30, z: 0 };
  frame.points[7] = { x: 0.18, y: 0.28, z: 0 };
  frame.points[8] = { x: 0.18, y: 0.26, z: 0 };
  frame.points[10] = { x: 0.00, y: 0.36, z: 0 };
  frame.points[11] = { x: 0.00, y: 0.34, z: 0 };
  frame.points[12] = { x: 0.00, y: 0.32, z: 0 };
  frame.points[14] = { x: -0.18, y: 0.39, z: 0 };
  frame.points[15] = { x: -0.18, y: 0.36, z: 0 };
  frame.points[16] = { x: -0.18, y: 0.33, z: 0 };
  frame.points[18] = { x: -0.30, y: 0.34, z: 0 };
  frame.points[19] = { x: -0.30, y: 0.31, z: 0 };
  frame.points[20] = { x: -0.30, y: 0.28, z: 0 };
  return frame;
}

describe('rpsGeometry', () => {
  it('normalizes left and right hands into the same canonical orientation', () => {
    const rightRaw = createBlankLandmarks();
    rightRaw[0] = { x: 0.5, y: 0.6, z: 0 };
    rightRaw[5] = { x: 0.62, y: 0.52, z: 0 };
    rightRaw[9] = { x: 0.5, y: 0.42, z: 0 };
    rightRaw[13] = { x: 0.38, y: 0.52, z: 0 };
    rightRaw[17] = { x: 0.3, y: 0.55, z: 0 };
    rightRaw[8] = { x: 0.66, y: 0.18, z: 0 };

    const leftRaw = rightRaw.map((point) => ({
      x: 1 - point.x,
      y: point.y,
      z: point.z,
    }));

    const right = normalizeHandLandmarks(rightRaw, 'Right');
    const left = normalizeHandLandmarks(leftRaw, 'Left');

    expect(right).not.toBeNull();
    expect(left).not.toBeNull();
    expect(Math.abs(right?.points[8].x ?? 0)).toBeCloseTo(
      Math.abs(left?.points[8].x ?? 0),
      4
    );
  });

  it('classifies a clear rock pose', () => {
    const result = classifyNormalizedHand(buildRockFrame());
    expect(result.move).toBe('rock');
    expect(result.confidence).toBeGreaterThanOrEqual(0.66);
  });

  it('classifies a clear paper pose', () => {
    const result = classifyNormalizedHand(buildPaperFrame());
    expect(result.move).toBe('paper');
    expect(result.confidence).toBeGreaterThanOrEqual(0.74);
  });

  it('classifies a clear scissors pose', () => {
    const result = classifyNormalizedHand(buildScissorsFrame());
    expect(result.move).toBe('scissors');
    expect(result.confidence).toBeGreaterThanOrEqual(0.66);
  });

  it('rejects ambiguous or transitional poses as unknown', () => {
    const result = classifyNormalizedHand(buildUnknownFrame());
    expect(result.move).toBeNull();
    expect(result.rejectionReason).not.toBeNull();
  });
});