import { determineWinner, isMatchOver } from './gameEngine';
import { GAME_CONFIG } from './gameConfig';
import type { GameState, GameAction, RoundOutcome } from './gameTypes';

// ============================================================
// Initial state
// ============================================================

export const INITIAL_STATE: GameState = {
  phase: 'idle',
  playerScore: 0,
  buddyScore: 0,
  round: 1,
  countdownValue: null,
  buddyMove: null,
  playerMove: null,
  roundOutcome: null,
  matchResult: null,
  errorMessage: null,
  detectionPrompt: null,
};

// ============================================================
// Game reducer — typed, deterministic state machine
// ============================================================

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_CAMERA':
      return { ...state, phase: 'cameraSetup', errorMessage: null };

    case 'CAMERA_READY':
      return { ...state, phase: 'waitingForStart' };

    case 'CAMERA_ERROR':
      return { ...state, phase: 'error', errorMessage: action.payload };

    case 'START_MATCH':
      return { ...state, phase: 'matchIntro' };

    case 'MATCH_INTRO_DONE':
      return {
        ...state,
        phase: 'roundReady',
        playerScore: 0,
        buddyScore: 0,
        round: 1,
        buddyMove: null,
        playerMove: null,
        roundOutcome: null,
        matchResult: null,
      };

    case 'ROUND_START':
      return {
        ...state,
        phase: 'countdown',
        countdownValue: 1,
        buddyMove: null,
        playerMove: null,
        roundOutcome: null,
      };

    case 'COUNTDOWN_TICK':
      return { ...state, countdownValue: action.payload };

    case 'BEGIN_CAPTURE':
      // Buddy move locked here — BEFORE player gesture read
      return {
        ...state,
        phase: 'capture',
        buddyMove: action.payload.buddyMove,
        countdownValue: null,
        detectionPrompt: 'Show your move!',
      };

    case 'PLAYER_CAPTURED': {
      const playerMove = action.payload.playerMove;
      const buddyMove = state.buddyMove!;
      const outcome: RoundOutcome = determineWinner(playerMove, buddyMove);

      const playerScore =
        outcome === 'playerWin' ? state.playerScore + 1 : state.playerScore;
      const buddyScore =
        outcome === 'buddyWin' ? state.buddyScore + 1 : state.buddyScore;

      const matchOver = isMatchOver(
        playerScore,
        buddyScore,
        GAME_CONFIG.WINS_TO_MATCH
      );

      return {
        ...state,
        phase: 'reveal',
        playerMove,
        roundOutcome: outcome,
        playerScore,
        buddyScore,
        matchResult: matchOver
          ? playerScore >= GAME_CONFIG.WINS_TO_MATCH
            ? 'playerWin'
            : 'buddyWin'
          : null,
        detectionPrompt: null,
      };
    }

    case 'NO_GESTURE_DETECTED':
      // Retry round without score change
      return {
        ...state,
        phase: 'roundReady',
        buddyMove: null,
        playerMove: null,
        roundOutcome: null,
        detectionPrompt: "Move not detected. Let's try again!",
      };

    case 'REVEAL_DONE':
      return { ...state, phase: 'roundResult' };

    case 'ROUND_RESULT_DONE': {
      if (state.matchResult !== null) {
        return { ...state, phase: 'matchResult' };
      }
      if (state.roundOutcome === 'draw') {
        // Replay same round, score unchanged
        return {
          ...state,
          phase: 'roundReady',
          buddyMove: null,
          playerMove: null,
          roundOutcome: null,
          detectionPrompt: null,
        };
      }
      // Advance round
      return {
        ...state,
        phase: 'roundReady',
        round: state.round + 1,
        buddyMove: null,
        playerMove: null,
        roundOutcome: null,
        detectionPrompt: null,
      };
    }

    case 'PLAY_AGAIN':
      return {
        ...INITIAL_STATE,
        phase: 'waitingForStart',
      };

    case 'SET_DETECTION_PROMPT':
      return { ...state, detectionPrompt: action.payload };

    case 'DISMISS_ERROR':
      return { ...state, phase: 'idle', errorMessage: null };

    default:
      return state;
  }
}
