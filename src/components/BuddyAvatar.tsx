import React from 'react';
import type { AvatarState } from '../avatar/avatarTypes';

// ============================================================
// Asset map — swap image paths when real assets arrive
// ============================================================

const AVATAR_IMAGES: Partial<Record<AvatarState, string>> = {
  idle: '/avatar/buddy_idle.png',
  listening: '/avatar/buddy_idle.png',
  ready: '/avatar/buddy_idle.png',
  countdown: '/avatar/buddy_idle.png',
  roundWin: '/avatar/buddy_idle.png',  // Buddy loses
  roundLoss: '/avatar/buddy_win.png', // Buddy wins round
  draw: '/avatar/buddy_idle.png',
  matchWin: '/avatar/buddy_loss.png',  // Buddy loses match
  matchLoss: '/avatar/buddy_win.png',  // Buddy wins match
};

// Move states use emoji overlays
const MOVE_EMOJI: Partial<Record<AvatarState, string>> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

const STATE_ANIMATION: Partial<Record<AvatarState, string>> = {
  idle: 'animate-buddy-float',
  listening: 'animate-buddy-float',
  ready: 'animate-buddy-float',
  countdown: 'animate-buddy-float',
  matchWin: 'animate-buddy-celebrate',
  matchLoss: '',
  roundWin: '',
  roundLoss: 'animate-buddy-celebrate',
};

interface BuddyAvatarProps {
  state: AvatarState;
  className?: string;
  message?: string | null;
}

/**
 * Buddy avatar — composited over the camera scene.
 * Positioned on the right side of the frame.
 * Uses generated PNG assets with CSS animation state.
 */
export const BuddyAvatar: React.FC<BuddyAvatarProps> = ({
  state,
  className = '',
  message = null,
}) => {
  const imgSrc = AVATAR_IMAGES[state] ?? '/avatar/buddy_idle.png';
  const animation = STATE_ANIMATION[state] ?? 'animate-buddy-float';
  const moveEmoji = MOVE_EMOJI[state];

  return (
    <div
      className={`absolute bottom-0 right-0 z-20 flex flex-col items-center select-none pointer-events-none ${className}`}
      style={{
        width: 'clamp(140px, 28vw, 260px)',
        paddingBottom: '2%',
        paddingRight: '2%',
      }}
    >
      {message && (
        <div
          className="absolute z-30 animate-bounce-in"
          style={{
            top: '4%',
            right: '100%',
            marginRight: '10px',
            maxWidth: '150px',
          }}
        >
          <div
            className="relative px-4 py-2.5 rounded-2xl text-sm font-semibold text-center"
            style={{
              background: 'white',
              color: 'var(--text-dark)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
              lineHeight: 1.3,
            }}
          >
            {message}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '-8px',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '7px solid transparent',
                borderBottom: '7px solid transparent',
                borderLeft: '9px solid white',
              }}
            />
          </div>
        </div>
      )}

      {/* Move emoji overlay (during capture/reveal) */}
      {moveEmoji && (
        <div
          className="absolute top-0 left-0 w-full flex justify-center animate-bounce-in"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            lineHeight: 1,
          }}
        >
          {moveEmoji}
        </div>
      )}

      <img
        src={imgSrc}
        alt={`Buddy ${state}`}
        className={`w-full h-auto drop-shadow-2xl ${animation}`}
        draggable={false}
        style={{
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
        }}
      />

      {/* State label for accessibility */}
      <span className="sr-only">Buddy is {state}</span>
    </div>
  );
};
