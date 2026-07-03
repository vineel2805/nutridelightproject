import React from 'react';
import { Confetti } from '../components/Confetti';

interface PlayerWinScreenProps {
  onPlayAgain: () => void;
}

export const PlayerWinScreen: React.FC<PlayerWinScreenProps> = ({
  onPlayAgain,
}) => {
  return (
    <div
      className="screen-container flex flex-col items-center justify-center text-center px-8 py-10 overflow-hidden"
      style={{ background: 'var(--warm-cream)' }}
    >
      <Confetti count={50} />

      <div className="relative z-20 flex flex-col items-center gap-5">
        {/* Buddy celebrating */}
        <img
          src="/avatar/buddy_idle.png"
          alt="Buddy celebrating"
          className="w-36 h-auto drop-shadow-2xl animate-buddy-celebrate"
          draggable={false}
        />

        {/* YOU WIN */}
        <div>
          <h1
            className="font-black animate-bounce-in"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 12vw, 5.5rem)',
              color: 'var(--brand-green)',
              textShadow: '0 4px 20px rgba(45,138,62,0.3)',
              lineHeight: 1,
            }}
          >
            YOU WIN!
          </h1>
          <p
            className="mt-1 font-semibold text-base animate-fade-in"
            style={{ color: 'var(--text-muted)', animationDelay: '0.2s', opacity: 0, animation: 'fade-in 0.4s 0.2s forwards' }}
          >
            Great job! You played awesome!
          </p>
        </div>

        {/* Reward placeholder */}
        <div
          className="animate-slide-up rounded-3xl px-8 py-5 flex flex-col items-center gap-2"
          style={{
            background: 'white',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            animationDelay: '0.3s',
            opacity: 0,
            animation: 'slide-up 0.4s 0.3s ease-out forwards',
            maxWidth: 320,
            width: '100%',
          }}
        >
          <span className="text-4xl">🎁</span>
          <h2
            className="font-black text-xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-orange)' }}
          >
            YOU WON A REWARD!
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Enjoy a free juice or discount on your next Nutri Delight order.
          </p>
        </div>

        {/* Play again */}
        <button
          className="btn-play-again animate-slide-up"
          onClick={onPlayAgain}
          id="player-win-play-again-btn"
          style={{
            opacity: 0,
            animation: 'slide-up 0.4s 0.5s ease-out forwards',
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
