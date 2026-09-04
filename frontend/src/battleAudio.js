// Web Audio API Synthesizer for Neta Battle Arena

class BattleAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  // Ensure AudioContext exists and is resumed (handles browser autoplay policies)
  getAudioContext() {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Classic 3-ring boxing bell at match start or end: "DING! DING! DING!"
  playBoxingBell() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const strikes = [0, 0.22, 0.44];
    strikes.forEach((delay) => {
      this._ringBellStrike(ctx, ctx.currentTime + delay, 820, 1.4);
    });
  }

  // Single round gong / bell strike for each round announcement
  playRoundBell(roundNum = 1) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Subtle pitch progression per round (higher = more intense)
    const baseFreq = 780 + Math.min(roundNum * 35, 200);
    this._ringBellStrike(ctx, ctx.currentTime, baseFreq, 1.8);
  }

  // Helper to synthesize a realistic metallic brass bell strike
  _ringBellStrike(ctx, startTime, baseFreq = 800, duration = 1.5) {
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.7, startTime);

    // Harmonics for brassy metal ring
    const harmonics = [
      { ratio: 1.0, gain: 0.4, type: 'triangle' },
      { ratio: 1.48, gain: 0.25, type: 'sine' },
      { ratio: 2.12, gain: 0.15, type: 'sine' },
      { ratio: 3.25, gain: 0.08, type: 'sine' },
    ];

    harmonics.forEach(({ ratio, gain, type }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(baseFreq * ratio, startTime);

      oscGain.gain.setValueAtTime(gain, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // Punch impact / whoosh sound when round scores clash
  playPunchImpact() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Sub-bass punch body (rapid frequency drop 180Hz -> 38Hz)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);

    // 2. Filtered noise crack / glove hit
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      filter.Q.setValueAtTime(1.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.12);
    } catch (_) {
      // Ignore if noise buffer fails in older browsers
    }
  }

  // Two-tone score reveal chime for round winner announcement
  playRoundWinnerChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0, dur: 0.3 },    // E5
      { freq: 880.0, time: 0.12, dur: 0.6 },  // A5
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.28, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });
  }

  // Triumphant victory fanfare for final champion crowning
  playVictoryFanfare() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Grand fanfare arpeggio: G4 -> C5 -> E5 -> G5 -> High C6
    const fanfareNotes = [
      { freq: 392.0, time: 0.0, dur: 0.22 },     // G4
      { freq: 523.25, time: 0.18, dur: 0.22 },   // C5
      { freq: 659.25, time: 0.36, dur: 0.22 },   // E5
      { freq: 783.99, time: 0.54, dur: 0.35 },   // G5
      { freq: 1046.50, time: 0.85, dur: 1.6 },   // High C6 (grand finish)
    ];

    fanfareNotes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.35, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });

    // Triple celebratory bell shimmer at end
    const bellOffsets = [1.0, 1.25, 1.5];
    bellOffsets.forEach((offset) => {
      this._ringBellStrike(ctx, now + offset, 1174.66, 0.9); // D6 bell
    });
  }
}

export const battleAudio = new BattleAudioEngine();
