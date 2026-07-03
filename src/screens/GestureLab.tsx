import React, { useState } from 'react';
import { useCamera } from '../camera/useCamera';
import { useGestureDetection } from '../gesture/useGestureDetection';
import { CameraView } from '../components/CameraView';

interface GestureLabProps {
  onExit: () => void;
}

/**
 * Developer Gesture Lab — /lab route.
 * Shows live camera + real-time gesture readout.
 * Never shown in production navigation.
 */
export const GestureLab: React.FC<GestureLabProps> = ({ onExit }) => {
  const { videoRef, status, startCamera } = useCamera();
  const [started, setStarted] = useState(false);

  const { gestureStatus, debugInfo, serviceReady } = useGestureDetection({
    videoRef,
    phase: started ? 'capture' : 'idle',
  });

  const handleStart = async () => {
    await startCamera();
    setStarted(true);
  };

  const moveEmoji: Record<string, string> = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
  };

  return (
    <div
      className="screen-container flex flex-col"
      style={{ background: '#111', color: '#eee', fontFamily: 'monospace' }}
    >
      {/* Camera */}
      {started && <CameraView videoRef={videoRef} />}

      {/* Overlay panel */}
      <div
        className="absolute top-0 left-0 z-50 p-4 m-3 rounded-2xl text-sm max-w-xs"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      >
        <div className="text-green-400 font-bold text-base mb-3">🔬 Gesture Lab</div>

        <div className="mb-2 text-xs text-gray-400">
          Service: <span className={serviceReady ? 'text-green-400' : 'text-yellow-400'}>
            {serviceReady ? '● Ready' : '○ Loading...'}
          </span>
        </div>
        <div className="mb-2 text-xs text-gray-400">
          Camera: <span className={status === 'active' ? 'text-green-400' : 'text-yellow-400'}>
            {status}
          </span>
        </div>

        {debugInfo && (
          <div className="space-y-1 text-xs border-t border-gray-700 pt-2 mt-2">
            <div>Label: <span className="text-yellow-300">{debugInfo.label}</span></div>
            <div>Confidence: <span className="text-yellow-300">{(debugInfo.confidence * 100).toFixed(1)}%</span></div>
            <div>Vote ratio: <span className="text-yellow-300">{(debugInfo.voteRatio * 100).toFixed(1)}%</span></div>
            <div>Consecutive: <span className="text-yellow-300">{debugInfo.consecutiveCount}</span></div>
            <div>Motion: <span className={debugInfo.motion > 0.04 ? 'text-red-400' : 'text-green-400'}>
              {debugInfo.motion.toFixed(4)}
            </span></div>
            <div>Gesture: <span className="text-white font-bold">{debugInfo.status.kind}</span></div>
          </div>
        )}

        {gestureStatus.kind === 'stable' && (
          <div className="mt-3 text-center border-t border-green-800 pt-2">
            <div className="text-3xl">{moveEmoji[gestureStatus.move]}</div>
            <div className="text-green-400 font-bold text-lg uppercase">{gestureStatus.move}</div>
            <div className="text-green-600 text-xs">STABLE ✓</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex gap-3 justify-center z-50">
        {!started && (
          <button className="btn-primary text-sm" onClick={handleStart} id="lab-start-btn">
            Start Camera
          </button>
        )}
        <button
          className="btn-secondary text-sm"
          onClick={onExit}
          id="lab-exit-btn"
          style={{ color: 'white', borderColor: 'white' }}
        >
          ← Exit Lab
        </button>
      </div>

      {!started && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
          Press "Start Camera" to begin gesture testing
        </div>
      )}
    </div>
  );
};
