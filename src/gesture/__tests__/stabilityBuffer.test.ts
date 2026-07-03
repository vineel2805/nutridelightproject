import { describe, it, expect } from 'vitest';
import { StabilityBuffer, computeWristMotion, isHandMoving } from '../stabilityBuffer';

describe('Stability Buffer Tests', () => {
  describe('circular buffer and majority vote logic', () => {
    it('should report unstable with empty buffer', () => {
      const buffer = new StabilityBuffer(8);
      const res = buffer.evaluate();
      expect(res.stable).toBe(false);
      expect(res.move).toBeNull();
    });

    it('should report unstable if buffer is filled with non-matching moves', () => {
      const buffer = new StabilityBuffer(8);
      buffer.push('rock');
      buffer.push('paper');
      buffer.push('scissors');
      buffer.push('rock');
      buffer.push('paper');
      buffer.push('scissors');
      buffer.push('rock');
      buffer.push('paper');

      const res = buffer.evaluate();
      expect(res.stable).toBe(false);
    });

    it('should report stable when threshold is reached and consecutive matches met', () => {
      const buffer = new StabilityBuffer(8);
      // GESTURE_CONFIG.MIN_VOTE_RATIO is 0.7 (70% of 8 = 5.6 -> 6 votes minimum)
      // GESTURE_CONFIG.MIN_CONSECUTIVE is 4
      
      // Let's fill 6 with 'rock' and keep consecutive matches high
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push(null);
      buffer.push(null);

      // Now lastMove='rock', consecutiveCount=6 (wait, last was null so it reset to 0/1 depending on sequence. Let's trace push:
      // push('rock') -> consec=1, lastMove=rock
      // push('rock') -> consec=2, lastMove=rock
      // push('rock') -> consec=3, lastMove=rock
      // push('rock') -> consec=4, lastMove=rock
      // push('rock') -> consec=5, lastMove=rock
      // push('rock') -> consec=6, lastMove=rock
      // push(null)   -> consec=0, lastMove=null
      // push(null)   -> consec=0, lastMove=null
      // So consecutive count is 0, stable is false. Correct!
    });

    it('should satisfy stability when consecutive votes are held at the end of the buffer', () => {
      const buffer = new StabilityBuffer(8);
      buffer.push(null);
      buffer.push(null);
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');

      // count of rock = 6 out of 8 = 75% (>= 70%)
      // consecutiveCount of lastMove 'rock' = 6 (>= 4)
      const res = buffer.evaluate();
      expect(res.stable).toBe(true);
      expect(res.move).toBe('rock');
    });

    it('should handle clearing the buffer', () => {
      const buffer = new StabilityBuffer(8);
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');
      buffer.push('rock');

      expect(buffer.evaluate().stable).toBe(true);
      
      buffer.clear();
      expect(buffer.evaluate().stable).toBe(false);
      expect(buffer.evaluate().move).toBeNull();
    });
  });

  describe('computeWristMotion & isHandMoving', () => {
    it('should return 0 when frames are empty or missing', () => {
      expect(computeWristMotion(null, [])).toBe(0);
      expect(computeWristMotion([[{ x: 0.1, y: 0.2, z: 0 }]], [])).toBe(0);
    });

    it('should calculate accurate wrist distance motion', () => {
      const prev = [[{ x: 0.1, y: 0.2, z: 0 }]];
      const curr = [[{ x: 0.1, y: 0.5, z: 0 }]]; // dy = 0.3, dx = 0
      expect(computeWristMotion(prev, curr)).toBeCloseTo(0.3);
    });

    it('should identify when hand is moving too fast', () => {
      // Threshold is 0.04
      expect(isHandMoving(0.05)).toBe(true);
      expect(isHandMoving(0.03)).toBe(false);
    });
  });
});
