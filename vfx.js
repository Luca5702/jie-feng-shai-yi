// Real-time 2D Canvas VFX Renderer for 《借风晒衣》 Commercial Edition
// Renders floating sunlit dust motes, drifting osmanthus/ginkgo leaves,
// animated wind gust streamlines across the 3x3 courtyard, and celebratory sparkles.

export class CourtyardVfxEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.running = false;
    this.rafId = null;

    this.ambientWindDir = 'W'; // Current upcoming wind direction for gentle ambient drift
    this.motes = [];
    this.windRibbons = [];
    this.burstParticles = [];
    this.floatingTexts = [];

    if (this.canvas) {
      this._initMotes();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.start();
        }
      });
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _initMotes() {
    this.motes = [];
    for (let i = 0; i < 28; i++) {
      this.motes.push({
        x: Math.random() * 600,
        y: Math.random() * 600,
        r: 1.5 + Math.random() * 2.8,
        alpha: 0.25 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.45,
        isPetal: i % 5 === 0,
        rot: Math.random() * Math.PI * 2,
      });
    }
  }

  setAmbientWindDirection(dir) {
    if (dir) this.ambientWindDir = dir;
  }

  _dirVector(dir) {
    switch (dir) {
      case 'W': return { vx: 1, vy: 0 };
      case 'E': return { vx: -1, vy: 0 };
      case 'N': return { vx: 0, vy: 1 };
      case 'S': return { vx: 0, vy: -1 };
      default: return { vx: 0.7, vy: 0.2 };
    }
  }

  /**
   * Triggers dramatic visible wind ribbons sweeping across the courtyard in direction `dir`
   */
  triggerWindGustVfx(dir) {
    this.resize();
    const { vx, vy } = this._dirVector(dir);
    const count = 18;
    for (let i = 0; i < count; i++) {
      const spread = (i + 0.5) / count;
      let startX, startY;
      if (vx > 0) {
        startX = -60 - Math.random() * 120;
        startY = spread * this.height + (Math.random() - 0.5) * 30;
      } else if (vx < 0) {
        startX = this.width + 60 + Math.random() * 120;
        startY = spread * this.height + (Math.random() - 0.5) * 30;
      } else if (vy > 0) {
        startX = spread * this.width + (Math.random() - 0.5) * 30;
        startY = -60 - Math.random() * 120;
      } else {
        startX = spread * this.width + (Math.random() - 0.5) * 30;
        startY = this.height + 60 + Math.random() * 120;
      }

      this.windRibbons.push({
        x: startX,
        y: startY,
        vx: vx * (9.5 + Math.random() * 4.5),
        vy: vy * (9.5 + Math.random() * 4.5),
        len: 65 + Math.random() * 75,
        width: 2 + Math.random() * 2.5,
        waveAmp: 4 + Math.random() * 6,
        waveFreq: 0.04 + Math.random() * 0.03,
        life: 0,
        maxLife: 48 + Math.random() * 18,
      });
    }
  }

  /**
   * Spawns golden/emerald sparkles and floating "+5" / "+2" score text over a specific cell element
   */
  spawnCellBurst(cellEl, points = 0, isDryCollect = false) {
    if (!cellEl || !this.canvas) return;
    this.resize();
    const stageRect = this.canvas.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();
    const cx = cellRect.left - stageRect.left + cellRect.width / 2;
    const cy = cellRect.top - stageRect.top + cellRect.height / 2;

    const particleCount = isDryCollect ? 22 : 10;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
      const speed = isDryCollect ? 2.2 + Math.random() * 3.6 : 1.4 + Math.random() * 2.0;
      this.burstParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isDryCollect ? 1.2 : 0.4),
        r: isDryCollect ? 2.8 + Math.random() * 3 : 2 + Math.random() * 2,
        color: isDryCollect
          ? i % 2 === 0 ? 'hsl(42, 96%, 62%)' : 'hsl(154, 72%, 52%)'
          : 'hsl(195, 88%, 64%)',
        life: 0,
        maxLife: isDryCollect ? 42 : 26,
      });
    }

    if (points > 0) {
      this.floatingTexts.push({
        x: cx,
        y: cy - 10,
        text: `+${points} 分`,
        sub: points === 5 ? '厚衣收走!' : '薄衣收走!',
        color: points === 5 ? 'hsl(32, 95%, 52%)' : 'hsl(152, 72%, 38%)',
        life: 0,
        maxLife: 58,
      });
    } else {
      this.floatingTexts.push({
        x: cx,
        y: cy - 6,
        text: '湿度 -1',
        sub: '迎风半干',
        color: 'hsl(196, 85%, 44%)',
        life: 0,
        maxLife: 44,
      });
    }
  }

  start() {
    if (this.running || !this.ctx) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this._updateAndDraw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _updateAndDraw() {
    if (this.width === 0 || this.height === 0) {
      this.resize();
      if (this.width === 0) return;
    }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Ambient sunlit motes & golden osmanthus petals drifting with upcoming wind
    const { vx: ambVx, vy: ambVy } = this._dirVector(this.ambientWindDir);
    for (const m of this.motes) {
      m.phase += 0.03;
      m.x += ambVx * m.speed + Math.sin(m.phase) * 0.28;
      m.y += ambVy * m.speed + Math.cos(m.phase * 0.8) * 0.28;
      m.rot += 0.02;

      if (m.x < -15) m.x = this.width + 15;
      if (m.x > this.width + 15) m.x = -15;
      if (m.y < -15) m.y = this.height + 15;
      if (m.y > this.height + 15) m.y = -15;

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      if (m.isPetal) {
        ctx.fillStyle = `hsla(40, 92%, 66%, ${m.alpha * 0.85})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, m.r * 1.7, m.r * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `hsla(48, 95%, 86%, ${m.alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Active Wind Gust Streamlines
    for (let i = this.windRibbons.length - 1; i >= 0; i--) {
      const r = this.windRibbons[i];
      r.life++;
      r.x += r.vx;
      r.y += r.vy;
      if (r.life >= r.maxLife) {
        this.windRibbons.splice(i, 1);
        continue;
      }
      const progress = r.life / r.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.82;

      ctx.save();
      ctx.strokeStyle = `hsla(192, 95%, 92%, ${alpha})`;
      ctx.shadowColor = 'hsla(195, 90%, 55%, 0.65)';
      ctx.shadowBlur = 8;
      ctx.lineWidth = r.width;
      ctx.lineCap = 'round';
      ctx.beginPath();

      const normX = r.vx === 0 ? 0 : r.vx / Math.abs(r.vx);
      const normY = r.vy === 0 ? 0 : r.vy / Math.abs(r.vy);

      for (let s = 0; s <= 6; s++) {
        const t = s / 6;
        const px = r.x - normX * r.len * t + normY * Math.sin(r.life * 0.25 + t * 4) * r.waveAmp;
        const py = r.y - normY * r.len * t + normX * Math.sin(r.life * 0.25 + t * 4) * r.waveAmp;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Burst Sparkles
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.vx *= 0.96;
      if (p.life >= p.maxLife) {
        this.burstParticles.splice(i, 1);
        continue;
      }
      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Floating Score Popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life++;
      ft.y -= 0.85;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      const t = ft.life / ft.maxLife;
      const alpha = t < 0.75 ? 1 : (1 - t) / 0.25;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 18px "Noto Sans SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 252, 245, 0.95)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);

      if (ft.sub) {
        ctx.font = '600 11px "Noto Sans SC", system-ui, sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.sub, ft.x, ft.y + 15);
        ctx.fillText(ft.sub, ft.x, ft.y + 15);
      }
      ctx.restore();
    }
  }
}
