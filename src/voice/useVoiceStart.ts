import { useEffect, useRef, useState, useCallback } from 'react';
import {
  isSpeechRecognitionSupported,
  getSpeechRecognitionClass,
} from './speechSupport';

// ============================================================
// Supported voice start phrases
// ============================================================

const START_PHRASES = ['start the game', 'start game', "let's play"];

function matchesStartPhrase(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  return START_PHRASES.some((p) => lower.includes(p));
}

// ============================================================
// useVoiceStart hook
// ============================================================

export type VoiceListeningState =
  | 'unsupported'
  | 'idle'
  | 'listening'
  | 'heard';

export interface UseVoiceStartReturn {
  voiceState: VoiceListeningState;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

interface UseVoiceStartOptions {
  enabled: boolean;
  onStart: () => void;
}

export function useVoiceStart({
  enabled,
  onStart,
}: UseVoiceStartOptions): UseVoiceStartReturn {
  const supported = isSpeechRecognitionSupported();
  const [voiceState, setVoiceState] = useState<VoiceListeningState>(
    supported ? 'idle' : 'unsupported'
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any | null>(null);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceState(supported ? 'idle' : 'unsupported');
  }, [supported]);

  const startListening = useCallback(() => {
    if (!supported || !enabled) return;

    const SpeechRec = getSpeechRecognitionClass();
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setVoiceState('listening');

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript ?? '';
      if (matchesStartPhrase(transcript)) {
        setVoiceState('heard');
        recognition.stop();
        onStartRef.current();
      }
    };

    recognition.onerror = () => {
      setVoiceState('idle');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      if (voiceState === 'listening') {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, enabled, voiceState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    voiceState,
    isSupported: supported,
    startListening,
    stopListening,
  };
}
