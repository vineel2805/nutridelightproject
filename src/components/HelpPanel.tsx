import React from 'react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSupported: boolean;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  voiceSupported,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up overflow-y-auto max-h-[90vh]"
        style={{ background: 'var(--warm-cream)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          id="help-close-btn"
          aria-label="Close help"
        >
          ✕
        </button>

        <h2
          className="font-black text-xl mb-5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-green-dark)' }}
        >
          How to Play
        </h2>

        {/* Instructions */}
        <div className="space-y-3 mb-6">
          {[
            { icon: '🖐', text: 'Show your hand in the camera frame' },
            { icon: '⏱', text: 'Wait for the countdown: 1 → 2 → 3 → GO' },
            { icon: '✊', text: 'Make your Rock, Paper, or Scissors move' },
            { icon: '🏆', text: 'First to 2 wins takes the match!' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <span className="text-sm" style={{ color: 'var(--text-dark)' }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Voice commands */}
        {voiceSupported && (
          <div className="mb-5">
            <h3
              className="font-bold text-base mb-3 flex items-center gap-2"
              style={{ color: 'var(--brand-green-dark)' }}
            >
              <span>🎙</span> Voice Commands
            </h3>
            <p className="text-xs text-gray-500 mb-2">Say one of these to start:</p>
            {['"Start the game"', '"Start game"', '"Let\'s play"'].map((phrase) => (
              <div
                key={phrase}
                className="flex items-center justify-between px-4 py-2 mb-1 rounded-xl"
                style={{ background: 'rgba(45,138,62,0.08)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--brand-green-dark)' }}>
                  {phrase}
                </span>
                <span className="text-green-500 text-sm">🎵</span>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(232,123,26,0.1)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--brand-orange-dark)' }}>
            💡 Tip: Play in a well-lit area for better gesture detection.
            The Start Game button always works — voice is optional!
          </p>
        </div>
      </div>
    </div>
  );
};
