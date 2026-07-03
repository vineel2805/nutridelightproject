import { describe, it, expect } from 'vitest';
import { mapGestureToMove } from '../gestureMapping';

describe('Gesture Mapping Tests', () => {
  it('should map Closed_Fist to rock above threshold', () => {
    expect(mapGestureToMove('Closed_Fist', 0.8)).toBe('rock');
    expect(mapGestureToMove('Closed_Fist', 0.72)).toBe('rock');
  });

  it('should return null for Closed_Fist below threshold', () => {
    expect(mapGestureToMove('Closed_Fist', 0.70)).toBeNull();
    expect(mapGestureToMove('Closed_Fist', 0.5)).toBeNull();
  });

  it('should map Open_Palm to paper above threshold', () => {
    expect(mapGestureToMove('Open_Palm', 0.9)).toBe('paper');
    expect(mapGestureToMove('Open_Palm', 0.75)).toBe('paper');
  });

  it('should return null for Open_Palm below threshold', () => {
    expect(mapGestureToMove('Open_Palm', 0.71)).toBeNull();
  });

  it('should map Victory to scissors above threshold', () => {
    expect(mapGestureToMove('Victory', 0.85)).toBe('scissors');
  });

  it('should return null for Victory below threshold', () => {
    expect(mapGestureToMove('Victory', 0.69)).toBeNull();
  });

  it('should return null for unmapped gesture labels', () => {
    expect(mapGestureToMove('Thumb_Up', 0.95)).toBeNull();
    expect(mapGestureToMove('Pointing_Up', 0.95)).toBeNull();
    expect(mapGestureToMove('None', 0.99)).toBeNull();
    expect(mapGestureToMove('Unknown_Label', 0.99)).toBeNull();
  });
});
