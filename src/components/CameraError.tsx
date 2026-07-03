import React from 'react';

interface CameraErrorProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export const CameraError: React.FC<CameraErrorProps> = ({
  message,
  onRetry,
  onBack,
}) => {
  return (
    <div
      className="screen-container flex flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ background: 'var(--warm-cream)' }}
    >
      <div className="text-6xl">📷</div>
      <h2
        className="font-black text-2xl"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-green-dark)' }}
      >
        Camera Needed
      </h2>
      <p
        className="text-base max-w-sm"
        style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
      >
        {message}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        This game uses your camera to detect your hand gestures. No video is
        recorded or uploaded.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          className="btn-primary"
          onClick={onRetry}
          id="camera-retry-btn"
        >
          Try Again
        </button>
        <button
          className="btn-secondary"
          onClick={onBack}
          id="camera-back-btn"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
