// ============================================================
// Hand skeleton drawing utility
// Pure canvas drawing — no React, no state, no side effects
// beyond the provided canvas context.
// ============================================================

/** Standard MediaPipe 21-point hand skeleton connections */
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
];

const DOT_RADIUS = 3;
const LINE_WIDTH = 1.5;

interface Point2D {
  x: number;
  y: number;
}

/**
 * Compute the object-fit: cover transform to correctly map
 * normalized video-space landmarks to canvas pixel coordinates.
 *
 * Without this, landmarks misalign when the video's native aspect
 * ratio differs from the container (e.g. 4:3 webcam on mobile portrait).
 */
function computeCoverTransform(
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): { offsetX: number; offsetY: number; renderWidth: number; renderHeight: number } {
  const videoAspect = videoWidth / videoHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let renderWidth: number;
  let renderHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (videoAspect > canvasAspect) {
    // Video is wider than canvas → crop sides
    renderHeight = canvasHeight;
    renderWidth = canvasHeight * videoAspect;
    offsetX = (canvasWidth - renderWidth) / 2;
    offsetY = 0;
  } else {
    // Video is taller than canvas → crop top/bottom
    renderWidth = canvasWidth;
    renderHeight = canvasWidth / videoAspect;
    offsetX = 0;
    offsetY = (canvasHeight - renderHeight) / 2;
  }

  return { offsetX, offsetY, renderWidth, renderHeight };
}

/**
 * Draw the 21-point hand skeleton onto a canvas context.
 *
 * @param ctx          - Canvas 2D rendering context
 * @param landmarks    - 21 normalized landmarks (0–1) from MediaPipe
 * @param videoWidth   - Source video native width (video.videoWidth)
 * @param videoHeight  - Source video native height (video.videoHeight)
 * @param canvasWidth  - Canvas display width in CSS pixels
 * @param canvasHeight - Canvas display height in CSS pixels
 * @param color        - Stroke/fill color for lines and dots
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number; z: number }>,
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  color: string,
): void {
  if (landmarks.length < 21) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const { offsetX, offsetY, renderWidth, renderHeight } =
    computeCoverTransform(videoWidth, videoHeight, canvasWidth, canvasHeight);

  // Map normalized landmark to canvas pixel
  function toCanvas(lm: { x: number; y: number }): Point2D {
    return {
      x: offsetX + lm.x * renderWidth,
      y: offsetY + lm.y * renderHeight,
    };
  }

  const points = landmarks.map(toCanvas);

  // Draw connections
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  for (const [from, to] of HAND_CONNECTIONS) {
    const a = points[from];
    const b = points[to];
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();

  // Draw landmark dots
  ctx.fillStyle = color;
  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}
