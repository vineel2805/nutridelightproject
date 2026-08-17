import React from 'react';

interface HandLandmarkOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Absolutely-positioned canvas for the hand-landmark skeleton overlay.
 * All actual drawing happens imperatively from processFrame() —
 * this component never re-renders during gameplay.
 */
export const HandLandmarkOverlay: React.FC<HandLandmarkOverlayProps> = ({ canvasRef }) => (
  <canvas
    ref={canvasRef}
    className="hand-landmark-canvas"
    aria-hidden="true"
  />
);
