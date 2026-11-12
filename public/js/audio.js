// Anime Audio Synthesizer (Upgraded Web Audio Engine)
class AnimeAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = localStorage.getItem('quest_sound_enabled') !== 'false';
    this.isUnlocked = false;

    // Auto-unlock AudioContext on the very first user interaction anywhere
    const unlockHandler = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(err => console.warn('Audio resume error:', err));
      } else if (this.ctx && this.ctx.state === 'running') {
        this.isUnlocked = true;
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { once: false });
    window.addEventListener('click', unlockHandler, { once: false });
    window.addEventListener('keydown', unlockHandler, { once: false });
  }

  initContext() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime); // Crisp, clear volume
          this.masterGain.connect(this.ctx.destination);
        }
      } catch (err) {
        console.error('AudioContext initialization failed:', err);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('quest_sound_enabled', this.enabled ? 'true' : 'false');
    if (this.enabled) {
      this.initContext();
      this.playTone(784, 'triangle', 0.15, 0.4);
    }
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.2, volume = 0.35, delay = 0) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    // If context is still suspended, try to resume
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const startTime = this.ctx.currentTime + (delay || 0);

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Attack and decay envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Harmonic anime bell (dual tone for rich resonance)
  playChime(freq, duration = 0.35, volume = 0.4, delay = 0) {
    this.playTone(freq, 'sine', duration, volume * 0.8, delay);
    this.playTone(freq * 2.01, 'triangle', duration * 0.7, volume * 0.4, delay); // Upper sparkle overtone
  }

  playQuestComplete() {
    if (!this.enabled) return;
    this.initContext();
    // Energetic 4-note anime success arpeggio (C5 -> E5 -> G5 -> C6)
    this.playChime(523.25, 0.25, 0.45, 0.0);
    this.playChime(659.25, 0.25, 0.48, 0.08);
    this.playChime(783.99, 0.30, 0.50, 0.16);
    this.playChime(1046.50, 0.45, 0.55, 0.24);
  }

  playQuestUncheck() {
    if (!this.enabled) return;
    this.playTone(392.00, 'sine', 0.15, 0.3, 0.0);
    this.playTone(261.63, 'sine', 0.20, 0.3, 0.06);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.initContext();
    // Epic anime rank up fanfare (A4 -> C#5 -> E5 -> A5 -> E6)
    const notes = [
      { f: 440.00, t: 0.00, d: 0.25, v: 0.45 },
      { f: 554.37, t: 0.10, d: 0.25, v: 0.48 },
      { f: 659.25, t: 0.20, d: 0.30, v: 0.50 },
      { f: 880.00, t: 0.32, d: 0.35, v: 0.55 },
      { f: 1108.73, t: 0.44, d: 0.40, v: 0.55 },
      { f: 1318.51, t: 0.56, d: 0.60, v: 0.60 }
    ];
    notes.forEach(n => {
      this.playChime(n.f, n.d, n.v, n.t);
    });
  }

  playAllCompleted() {
    if (!this.enabled) return;
    this.initContext();
    // Grand victory fanfare
    const victory = [
      { f: 523.25, d: 0.18, t: 0.00, v: 0.45 },
      { f: 523.25, d: 0.18, t: 0.15, v: 0.45 },
      { f: 523.25, d: 0.18, t: 0.30, v: 0.45 },
      { f: 659.25, d: 0.35, t: 0.45, v: 0.55 },
      { f: 587.33, d: 0.20, t: 0.75, v: 0.50 },
      { f: 659.25, d: 0.20, t: 0.90, v: 0.52 },
      { f: 783.99, d: 0.70, t: 1.05, v: 0.60 }
    ];
    victory.forEach(v => {
      this.playChime(v.f, v.d, v.v, v.t);
    });
  }

  playClick() {
    if (!this.enabled) return;
    this.playTone(880, 'sine', 0.06, 0.35, 0);
  }

  testSound() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.playQuestComplete();
      });
    } else {
      this.playQuestComplete();
    }
  }
}

window.animeAudio = new AnimeAudioEngine();
