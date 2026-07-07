import React from 'react';
import type { RpsMove, RoundOutcome } from '../game/gameTypes';

// ============================================================
// Move emoji / icon map
// ============================================================

const MOVE_EMOJI: Record<RpsMove, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

const MOVE_LABEL: Record<RpsMove, string> = {
  rock: 'ROCK',
  paper: 'PAPER',
  scissors: 'SCISSORS',
};

interface MoveRevealProps {
  playerMove: RpsMove | null;
  buddyMove: RpsMove | null;
  outcome: RoundOutcome | null;
  visible: boolean;
}

/**
 * Transient move reveal overlay — shows both moves + result banner.
 * Slides in from sides, auto-dismissed by game logic timer.
 */
export const MoveReveal: React.FC<MoveRevealProps> = ({
  playerMove,
  buddyMove,
  outcome,
  visible,
}) => {
  if (!visible || !playerMove || !buddyMove || !outcome) return null;

  const resultText =
    outcome === 'playerWin'
      ? 'YOU WIN THIS ROUND! 🎉'
      : outcome === 'buddyWin'
        ? 'BUDDY WINS! 💪'
        : "IT'S A DRAW!";

  const resultBg =
    outcome === 'playerWin'
      ? 'rgba(45,138,62,0.95)'
      : outcome === 'buddyWin'
        ? 'rgba(232,123,26,0.95)'
        : 'rgba(60,60,60,0.95)';

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
    >
      {/* Moves row */}
      <div className="flex items-center gap-4 animate-fade-in">
        {/* Player move */}
        <div
          className="move-card move-card-player animate-slide-in-left"
          style={{ minWidth: 110 }}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">YOU</span>
          <span style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>{MOVE_EMOJI[playerMove]}</span>
          <span
            className="font-black tracking-wide"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
            }}
          >
            {MOVE_LABEL[playerMove]}
          </span>
        </div>

        {/* VS */}
        <div
          className="font-black"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          VS
        </div>

        {/* Buddy move */}
        <div
          className="move-card move-card-buddy animate-slide-in-right"
          style={{ minWidth: 110 }}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">BUDDY</span>
          <span style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>{MOVE_EMOJI[buddyMove]}</span>
          <span
            className="font-black tracking-wide"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
            }}
          >
            {MOVE_LABEL[buddyMove]}
          </span>
        </div>
      </div>

      {/* Result banner */}
      <div
        className="animate-bounce-in px-6 py-4 rounded-2xl"
        style={{
          background: resultBg,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1rem, 3.5vw, 1.5rem)',
          fontWeight: 900,
          color: 'white',
          letterSpacing: '0.04em',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        {resultText}
      </div>
    </div>
  );
};
