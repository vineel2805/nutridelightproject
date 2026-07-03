// ============================================================
// Avatar state contract
// Stable names — asset format can change without touching game logic
// ============================================================

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'ready'
  | 'countdown'
  | 'rock'
  | 'paper'
  | 'scissors'
  | 'roundWin'
  | 'roundLoss'
  | 'draw'
  | 'matchWin'
  | 'matchLoss';
