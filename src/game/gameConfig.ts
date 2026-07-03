// ============================================================
// Centralized game configuration — change here, nowhere else
// ============================================================

export const GAME_CONFIG = {
  // Score to win
  WINS_TO_MATCH: 2,

  // Countdown timing (ms per step)
  COUNTDOWN_STEP_MS: 900,

  // How long "GO" stays visible before capture
  GO_HOLD_MS: 400,

  // How long the capture window stays open (ms)
  CAPTURE_WINDOW_MS: 2000,

  // How long move reveal overlay stays before result banner
  REVEAL_DURATION_MS: 800,

  // How long round result banner stays (win/loss)
  ROUND_RESULT_HOLD_MS: 1800,

  // How long draw result stays (shorter — no score changed)
  DRAW_RESULT_HOLD_MS: 1100,

  // Match intro duration (ms)
  MATCH_INTRO_MS: 1500,

  // Screen transition animation (ms) — used by CSS too
  SCREEN_TRANSITION_MS: 300,
} as const;

export type GameConfig = typeof GAME_CONFIG;
