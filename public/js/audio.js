// Anime Audio Synthesizer (Zero external audio file dependencies!)
class AnimeAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('quest_sound_enabled') !== 'false';
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('quest_sound_enabled', this.enabled ? 'true' : 'false');
    if (this.enabled) {
      this.playClick();
    }
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1, delay = 0) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    setTimeout(() => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // AudioContext error handling
      }
    }, delay * 1000);
  }

  playQuestComplete() {
    if (!this.enabled) return;
    // Energetic 3-tone anime success arpeggio
    this.playTone(523.25, 'triangle', 0.2, 0.15, 0.0);    // C5
    this.playTone(659.25, 'triangle', 0.2, 0.16, 0.08);   // E5
    this.playTone(783.99, 'triangle', 0.25, 0.18, 0.16);  // G5
    this.playTone(1046.50, 'sine', 0.4, 0.22, 0.24);     // C6
  }

  playQuestUncheck() {
    if (!this.enabled) return;
    this.playTone(392.00, 'sine', 0.12, 0.1, 0.0);
    this.playTone(261.63, 'sine', 0.16, 0.1, 0.07);
  }

  playLevelUp() {
    if (!this.enabled) return;
    // Grand anime fanfare chord progression
    const notes = [
      { f: 440.00, t: 0.0 },   // A4
      { f: 554.37, t: 0.1 },   // C#5
      { f: 659.25, t: 0.2 },   // E5
      { f: 880.00, t: 0.3 },   // A5
      { f: 1108.73, t: 0.45 }, // C#6
      { f: 1318.51, t: 0.6 }   // E6
    ];
    notes.forEach(n => {
      this.playTone(n.f, 'triangle', 0.5, 0.2, n.t);
    });
  }

  playAllCompleted() {
    if (!this.enabled) return;
    // Victory fanfare!
    const victory = [
      { f: 523.25, d: 0.15, t: 0.0 },
      { f: 523.25, d: 0.15, t: 0.15 },
      { f: 523.25, d: 0.15, t: 0.30 },
      { f: 659.25, d: 0.3,  t: 0.45 },
      { f: 587.33, d: 0.15, t: 0.75 },
      { f: 659.25, d: 0.15, t: 0.90 },
      { f: 783.99, d: 0.6,  t: 1.05 }
    ];
    victory.forEach(v => {
      this.playTone(v.f, 'sine', v.d, 0.22, v.t);
    });
  }

  playClick() {
    if (!this.enabled) return;
    this.playTone(880, 'sine', 0.04, 0.05, 0);
  }
}

window.animeAudio = new AnimeAudioEngine();
