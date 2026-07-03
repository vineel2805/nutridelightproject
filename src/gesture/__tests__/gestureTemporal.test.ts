import { describe, expect, it } from 'vitest';
import {
  GestureMotionTracker,
  TemporalConsensusBuffer,
} from '../gestureTemporal';

function createLandmarks(offsetX = 0, offsetY = 0) {
  return Array.from({ length: 21 }, (_, index) => ({
    x: 0.5 + offsetX + index * 0.001,
    y: 0.5 + offsetY + index * 0.001,
    z: 0,
  }));
}

describe('gestureTemporal', () => {
  it('requires fresh post-capture evidence after reset', () => {
    const buffer = new TemporalConsensusBuffer(5);

    buffer.push({ move: 'rock', confidence: 0.95 });
    buffer.push({ move: 'rock', confidence: 0.95 });
    buffer.push({ move: 'rock', confidence: 0.95 });
    buffer.push({ move: 'rock', confidence: 0.95 });
    buffer.push({ move: 'rock', confidence: 0.95 });

    expect(buffer.evaluate().stable).toBe(true);

    buffer.reset();
    expect(buffer.evaluate().stable).toBe(false);

    buffer.push({ move: 'scissors', confidence: 0.96 });
    expect(buffer.evaluate().stable).toBe(false);

    buffer.push({ move: 'scissors', confidence: 0.96 });
    buffer.push({ move: 'scissors', confidence: 0.96 });

    const result = buffer.evaluate();
    expect(result.stable).toBe(true);
    expect(result.move).toBe('scissors');
  });

  it('rejects fast motion and returns to stable after settling', () => {
    const tracker = new GestureMotionTracker();

    const steady1 = createLandmarks(0, 0);
    const moving1 = createLandmarks(0.04, 0.04);
    const moving2 = createLandmarks(0.08, 0.08);
    const settled = createLandmarks(0.081, 0.081);

    expect(tracker.update(steady1, 0).moving).toBe(false);
    expect(tracker.update(moving1, 100).moving).toBe(true);
    expect(tracker.update(moving2, 200).moving).toBe(true);

    const settle1 = tracker.update(settled, 400);
    expect(settle1.moving).toBe(true);

    expect(tracker.update(createLandmarks(0.0815, 0.0815), 500).moving).toBe(true);

    expect(tracker.update(createLandmarks(0.082, 0.082), 650).moving).toBe(true);

    const settle2 = tracker.update(createLandmarks(0.0825, 0.0825), 800);
    expect(settle2.moving).toBe(false);
  });
});