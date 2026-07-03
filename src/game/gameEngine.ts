import type { RpsMove, RoundOutcome } from './gameTypes';

// ============================================================
// Pure game logic — deterministic, fully unit-testable
// ============================================================

const WIN_MAP: Record<RpsMove, RpsMove> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
};

/**
 * Determine the outcome of a single round.
 * Pure function — no side effects.
 */
export function determineWinner(
  playerMove: RpsMove,
  buddyMove: RpsMove
): RoundOutcome {
  if (playerMove === buddyMove) return 'draw';
  if (WIN_MAP[playerMove] === buddyMove) return 'playerWin';
  return 'buddyWin';
}

const MOVES: RpsMove[] = ['rock', 'paper', 'scissors'];

/**
 * Generate a random Buddy move.
 * Must be committed BEFORE the player's gesture is read.
 */
export function generateBuddyMove(): RpsMove {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

/**
 * Check whether a match is over given the current scores.
 */
export function isMatchOver(
  playerScore: number,
  buddyScore: number,
  winsToMatch: number
): boolean {
  return playerScore >= winsToMatch || buddyScore >= winsToMatch;
}
