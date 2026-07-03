import {
  GestureRecognizer,
  FilesetResolver,
  type GestureRecognizerResult,
} from '@mediapipe/tasks-vision';

// ============================================================
// MediaPipe GestureRecognizer service — singleton lifecycle
// ============================================================

export type RecognizerStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GestureServiceResult {
  gestures: Array<{ label: string; confidence: number }>;
  landmarks: Array<Array<{ x: number; y: number; z: number }>>;
  handedness: Array<{ label: string; confidence: number }>;
}

class GestureRecognizerService {
  private recognizer: GestureRecognizer | null = null;
  private status: RecognizerStatus = 'idle';
  private inferenceRunning = false;
  private lastTimestamp = -1;
  private warmedUp = false;

  private async createRecognizer(
    vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
    delegate: 'GPU' | 'CPU'
  ): Promise<GestureRecognizer> {
    return GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  async initialize(): Promise<void> {
    if (this.status === 'ready' || this.status === 'loading') return;
    this.status = 'loading';

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );

      try {
        this.recognizer = await this.createRecognizer(vision, 'GPU');
      } catch (gpuErr) {
        console.warn(
          '[GestureRecognizerService] GPU delegate unavailable, falling back to CPU.',
          gpuErr
        );
        this.recognizer = await this.createRecognizer(vision, 'CPU');
      }

      this.status = 'ready';
      this.warmedUp = false;
    } catch (err) {
      this.status = 'error';
      console.error('[GestureRecognizerService] Failed to initialize:', err);
      throw err;
    }
  }

  getStatus(): RecognizerStatus {
    return this.status;
  }

  isReady(): boolean {
    return this.status === 'ready' && this.recognizer !== null;
  }

  isWarmedUp(): boolean {
    return this.warmedUp;
  }

  warmup(videoEl: HTMLVideoElement, timestamp: number): boolean {
    if (!this.isReady() || this.inferenceRunning || this.warmedUp) return false;

    this.inferenceRunning = true;
    this.lastTimestamp = timestamp;

    try {
      this.recognizer!.recognizeForVideo(videoEl, timestamp);
      this.warmedUp = true;
      return true;
    } catch (err) {
      console.error('[GestureRecognizerService] Warm-up error:', err);
      return false;
    } finally {
      this.inferenceRunning = false;
    }
  }

  /**
   * Run gesture recognition on a video frame.
   * Returns null if:
   *  - service not ready
   *  - inference is already running (skip stale frames)
   *  - timestamp is not advancing
   */
  recognize(
    videoEl: HTMLVideoElement,
    timestamp: number
  ): GestureServiceResult | null {
    if (!this.isReady() || this.inferenceRunning) return null;
    if (timestamp <= this.lastTimestamp) return null;

    this.inferenceRunning = true;
    this.lastTimestamp = timestamp;

    try {
      const result: GestureRecognizerResult =
        this.recognizer!.recognizeForVideo(videoEl, timestamp);

      const landmarks = result.landmarks ?? [];

      const handedness =
        result.handednesses?.[0]?.map((h) => ({
          label: h.categoryName,
          confidence: h.score,
        })) ?? [];

      return { gestures: [], landmarks, handedness };
    } catch (err) {
      console.error('[GestureRecognizerService] Recognition error:', err);
      return null;
    } finally {
      this.inferenceRunning = false;
    }
  }

  destroy(): void {
    this.recognizer?.close();
    this.recognizer = null;
    this.status = 'idle';
    this.inferenceRunning = false;
    this.lastTimestamp = -1;
    this.warmedUp = false;
  }
}

// Singleton export
export const gestureService = new GestureRecognizerService();
