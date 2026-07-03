import React, { useMemo } from 'react';

const COLORS = [
  '#2d8a3e', '#4db868', '#e87b1a', '#f4a444',
  '#ffd700', '#ff6b6b', '#7c3aed', '#06b6d4',
];

interface ConfettiProps {
  count?: number;
}

/**
 * Lightweight CSS-only confetti burst.
 * No canvas, no library — just randomized div particles.
 */
export const Confetti: React.FC<ConfettiProps> = ({ count = 40 }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1.5}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
        size: `${6 + Math.random() * 10}px`,
        rotate: `${Math.random() * 360}deg`,
        shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape,
            animation: `confetti-fall ${p.duration} ${p.delay} linear forwards`,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}
    </div>
  );
};
