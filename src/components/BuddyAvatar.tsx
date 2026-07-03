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
}

/**
 * Buddy avatar — composited over the camera scene.
 * Positioned on the right side of the frame.
 * Uses generated PNG assets with CSS animation state.
 */
export const BuddyAvatar: React.FC<BuddyAvatarProps> = ({
  state,
  className = '',
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
