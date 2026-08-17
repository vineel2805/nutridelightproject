import {
  AUDIO_MANIFEST,
  AUDIO_CATEGORIES,
  BUDDY_VOICE_LINES,
  type AudioEvent,
} from './audioManifest';

// ============================================================
// Centralized Audio Manager
// Fails gracefully when assets are missing — never blocks gameplay
// ============================================================

/** Feature-detect browser TTS once at module load */
const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

class AudioManagerClass {
  private clips: Map<AudioEvent, HTMLAudioElement> = new Map();
  private unlocked = false;

  /**
   * Preload all known audio clips.
   * Call after first user interaction to bypass autoplay restrictions.
   */
  preload(): void {
    for (const [event, path] of Object.entries(AUDIO_MANIFEST) as [
      AudioEvent,
      string,
    ][]) {
      if (!path) continue;
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        this.clips.set(event, audio);
      } catch {
        // Silently skip missing or invalid assets
      }
    }
    this.unlocked = true;
  }

  /**
   * Play a named SFX audio event.
   * Returns immediately if the event has no asset or fails.
   * No TTS fallback — SFX are non-spoken sounds.
   */
  play(event: AudioEvent): void {
    if (!this.unlocked) return;

    const clip = this.clips.get(event);
    if (!clip) return;

    try {
      clip.currentTime = 0;
      clip.play().catch(() => {
        // Autoplay blocked or decode error — ignore silently
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play a Buddy voice event.
   * Priority: real .mp3 clip → TTS fallback → silent no-op.
   * Stops any currently-playing voice (clip or TTS) first so voice lines
   * don't stack on each other, while SFX continues uninterrupted.
   */
  playVoice(event: AudioEvent): void {
    if (!this.unlocked) return;

    // Stop any currently-playing voice clip or TTS utterance
    this.stopVoice();

    // Priority 1: real audio clip loaded from AUDIO_MANIFEST
    const clip = this.clips.get(event);
    if (clip) {
      try {
        clip.currentTime = 0;
        clip.play().catch(() => {
          // Autoplay blocked or decode error — ignore silently
        });
      } catch {
        // Ignore
      }
      return;
    }

    // Priority 2: TTS fallback for voice-category events
    if (
      hasTTS &&
      AUDIO_CATEGORIES[event] === 'voice' &&
      BUDDY_VOICE_LINES[event]
    ) {
      try {
        const utterance = new SpeechSynthesisUtterance(
          BUDDY_VOICE_LINES[event],
        );
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
      } catch {
        // TTS unavailable or errored — ignore silently
      }
    }
  }

  /** Stop only voice-category clips and any TTS, leaving SFX untouched */
  stopVoice(): void {
    for (const [event, clip] of this.clips.entries()) {
      if (AUDIO_CATEGORIES[event] !== 'voice') continue;
      try {
        clip.pause();
        clip.currentTime = 0;
      } catch {
        // Ignore
      }
    }

    // Also cancel any in-progress TTS utterance
    if (hasTTS) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  /** Stop all playing clips and TTS */
  stopAll(): void {
    for (const clip of this.clips.values()) {
      try {
        clip.pause();
        clip.currentTime = 0;
      } catch {
        // Ignore
      }
    }

    if (hasTTS) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }
}

export const AudioManager = new AudioManagerClass();

