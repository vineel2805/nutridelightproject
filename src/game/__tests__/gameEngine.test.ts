import { describe, it, expect } from 'vitest';
import { determineWinner, isMatchOver, generateBuddyMove } from '../gameEngine';

describe('Game Engine Tests', () => {
  describe('determineWinner', () => {
    it('should correctly evaluate draw outcomes', () => {
      expect(determineWinner('rock', 'rock')).toBe('draw');
      expect(determineWinner('paper', 'paper')).toBe('draw');
      expect(determineWinner('scissors', 'scissors')).toBe('draw');
    });

    it('should correctly evaluate player wins', () => {
      expect(determineWinner('rock', 'scissors')).toBe('playerWin');
      expect(determineWinner('scissors', 'paper')).toBe('playerWin');
      expect(determineWinner('paper', 'rock')).toBe('playerWin');
    });

    it('should correctly evaluate buddy wins', () => {
      expect(determineWinner('scissors', 'rock')).toBe('buddyWin');
      expect(determineWinner('paper', 'scissors')).toBe('buddyWin');
      expect(determineWinner('rock', 'paper')).toBe('buddyWin');
    });
  });

  describe('generateBuddyMove', () => {
    it('should generate valid moves', () => {
      const validMoves = ['rock', 'paper', 'scissors'];
      for (let i = 0; i < 50; i++) {
        const move = generateBuddyMove();
        expect(validMoves).toContain(move);
      }
    });
  });

  describe('isMatchOver', () => {
    it('should identify when match is over', () => {
      expect(isMatchOver(2, 0, 2)).toBe(true);
      expect(isMatchOver(0, 2, 2)).toBe(true);
      expect(isMatchOver(2, 1, 2)).toBe(true);
      expect(isMatchOver(1, 2, 2)).toBe(true);
      expect(isMatchOver(3, 1, 2)).toBe(true);
    });

    it('should identify when match is not over', () => {
      expect(isMatchOver(0, 0, 2)).toBe(false);
      expect(isMatchOver(1, 0, 2)).toBe(false);
      expect(isMatchOver(0, 1, 2)).toBe(false);
      expect(isMatchOver(1, 1, 2)).toBe(false);
    });
  });
});
