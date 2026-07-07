import { describe, expect, it } from 'vitest';
import { resolveBuddySpeechMessage } from '../BuddySpeechBubble';

describe('resolveBuddySpeechMessage', () => {
  it('returns a short waiting message for the start phase', () => {
    expect(resolveBuddySpeechMessage('waitingForStart', null, null, null, null)).toContain('Ready');
  });

  it('returns a move prompt during capture', () => {
    expect(resolveBuddySpeechMessage('capture', null, null, null, 'noHand')).toContain('move');
  });
});
