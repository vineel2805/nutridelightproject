import React from 'react';

interface DetectionPromptProps {
  message: string | null;
}

/**
 * Small floating instruction bubble for gesture detection state.
 * Shows: "Show your hand", "Move closer", "Hold steady", etc.
 */
export const DetectionPrompt: React.FC<DetectionPromptProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-slide-up"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="px-5 py-3 rounded-2xl text-white font-semibold text-center"
        style={{
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(12px)',
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.85rem, 2.5vw, 1.05rem)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          maxWidth: '90vw',
        }}
      >
        {message}
      </div>
    </div>
  );
};
