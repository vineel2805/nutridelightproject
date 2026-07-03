// ============================================================
// Camera stream lifecycle manager
// ============================================================

export type CameraError =
  | 'permission-denied'
  | 'not-found'
  | 'overconstrained'
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
    const { width = 1280, height = 720, facingMode = 'user' } = options;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height, facingMode },
        audio: false,
      });

      videoEl.srcObject = this.stream;
      await videoEl.play();
    } catch (err) {
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
    }
    return { type: 'unknown', message: 'Camera could not be started.' };
  }
}

export const CameraManager = new CameraManagerClass();
