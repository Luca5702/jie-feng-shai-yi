// Synthesized Web Audio API Sound Effects for 《借风晒衣》 (No external asset licensing issues)
// Handles mobile browser unlock and visibilitychange suspension (Section 11).

class CourtyardAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._setupVisibilityHandler();
  }

  _ensureCtx() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _setupVisibilityHandler() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        this.ctx.suspend().catch(() => {});
      } else if (this.enabled) {
        this.ctx.resume().catch(() => {});
      }
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // 1. Soft wooden clothespin click on cell preview
  playPreviewTap() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.045);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  // 2. Crisp bamboo hang confirmation sound
  playHangConfirm(isHeavy = false) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = isHeavy ? 330 : 440;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.09);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  // 3. Move ticket whoosh
  playMoveTicket() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.12);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // 4. Courtyard wind gust sweep + chime for collected clothes
  playWindGust(collectedCount = 0) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Gentle filtered noise breeze
    const bufferSize = Math.floor(ctx.sampleRate * 0.28);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1100, now + 0.25);
    filter.Q.value = 2.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Chime notes for collected clothes
    const notes = [523.25, 659.25, 783.99];
    for (let i = 0; i < Math.min(collectedCount, 3); i++) {
      const osc = ctx.createOscillator();
      const cGain = ctx.createGain();
      const t = now + 0.08 + i * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[i], t);
      cGain.gain.setValueAtTime(0.11, t);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(cGain);
      cGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    }
  }

  // 5. Level complete chord
  playEndgame(won = true) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = won ? [440, 554.37, 659.25, 880] : [392, 349.23, 311.13];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.065;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }
}

export const sound = new CourtyardAudio();
