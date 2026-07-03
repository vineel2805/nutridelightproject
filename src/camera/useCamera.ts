import { useRef, useState, useCallback } from 'react';
import { CameraManager } from './CameraManager';

// ============================================================
// useCamera hook
// ============================================================

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus('requesting');
    setErrorMessage(null);

    try {
      await CameraManager.start(videoRef.current);
      setStatus('active');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message ?? 'Camera could not be started.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    CameraManager.stop(videoRef.current ?? undefined);
    setStatus('idle');
  }, []);

  return { videoRef, status, errorMessage, startCamera, stopCamera };
}
