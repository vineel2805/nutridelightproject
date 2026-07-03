import React, { useEffect, useState } from 'react';

interface CountdownOverlayProps {
  value: number | 'GO' | null;
}

/**
 * Centered countdown overlay — scale-pop animation on each value change.
 * Positioned to NOT cover the lower hand region.
 */
export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (value !== null) {
      setDisplayValue(value);
      setAnimKey((k) => k + 1);
    }
  }, [value]);

  if (displayValue === null || value === null) return null;

  const isGO = displayValue === 'GO';

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
      style={{ paddingBottom: '20%' }} // Avoid covering hand area
    >
      {/* Ripple ring */}
      {!isGO && (
        <div
          key={`ring-${animKey}`}
          className="absolute rounded-full"
          style={{
            width: '180px',
            height: '180px',
            border: '4px solid rgba(248, 165, 27, 0.6)',
            animation: 'ripple 0.9s ease-out forwards',
          }}
        />
      )}

      {/* Number/GO */}
      <span
        key={animKey}
        className={isGO ? 'animate-go-burst' : 'animate-countdown-pop'}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: isGO
            ? 'clamp(4rem, 16vw, 10rem)'
            : 'clamp(6rem, 22vw, 14rem)',
          fontWeight: 900,
          color: isGO ? '#4db868' : 'white',
          textShadow: isGO
            ? '0 0 40px rgba(77,184,104,0.6), 0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 30px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)',
          lineHeight: 1,
          userSelect: 'none',
          letterSpacing: isGO ? '0.05em' : '-0.02em',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {displayValue}
      </span>
    </div>
  );
};
