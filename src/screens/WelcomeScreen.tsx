import React, { useState, useEffect } from 'react';
import { HelpPanel } from '../components/HelpPanel';
import { useVoiceStart } from '../voice/useVoiceStart';

interface WelcomeScreenProps {
  onStart: () => void;
}

const INSTRUCTION_STEPS = [
  { emoji: '🖐', text: 'Use hand gestures' },
  { emoji: '🎙', text: 'Say "Start the game"' },
  { emoji: '🏆', text: 'Win rewards' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  const { voiceState, isSupported, startListening } = useVoiceStart({
    enabled: true,
    onStart,
  });

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Auto-start voice listening
  useEffect(() => {
    if (isSupported && voiceState === 'idle') {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const handleStart = () => {
    onStart();
  };

  return (
    <>
      <div
        className="screen-container flex flex-col items-center justify-center overflow-y-auto"
        style={{ background: 'var(--warm-cream)' }}
      >
        {/* Background fruit decoration */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #e87b1a, transparent)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #2d8a3e, transparent)' }}
          />
          {/* Floating emojis */}
          {['🍊', '🍋', '🥝', '🍓'].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-4xl select-none"
              style={{
                top: `${15 + i * 20}%`,
                right: i % 2 === 0 ? '4%' : '88%',
                opacity: 0.3,
                animation: `buddy-float ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div
          className="relative flex flex-col items-center text-center px-6 py-8 w-full max-w-sm"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          {/* Brand */}
          <div className="mb-2">
            <span
              className="font-black text-2xl tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-green)' }}
            >
              NUTRI
            </span>
            <span
              className="font-black text-2xl tracking-tight ml-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-orange)' }}
            >
              DELIGHT
            </span>
          </div>

          {/* Title */}
          <div className="mb-1">
            <span
              className="font-black block"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.2rem, 5vw, 1.6rem)',
                color: 'var(--brand-orange)',
              }}
            >
              VIRTUAL
            </span>
            <span
              className="font-black block"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 8vw, 2.8rem)',
                color: 'var(--brand-green)',
                lineHeight: 1,
              }}
            >
              ROCK PAPER
            </span>
            <span
              className="font-black block"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 8vw, 2.8rem)',
                color: 'var(--brand-green)',
                lineHeight: 1.05,
              }}
            >
              SCISSORS
            </span>
          </div>

          {/* Buddy illustration */}
          <div className="my-4 relative">
            <img
              src="/avatar/buddy_idle.png"
              alt="Buddy the Nutri Delight mascot"
              className="w-36 h-auto drop-shadow-xl animate-buddy-float"
              draggable={false}
            />
          </div>

          {/* Subtitle */}
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}
          >
            Play with Buddy and win exciting rewards!
          </p>

          {/* Instruction steps */}
          <div className="flex gap-4 mb-7 w-full justify-center">
            {INSTRUCTION_STEPS.map(({ emoji, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 flex-1">
                <span
                  className="text-3xl"
                  role="img"
                  aria-label={text}
                >
                  {emoji}
                </span>
                <span
                  className="text-xs text-center font-medium"
                  style={{ color: 'var(--text-muted)', lineHeight: 1.3 }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Start button */}
          <button
            className="btn-primary w-full max-w-xs"
            onClick={handleStart}
            id="start-game-btn"
            aria-label="Start the game"
          >
            START THE GAME
          </button>

          {/* Voice indicator */}
          {isSupported && (
            <div className="mt-4 voice-listening" aria-live="polite">
              {voiceState === 'listening' ? (
                <>
                  <div className="flex gap-[3px] items-end h-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="voice-bar" />
                    ))}
                  </div>
                  <span>Listening...</span>
                </>
              ) : voiceState === 'heard' ? (
                <span>✓ Voice detected!</span>
              ) : null}
            </div>
          )}

          {/* Help link */}
          <button
            className="mt-5 text-sm font-medium underline"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setHelpOpen(true)}
            id="help-open-btn"
          >
            How to play?
          </button>
        </div>
      </div>

      <HelpPanel
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        voiceSupported={isSupported}
      />
    </>
  );
};
