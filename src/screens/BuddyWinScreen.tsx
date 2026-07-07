import React from 'react';

interface BuddyWinScreenProps {
  onPlayAgain: () => void;
}

export const BuddyWinScreen: React.FC<BuddyWinScreenProps> = ({
  onPlayAgain,
}) => {
  return (
    <div
      className="screen-container flex flex-col items-center justify-center text-center px-8 py-10"
      style={{
        background: 'linear-gradient(160deg, #fff8ec 0%, #fdeece 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Buddy celebrating */}
        <img
          src="/avatar/buddy_win.png"
          alt="Buddy wins"
          className="w-36 h-auto drop-shadow-2xl animate-buddy-celebrate"
          draggable={false}
        />

        {/* BUDDY WINS */}
        <div>
          <h1
            className="font-black animate-bounce-in"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 10vw, 4.5rem)',
              color: 'var(--brand-orange)',
              textShadow: '0 4px 20px rgba(232,123,26,0.3)',
              lineHeight: 1,
            }}
          >
            BUDDY WINS!
          </h1>
        </div>

        {/* Message */}
        <div
          className="animate-slide-up rounded-3xl px-8 py-5"
          style={{
            background: 'white',
            boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
            opacity: 0,
            animation: 'slide-up 0.4s 0.2s ease-out forwards',
            maxWidth: 320,
            width: '100%',
          }}
        >
          <p
            className="font-bold text-lg"
            style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}
          >
            Better luck next time! 
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Buddy is tough — but you can do it! Give it another shot.
          </p>
        </div>

        {/* Play again — prominent */}
        <button
          className="btn-play-again animate-slide-up"
          onClick={onPlayAgain}
          id="buddy-win-play-again-btn"
          style={{
            opacity: 0,
            animation: 'slide-up 0.4s 0.4s ease-out forwards',
            minWidth: 240,
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
