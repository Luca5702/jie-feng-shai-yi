// Commercial-grade Web Audio Sound & Ambient Soundscape Engine for 《借风晒衣》
// Pure procedural synthesis: pentatonic kalimba/marimba chimes, wooden clothespin foley,
// cloth rustle, directional wind sweep, and optional cozy afternoon courtyard breeze loop.

class CommercialGameAudio {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = false;
    this.bgmTimer = null;
    this.breezeNode = null;
    this.breezeGain = null;
    this._setupLifecycle();
  }

  _ensureCtx() {
    if (!this.sfxEnabled && !this.bgmEnabled) return null;
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

  _setupLifecycle() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        this.ctx.suspend().catch(() => {});
      } else if (this.sfxEnabled || this.bgmEnabled) {
        this.ctx.resume().catch(() => {});
      }
    });
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxEnabled) this.playUiClick();
    return this.sfxEnabled;
  }

  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this._startAmbientSoundscape();
    } else {
      this._stopAmbientSoundscape();
    }
    return this.bgmEnabled;
  }

  _startAmbientSoundscape() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    this._stopAmbientSoundscape();

    // Soft continuous courtyard breeze bed
    const bufLen = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 1.2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    this.breezeNode = src;
    this.breezeGain = gain;

    // Gentle pentatonic wind-chime / acoustic kalimba notes every few seconds
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5 D5 E5 G5 A5 C6
    const scheduleChime = () => {
      if (!this.bgmEnabled || !this.ctx || document.hidden) return;
      const now = this.ctx.currentTime;
      const noteCount = Math.random() > 0.55 ? 2 : 1;
      for (let i = 0; i < noteCount; i++) {
        const freq = scale[Math.floor(Math.random() * scale.length)];
        this._playKalimbaNote(freq, now + i * 0.24, 0.032, 1.4);
      }
    };
    scheduleChime();
    this.bgmTimer = setInterval(scheduleChime, 3400);
  }

  _stopAmbientSoundscape() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.breezeNode) {
      try {
        this.breezeNode.stop();
        this.breezeNode.disconnect();
      } catch (e) {}
      this.breezeNode = null;
    }
  }

  _playKalimbaNote(freq, startTime, volume = 0.1, duration = 0.5) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();
    const overGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    overGain.gain.setValueAtTime(volume * 0.25, startTime);
    overGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.35);

    osc.connect(gain);
    overtone.connect(overGain);
    overGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    overtone.start(startTime);
    osc.stop(startTime + duration + 0.02);
    overtone.stop(startTime + duration + 0.02);
  }

  playUiClick() {
    if (!this.sfxEnabled) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    this._playKalimbaNote(659.25, ctx.currentTime, 0.06, 0.12);
  }

  // Soft wooden clothespin tap when previewing a cell
  playPreviewTap() {
    if (!this.sfxEnabled) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Cloth rustle + warm bamboo thud + clothespin snap when hanging garment
  playHangConfirm(isHeavy = false) {
    if (!this.sfxEnabled) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Cloth rustle burst
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = isHeavy ? 900 : 1650;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.08, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);

    // Bamboo pole resonant note
    this._playKalimbaNote(isHeavy ? 349.23 : 523.25, now + 0.02, 0.13, 0.24);
    this._playKalimbaNote(isHeavy ? 440.0 : 659.25, now + 0.065, 0.09, 0.22);
  }

  // Move Ticket whoosh
  playMoveTicket() {
    if (!this.sfxEnabled) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    this._playKalimbaNote(440, now, 0.1, 0.18);
    this._playKalimbaNote(587.33, now + 0.06, 0.12, 0.25);
    this._playKalimbaNote(783.99, now + 0.12, 0.1, 0.3);
  }

  // Rich courtyard wind gust + ascending pentatonic chimes per collected garment
  playWindGust(collectedCount = 0, hitCount = 1) {
    if (!this.sfxEnabled) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Expressive swirling breeze sweep
    const duration = 0.62;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(1280, now + 0.32);
    filter.frequency.exponentialRampToValueAtTime(520, now + duration);
    filter.Q.value = 2.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);

    // Subtle wooden rattle for hit clothes
    for (let i = 0; i < Math.min(hitCount, 3); i++) {
      this._playKalimbaNote(392 + i * 44, now + 0.12 + i * 0.05, 0.06, 0.16);
    }

    // Sparkling pentatonic reward chimes for collected dry garments
    const rewardNotes = [587.33, 783.99, 987.77, 1174.66];
    for (let i = 0; i < Math.min(collectedCount, 4); i++) {
      this._playKalimbaNote(rewardNotes[i], now + 0.22 + i * 0.095, 0.15, 0.55);
    }
  }

  // Endgame celebration or gentle encouragement
  playEndgame(won = true) {
    if (!this.sfxEnabled) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (won) {
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      chord.forEach((freq, idx) => {
        this._playKalimbaNote(freq, now + idx * 0.08, 0.14, 0.75);
      });
    } else {
      const notes = [440, 392, 329.63];
      notes.forEach((freq, idx) => {
        this._playKalimbaNote(freq, now + idx * 0.11, 0.1, 0.45);
      });
    }
  }
}

export const sound = new CommercialGameAudio();
