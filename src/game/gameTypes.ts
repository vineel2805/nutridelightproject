// ============================================================
// Core RPS game types
// ============================================================

export type RpsMove = 'rock' | 'paper' | 'scissors';

export type RoundOutcome = 'playerWin' | 'buddyWin' | 'draw';

export type GamePhase =
  | 'idle'
  | 'cameraSetup'
  | 'cameraReady'
  | 'waitingForStart'
  | 'matchIntro'
  | 'roundReady'
  | 'countdown'
  | 'capture'
  | 'reveal'
  | 'roundResult'
  | 'matchResult'
  | 'reward'
  | 'error';

export type MatchResult = 'playerWin' | 'buddyWin';

export interface GameState {
  phase: GamePhase;
  playerScore: number;
  buddyScore: number;
  round: number;
  countdownValue: number | 'GO' | null;
  buddyMove: RpsMove | null;
  playerMove: RpsMove | null;
  roundOutcome: RoundOutcome | null;
  matchResult: MatchResult | null;
  errorMessage: string | null;
  detectionPrompt: string | null;
}

// ============================================================
// Action types for the game reducer
// ============================================================

export type GameAction =
  | { type: 'START_CAMERA' }
  | { type: 'CAMERA_READY' }
  | { type: 'CAMERA_ERROR'; payload: string }
  | { type: 'START_MATCH' }
  | { type: 'MATCH_INTRO_DONE' }
  | { type: 'ROUND_START' }
  | { type: 'COUNTDOWN_TICK'; payload: number | 'GO' }
  | { type: 'BEGIN_CAPTURE'; payload: { buddyMove: RpsMove } }
  | { type: 'PLAYER_CAPTURED'; payload: { playerMove: RpsMove } }
  | { type: 'NO_GESTURE_DETECTED' }
  | { type: 'REVEAL_DONE' }
  | { type: 'ROUND_RESULT_DONE' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'SET_DETECTION_PROMPT'; payload: string | null }
  | { type: 'DISMISS_ERROR' };
