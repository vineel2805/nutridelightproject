import React, { useEffect, useRef } from 'react';

interface ScoreHUDProps {
  playerScore: number;
  buddyScore: number;
  round: number;
  winsToMatch?: number;
}

/**
 * Score HUD — fixed top bar: YOU [score] | ROUND N | BUDDY [score]
 * Green left, orange right, dark pill center
 */
export const ScoreHUD: React.FC<ScoreHUDProps> = ({
  playerScore,
  buddyScore,
  round,
  winsToMatch = 2,
}) => {
  const playerScoreRef = useRef(playerScore);
  const buddyScoreRef = useRef(buddyScore);
  const playerElRef = useRef<HTMLSpanElement | null>(null);
  const buddyElRef = useRef<HTMLSpanElement | null>(null);

  // Animate score change
  useEffect(() => {
    if (playerScore !== playerScoreRef.current && playerElRef.current) {
      playerElRef.current.classList.remove('animate-score-pop');
      void playerElRef.current.offsetWidth;
      playerElRef.current.classList.add('animate-score-pop');
    }
    playerScoreRef.current = playerScore;
  }, [playerScore]);

  useEffect(() => {
    if (buddyScore !== buddyScoreRef.current && buddyElRef.current) {
      buddyElRef.current.classList.remove('animate-score-pop');
      void buddyElRef.current.offsetWidth;
      buddyElRef.current.classList.add('animate-score-pop');
    }
    buddyScoreRef.current = buddyScore;
  }, [buddyScore]);

  // Dot indicators for wins
  const dots = Array.from({ length: winsToMatch });

  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pt-2 pb-1"
      role="status"
      aria-label={`Score: You ${playerScore}, Buddy ${buddyScore}, Round ${round}`}
    >
      {/* Player score */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3 py-2 min-w-[90px]"
        style={{ background: 'rgba(45,138,62,0.88)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex flex-col items-center">
          <span className="text-white text-[10px] font-bold tracking-widest uppercase opacity-80">YOU</span>
          <span
            ref={playerElRef}
            className="text-white font-black leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 5vw, 2.4rem)' }}
          >
            {playerScore}
          </span>
        </div>
        <div className="flex gap-1 ml-1">
          {dots.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: 10,
                height: 10,
                background: i < playerScore ? 'white' : 'rgba(255,255,255,0.28)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Round center */}
      <div
        className="flex flex-col items-center px-4 py-2 rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      >
        <span className="text-white text-[10px] font-bold tracking-widest uppercase opacity-70">ROUND</span>
        <span
          className="text-white font-black"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 2rem)' }}
        >
          {round}
        </span>
      </div>

      {/* Buddy score */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3 py-2 min-w-[90px] flex-row-reverse"
        style={{ background: 'rgba(232,123,26,0.88)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex flex-col items-center">
          <span className="text-white text-[10px] font-bold tracking-widest uppercase opacity-80">BUDDY</span>
          <span
            ref={buddyElRef}
            className="text-white font-black leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 5vw, 2.4rem)' }}
          >
            {buddyScore}
          </span>
        </div>
        <div className="flex gap-1 mr-1 flex-row-reverse">
          {dots.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: 10,
                height: 10,
                background: i < buddyScore ? 'white' : 'rgba(255,255,255,0.28)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
