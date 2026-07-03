import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  className?: string;
}

/**
 * Full-bleed mirrored camera video element.
 * No framing — fills its container completely.
 */
export const CameraView: React.FC<CameraViewProps> = ({ videoRef, className = '' }) => {
  return (
    <video
      ref={videoRef}
      className={`camera-fill ${className}`}
      autoPlay
      playsInline
      muted
      aria-hidden="true"
    />
  );
};
