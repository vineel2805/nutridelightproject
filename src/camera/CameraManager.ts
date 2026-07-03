// ============================================================
// Camera stream lifecycle manager
// ============================================================

export type CameraError =
  | 'unsupported'
  | 'permission-denied'
  | 'not-found'
  | 'overconstrained'
  | 'not-readable'
  | 'play-failed'
  | 'unknown';

export interface CameraManagerOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

class CameraManagerClass {
  private stream: MediaStream | null = null;

  async start(
    videoEl: HTMLVideoElement,
    options: CameraManagerOptions = {}
  ): Promise<void> {
    const {
      width = 960,
      height = 540,
      facingMode = 'user',
    } = options;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw this.classifyError(
        new DOMException(
          'This browser does not support camera access.',
          'NotSupportedError'
        )
      );
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width, max: 1280 },
          height: { ideal: height, max: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode,
        },
        audio: false,
      });

      videoEl.srcObject = this.stream;
      await videoEl.play();
    } catch (err) {
      this.stop(videoEl);
      throw this.classifyError(err);
    }
  }

  stop(videoEl?: HTMLVideoElement): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
  }

  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  private classifyError(err: unknown): { type: CameraError; message: string } {
    if (err instanceof DOMException) {
      if (err.name === 'NotSupportedError') {
        return {
          type: 'unsupported',
          message: 'This browser does not support camera access.',
        };
      }
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        return {
          type: 'permission-denied',
          message:
            'Camera access was denied. Please allow camera access to play.',
        };
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        return {
          type: 'not-found',
          message: 'No camera found. Please connect a camera and try again.',
        };
      }
      if (err.name === 'OverconstrainedError') {
        return {
          type: 'overconstrained',
          message: 'Camera does not support the required settings.',
        };
      }
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        return {
          type: 'not-readable',
          message:
            'The camera is already in use by another app or could not be accessed.',
        };
      }
      if (err.name === 'AbortError') {
        return {
          type: 'play-failed',
          message:
            'The camera started, but the video preview could not begin. Try again.',
        };
      }
    }

    if (err instanceof Error) {
      const normalized = err.message.toLowerCase();

      if (normalized.includes('notallowed') || normalized.includes('permission')) {
        return {
          type: 'permission-denied',
          message:
            'Camera access was denied. Please allow camera access to play.',
        };
      }

      if (normalized.includes('notfound') || normalized.includes('device')) {
        return {
          type: 'not-found',
          message: 'No camera found. Please connect a camera and try again.',
        };
      }

      if (normalized.includes('play') || normalized.includes('autoplay')) {
        return {
          type: 'play-failed',
          message:
            'The camera started, but the video preview could not begin. Try again.',
        };
      }
    }

    return { type: 'unknown', message: 'Camera could not be started.' };
  }
}

export const CameraManager = new CameraManagerClass();
