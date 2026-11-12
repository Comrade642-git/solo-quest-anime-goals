// Anime Audio Synthesizer with Theme-Specific Soundscapes
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
          this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
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
      this.playChime(784, 0.25, 0.45);
    }
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.2, volume = 0.35, delay = 0) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const startTime = this.ctx.currentTime + (delay || 0);

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

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

  playChime(freq, duration = 0.35, volume = 0.45, delay = 0) {
    this.playTone(freq, 'sine', duration, volume * 0.8, delay);
    this.playTone(freq * 2.01, 'triangle', duration * 0.7, volume * 0.4, delay);
  }

  // --- THEME-SPECIFIC SOUND EFFECTS ---
  playThemeSound(theme) {
    if (!this.enabled) return;
    this.initContext();

    switch (theme) {
      // 1. Sung Jin-Woo / Shadow Monarch: Solo Leveling System window notification & shadow pulse
      case 'monarch':
        this.playTone(130.81, 'triangle', 0.4, 0.5, 0.0);    // Low C3 Shadow sub-bass
        this.playTone(523.25, 'sine', 0.2, 0.45, 0.05);      // C5 System chime
        this.playTone(659.25, 'sine', 0.2, 0.48, 0.12);      // E5
        this.playTone(1046.50, 'triangle', 0.45, 0.55, 0.20); // High C6 System alert ping
        break;

      // 2. Flame Hashira: Fiery blazing Nichirin strike (bold brass sawtooth chords)
      case 'flame':
        this.playTone(220.00, 'sawtooth', 0.35, 0.4, 0.0);   // A3 Fire ignition
        this.playTone(440.00, 'triangle', 0.3, 0.5, 0.06);   // A4
        this.playTone(554.37, 'sawtooth', 0.3, 0.5, 0.14);   // C#5 Nichirin blade ignite
        this.playTone(659.25, 'sawtooth', 0.45, 0.55, 0.22); // E5
        this.playTone(880.00, 'triangle', 0.5, 0.55, 0.30);  // High A5 Blazing strike!
        break;

      // 3. Cyber Ninja: Neo-Tokyo digital laser pulse / FM cyber glitch
      case 'cyberpunk':
        this.playTone(600, 'square', 0.06, 0.35, 0.0);
        this.playTone(900, 'square', 0.08, 0.4, 0.06);
        this.playTone(1400, 'square', 0.12, 0.45, 0.12);
        this.playTone(1800, 'sine', 0.25, 0.5, 0.18);
        break;

      // 4. Valley Wanderer (Ghibli): Peaceful celestial wind-chimes & magical harp
      case 'ghibli':
        this.playTone(440.00, 'sine', 0.4, 0.35, 0.0);       // A4
        this.playTone(554.37, 'sine', 0.4, 0.38, 0.10);      // C#5
        this.playTone(659.25, 'sine', 0.4, 0.40, 0.20);      // E5
        this.playTone(880.00, 'sine', 0.5, 0.45, 0.30);      // A5
        this.playTone(1108.73, 'sine', 0.6, 0.45, 0.40);     // C#6 Gentle breeze
        break;

      // 5. Sakura Sorcerer: Traditional Japanese shrine bell & resonant koto
      case 'sakura':
        this.playTone(293.66, 'triangle', 0.5, 0.4, 0.0);    // D4 Temple Bell
        this.playTone(311.13, 'sine', 0.4, 0.4, 0.08);       // Eb4 (Insen scale)
        this.playTone(392.00, 'sine', 0.4, 0.42, 0.16);      // G4
        this.playTone(587.33, 'triangle', 0.5, 0.45, 0.24);  // D5
        this.playTone(880.00, 'sine', 0.6, 0.5, 0.34);       // A5 Shrine chime
        break;

      default:
        this.playQuestComplete();
        break;
    }
  }

  playQuestComplete(theme = null) {
    if (!this.enabled) return;
    this.initContext();
    const activeTheme = theme || document.body.getAttribute('data-theme') || 'monarch';
    this.playThemeSound(activeTheme);
  }

  playQuestUncheck() {
    if (!this.enabled) return;
    this.playTone(392.00, 'sine', 0.15, 0.3, 0.0);
    this.playTone(261.63, 'sine', 0.20, 0.3, 0.06);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.initContext();
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

  testSound(theme = null) {
    this.initContext();
    const t = theme || document.body.getAttribute('data-theme') || 'monarch';
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.playThemeSound(t);
      });
    } else {
      this.playThemeSound(t);
    }
  }
}

window.animeAudio = new AnimeAudioEngine();
