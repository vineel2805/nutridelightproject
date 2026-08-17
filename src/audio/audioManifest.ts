// ============================================================
// Audio event manifest — named events map to asset paths
// Add real audio clips here in production
// ============================================================

export type AudioEvent =
  // ── SFX ──
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
  | 'buddyMatchWin'
  // ── Buddy voice lines ──
  | 'buddyGreet'
  | 'buddyCallRock'
  | 'buddyCallPaper'
  | 'buddyCallScissors'
  | 'buddyCallShoot'
  | 'buddyRoundTaunt'
  | 'buddyRoundEncourage'
  | 'buddyDrawReact'
  | 'buddyNoMovePrompt'
  | 'buddyMatchCelebrate'
  | 'buddyMatchConsole';

/**
 * Audio category — allows AudioManager to manage voice clips
 * independently from SFX (e.g. stop all voice without stopping beeps).
 */
export type AudioCategory = 'sfx' | 'voice';

/**
 * Maps each audio event to its category.
 * SFX: short beeps, jingles, UI sounds.
 * Voice: Buddy's spoken lines that should not overlap each other.
 */
export const AUDIO_CATEGORIES: Record<AudioEvent, AudioCategory> = {
  // SFX
  welcome: 'sfx',
  countdown1: 'sfx',
  countdown2: 'sfx',
  countdown3: 'sfx',
  go: 'sfx',
  playerRoundWin: 'sfx',
  buddyRoundWin: 'sfx',
  draw: 'sfx',
  noMove: 'sfx',
  playerMatchWin: 'sfx',
  buddyMatchWin: 'sfx',
  // Buddy voice
  buddyGreet: 'voice',
  buddyCallRock: 'voice',
  buddyCallPaper: 'voice',
  buddyCallScissors: 'voice',
  buddyCallShoot: 'voice',
  buddyRoundTaunt: 'voice',
  buddyRoundEncourage: 'voice',
  buddyDrawReact: 'voice',
  buddyNoMovePrompt: 'voice',
  buddyMatchCelebrate: 'voice',
  buddyMatchConsole: 'voice',
};

/**
 * Map audio event names to asset file paths.
 * Missing entries will fail gracefully (no error, no block).
 * Paths are relative to /public/audio/
 */
export const AUDIO_MANIFEST: Partial<Record<AudioEvent, string>> = {
  // Uncomment and add real audio files as they become available:
  //
  // ── SFX ──
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
  //
  // ── Buddy voice lines ──
  // buddyGreet: '/audio/buddy_greet.mp3',
  // buddyCallRock: '/audio/buddy_call_rock.mp3',
  // buddyCallPaper: '/audio/buddy_call_paper.mp3',
  // buddyCallScissors: '/audio/buddy_call_scissors.mp3',
  // buddyCallShoot: '/audio/buddy_call_shoot.mp3',
  // buddyRoundTaunt: '/audio/buddy_round_taunt.mp3',
  // buddyRoundEncourage: '/audio/buddy_round_encourage.mp3',
  // buddyDrawReact: '/audio/buddy_draw_react.mp3',
  // buddyNoMovePrompt: '/audio/buddy_no_move_prompt.mp3',
  // buddyMatchCelebrate: '/audio/buddy_match_celebrate.mp3',
  // buddyMatchConsole: '/audio/buddy_match_console.mp3',
};

/**
 * Temporary TTS fallback text for Buddy voice events.
 * Used by AudioManager.playVoice() when no real .mp3 is loaded.
 * Only voice-category events need entries here — SFX never falls back to TTS.
 * Once real audio files are dropped in and uncommented above, they take
 * priority automatically with zero changes to any call site.
 */
export const BUDDY_VOICE_LINES: Partial<Record<AudioEvent, string>> = {
  buddyGreet: "Let's play!",
  buddyCallRock: 'Rock!',
  buddyCallPaper: 'Paper!',
  buddyCallScissors: 'Scissors!',
  buddyCallShoot: 'Shoot!',
  buddyRoundTaunt: 'Ha! Got you!',
  buddyRoundEncourage: 'Nice one!',
  buddyDrawReact: 'Same move! Again!',
  buddyNoMovePrompt: 'Show me your move!',
  buddyMatchCelebrate: 'I win! Better luck next time!',
  buddyMatchConsole: 'You got me! Great game!',
};
