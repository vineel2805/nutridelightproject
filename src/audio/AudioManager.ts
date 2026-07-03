import { AUDIO_MANIFEST, type AudioEvent } from './audioManifest';

// ============================================================
// Centralized Audio Manager
// Fails gracefully when assets are missing — never blocks gameplay
// ============================================================

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
   * Play a named audio event.
   * Returns immediately if the event has no asset or fails.
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

  /** Stop all playing clips */
  stopAll(): void {
    for (const clip of this.clips.values()) {
      try {
        clip.pause();
        clip.currentTime = 0;
      } catch {
        // Ignore
      }
    }
  }
}

export const AudioManager = new AudioManagerClass();
