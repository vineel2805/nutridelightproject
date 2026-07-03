// ============================================================
// Audio event manifest — named events map to asset paths
// Add real audio clips here in production
// ============================================================

export type AudioEvent =
  | 'welcome'
  | 'countdown1'
  | 'countdown2'
  | 'countdown3'
  | 'go'
  | 'playerRoundWin'
  | 'buddyRoundWin'
  | 'draw'
  | 'noMove'
  | 'playerMatchWin'
  | 'buddyMatchWin';

/**
 * Map audio event names to asset file paths.
 * Missing entries will fail gracefully (no error, no block).
 * Paths are relative to /public/audio/
 */
export const AUDIO_MANIFEST: Partial<Record<AudioEvent, string>> = {
  // Uncomment and add real audio files as they become available:
  // welcome: '/audio/welcome.mp3',
  // countdown1: '/audio/1.mp3',
  // countdown2: '/audio/2.mp3',
  // countdown3: '/audio/3.mp3',
  // go: '/audio/go.mp3',
  // playerRoundWin: '/audio/player_round_win.mp3',
  // buddyRoundWin: '/audio/buddy_round_win.mp3',
  // draw: '/audio/draw.mp3',
  // noMove: '/audio/no_move.mp3',
  // playerMatchWin: '/audio/player_match_win.mp3',
  // buddyMatchWin: '/audio/buddy_match_win.mp3',
};
