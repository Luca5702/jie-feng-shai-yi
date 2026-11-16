// 借风晒衣 · 简洁亲和版
// 规则全部由 engine.js 计算；本文件只负责界面、引导与动效。
import {
  WIND_META,
  GARMENT_META,
  createInitialState,
  isBoardFull,
  previewActionForecast,
  applyMoveAction,
  applyPlaceOrSkipAction,
} from './engine.js';
import { LEVELS } from './levels.js';
import { sound } from './audio.js';

const SAVE_KEY = 'jggo_friendly_v3';
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (fn) => { try { fn(); } catch (_) { /* 音频失败不影响游戏 */ } };

/* ------------------------------------------------------------------ */
/* 美术：扁平衣物插画                                                    */
/* ------------------------------------------------------------------ */
const PIN = '<rect x="21" y="0" width="6" height="11" rx="2" fill="#d9a46c"/><rect x="37" y="0" width="6" height="11" rx="2" fill="#d9a46c"/>';
const THIN_SVG = `<svg viewBox="0 0 64 70" aria-hidden="true">
  <path d="M21 7 L7 15 L2 28 L13 32 L16 25 L16 60 Q16 63 19 63 L45 63 Q48 63 48 60 L48 25 L51 32 L62 28 L57 15 L43 7 Q32 15 21 7 Z" fill="#8fd0ef"/>
  <path d="M21 7 Q32 15 43 7 L40 6 Q32 12 24 6 Z" fill="#5fb3dd"/>
  <path d="M16 25 L16 60 Q16 63 19 63 L24 63 L24 20 Z" fill="#000" opacity=".05"/>
  ${PIN}</svg>`;
const THICK_SVG = `<svg viewBox="0 0 64 70" aria-hidden="true">
  <path d="M20 7 L6 16 L1 52 L12 54 L16 31 L16 60 Q16 64 20 64 L44 64 Q48 64 48 60 L48 31 L52 54 L63 52 L58 16 L44 7 Q32 16 20 7 Z" fill="#f4906f"/>
  <path d="M20 7 Q32 16 44 7 L41 5 Q32 12 23 5 Z" fill="#d96a4a"/>
  <path d="M16 56 L48 56 L48 60 Q48 64 44 64 L20 64 Q16 64 16 60 Z" fill="#d96a4a"/>
  <path d="M1 48 L12 50 L12 54 L1 52 Z M52 50 L63 48 L63 52 L52 54 Z" fill="#d96a4a"/>
  <path d="M22 30 H42 M22 38 H42 M22 46 H42" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>
  ${PIN}</svg>`;
const DROP = (dry) => `<svg class="drop${dry ? ' is-dry' : ''}" viewBox="0 0 10 13"><path d="M5 0 C5 0 0 6 0 8.4 A5 4.6 0 0 0 10 8.4 C10 6 5 0 5 0 Z"/></svg>`;
const STAR = (on) => `<svg class="s${on ? ' on' : ''}" viewBox="0 0 24 24"><path d="M12 1.8l3 6.4 7 .8-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9l7-.8z" stroke-linejoin="round"/></svg>`;
const HAND = `<svg class="hand" viewBox="0 0 48 48"><path d="M18 22V9a3 3 0 0 1 6 0v11l1-.2V16a3 3 0 0 1 6 0v4.6l.8-.1a3 3 0 0 1 5.2 2V33c0 7-5 11-11 11h-2c-4 0-6.5-1.8-8.6-4.6L9.2 31a3 3 0 0 1 4.6-3.8L18 31z" fill="#fff" stroke="#2d3a46" stroke-width="2.4" stroke-linejoin="round"/></svg>`;

function garmentHtml(type, wetness, { ghost = false, drops = true } = {}) {
  const w = wetness ?? GARMENT_META[type].initialWetness;
  const dropHtml = drops ? `<div class="drops">${Array.from({ length: w }, () => DROP(false)).join('')}</div>` : '';
  return `<div class="garment${ghost ? ' is-ghost' : ''}">${type === 'H' ? THICK_SVG : THIN_SVG}${dropHtml}</div>`;
}

/* ------------------------------------------------------------------ */
/* 关卡信息与存档                                                        */
/* ------------------------------------------------------------------ */
const CHAPTERS = [
  { stage: '新手教学', name: '新手教学', desc: '三步学会怎么玩' },
  { stage: '早期标准', name: '第一章 · 微风', desc: '四个方向的风轮流吹' },
  { stage: '中期进阶', name: '第二章 · 穿堂风', desc: '学会让衣服互相让位' },
  { stage: '后期挑战', name: '第三章 · 大风天', desc: '每一分都要算清楚' },
];
const isTutorial = (lv) => lv.stage === '新手教学';
const levelLabel = (lv) => (isTutorial(lv) ? lv.id.slice(1) : lv.id.slice(1));
const levelName = (lv) => (isTutorial(lv) ? `教学 ${lv.id.slice(1)}` : `第 ${lv.id.slice(1)} 关`);
const shortTitle = (lv) => (lv.title.split('·')[1] || '').replace(/（.*?）/g, '').trim();

function starsFor(lv, score) {
  if (score < lv.target) return 0;
  const best = Math.max(lv.maxFoundScore ?? lv.target, lv.witnessScore ?? lv.target, lv.target);
  if (score >= best) return 3;
  return score >= lv.target + Math.ceil((best - lv.target) / 2) ? 2 : 1;
}

const COACH = {
  T1: ['点<b>亮起的格子</b>，挂上第一件衣服', '风从<b>左边</b>吹来，每行<b>第一件</b>会被吹到'],
  T2: ['这次是<b>北风</b>，从上往下吹', '每一列只有<b>最上面</b>那件吹得到', '挂满第一排，三列都能吹到'],
  T3: ['<b>厚衣</b>有 2 滴水，要吹 <b>2 阵风</b>才会干', '挂好这件就会起风，看看厚衣', '厚衣还剩 1 滴，下一阵<b>北风</b>会吹干它', '最后一件，同样挂在第一排'],
};
const TUTORIAL_TOAST = {
  T1: ['吹干啦！薄衣每件 +2'],
  T2: ['三列各吹干一件 +6'],
  T3: ['厚衣少了 1 滴，薄衣吹干 +2', '厚衣也干了 +5'],
};

/* ------------------------------------------------------------------ */
class Game {
  constructor() {
    this.save = this.loadSave();
    this.level = null;
    this.state = null;
    this.mode = 'idle'; // idle | preview | pickMove | movePreview
    this.sel = null; // {r,c} 预览格 / 待挪衣服
    this.target = null; // 挪位目标
    this.busy = false;
    this.demoToken = 0;
    sound.sfxEnabled = this.save.sfx !== false;
    this.bind();
    this.renderHomeArt();
    this.show('home');
  }

  loadSave() {
    try {
      return { unlocked: 0, best: {}, stars: {}, sfx: true, ...(JSON.parse(localStorage.getItem(SAVE_KEY)) || {}) };
    } catch (_) {
      return { unlocked: 0, best: {}, stars: {}, sfx: true };
    }
  }
  persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (_) {} }

  /* ---------------- 绑定 ---------------- */
  bind() {
    const click = (id, fn) => $(id).addEventListener('click', () => { safe(() => sound.playUiClick()); fn(); });
    click('btn-start', () => this.startLevel(Math.min(this.save.unlocked, LEVELS.length - 1)));
    click('btn-levels', () => this.show('map'));
    click('btn-howto-home', () => this.openHowto());
    click('btn-home-sound', () => this.toggleSfx());
    click('btn-map-back', () => this.show('home'));
    click('btn-play-back', () => { this.stopDemo(); this.show('map'); });
    click('btn-menu', () => this.openMenu());
    click('btn-ticket', () => this.onTicket());
    click('demo-banner', () => this.stopDemo(true));
    $('btn-confirm').addEventListener('click', () => this.onConfirm());
    $('scrim').addEventListener('click', () => { if (!this.modalLocked) this.closeLayer(); });
    $('board').addEventListener('click', (e) => {
      const el = e.target.closest('.cell');
      if (el) this.onCell(+el.dataset.r, +el.dataset.c);
    });
    window.addEventListener('resize', () => { if (this.state) this.renderWindSide(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeLayer(); });
  }

  show(name) {
    for (const s of ['home', 'map', 'play']) $(`screen-${s}`).hidden = s !== name;
    this.closeLayer();
    if (name === 'map') this.renderMap();
    if (name === 'home') $('btn-home-sound').textContent = sound.sfxEnabled ? '🔊' : '🔈';
  }

  toggleSfx() {
    this.save.sfx = sound.toggleSfx();
    this.persist();
    $('btn-home-sound').textContent = sound.sfxEnabled ? '🔊' : '🔈';
  }

  renderHomeArt() {
    $('home-line').innerHTML = `
      <svg class="rope" viewBox="0 0 280 40" preserveAspectRatio="none"><path d="M0 4 Q140 34 280 4" stroke="#b9a58a" stroke-width="2.5" fill="none"/></svg>
      <div class="hang">${garmentHtml('L', 1, { drops: false })}</div>
      <div class="hang">${garmentHtml('H', 2, { drops: false })}</div>
      <div class="hang">${garmentHtml('L', 1, { drops: false })}</div>`;
  }

  /* ---------------- 地图 ---------------- */
  renderMap() {
    const total = Object.values(this.save.stars).reduce((a, b) => a + b, 0);
    $('star-total').innerHTML = `⭐ ${total}`;
    $('map-list').innerHTML = CHAPTERS.map((ch) => {
      const nodes = LEVELS.map((lv, i) => ({ lv, i })).filter(({ lv }) => lv.stage === ch.stage).map(({ lv, i }) => {
        const locked = i > this.save.unlocked;
        const next = i === this.save.unlocked && !this.save.best[lv.id];
        const st = this.save.stars[lv.id] || 0;
        const stars = [0, 1, 2].map((k) => `<span class="${k < st ? 'on' : ''}">★</span>`).join('');
        return `<button class="node ${locked ? 'is-locked' : ''} ${next ? 'is-next' : ''}" data-i="${i}" ${locked ? 'disabled' : ''}>
          <b>${locked ? '🔒' : levelLabel(lv)}</b>${locked ? '' : `<span class="stars">${stars}</span>`}</button>`;
      }).join('');
      return `<div class="chapter"><h3>${ch.name}</h3><p>${ch.desc}</p><div class="node-grid">${nodes}</div></div>`;
    }).join('');
    $('map-list').querySelectorAll('.node:not(.is-locked)').forEach((n) =>
      n.addEventListener('click', () => { safe(() => sound.playUiClick()); this.startLevel(+n.dataset.i); }));
  }

  /* ---------------- 开局 ---------------- */
  startLevel(index) {
    this.stopDemo();
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.state = createInitialState(this.level);
    this.mode = 'idle';
    this.sel = this.target = null;
    this.busy = false;
    this.show('play');
    $('screen-play').classList.toggle('is-guided', isTutorial(this.level));
    $('play-title').textContent = `${levelName(this.level)} · ${shortTitle(this.level)}`;
    this.render();
    if (this.level.id === 'L1' && !this.save.sawL1) {
      this.save.sawL1 = true;
      this.persist();
      this.openHowto();
    }
  }

  get guided() { return isTutorial(this.level) && this.demoToken === 0; }
  get guideAction() {
    if (!this.guided) return null;
    return this.level.witnessActions[this.state.actionLog.length] || null;
  }
  get currentType() { return this.state.queue[this.state.placedCount]; }
  get playing() { return this.state.status === 'playing' && this.state.placedCount < this.state.queue.length; }

  /* ---------------- 交互 ---------------- */
  onCell(r, c) {
    if (this.busy || this.demoActive || !this.playing) return;
    const cell = this.state.grid[r][c];
    const g = this.guideAction;

    if (g) {
      if (g.type === 'place' && g.at[0] === r && g.at[1] === c) this.commit({ type: 'place', at: [r, c] });
      return;
    }

    if (this.mode === 'pickMove' || this.mode === 'movePreview') {
      if (cell) {
        if (this.sel && this.sel.r === r && this.sel.c === c) return this.resetMode();
        this.sel = { r, c }; this.target = null; this.mode = 'pickMove';
        safe(() => sound.playPreviewTap());
        return this.render();
      }
      if (!this.sel) return;
      if (this.mode === 'movePreview' && this.target.r === r && this.target.c === c) return this.onConfirm();
      this.target = { r, c }; this.mode = 'movePreview';
      safe(() => sound.playPreviewTap());
      return this.render();
    }

    if (cell) {
      if (this.state.tickets <= 0) return this.toast('挪位券用完啦', '已挂的衣服不能再挪');
      this.mode = 'pickMove'; this.sel = { r, c }; this.target = null;
      safe(() => sound.playPreviewTap());
      return this.render();
    }

    if (this.mode === 'preview' && this.sel.r === r && this.sel.c === c) return this.onConfirm();
    this.mode = 'preview'; this.sel = { r, c };
    safe(() => sound.playPreviewTap());
    this.render();
  }

  onTicket() {
    if (this.busy || this.demoActive || !this.playing || this.guided) return;
    if (this.mode === 'pickMove' || this.mode === 'movePreview') return this.resetMode();
    if (this.state.tickets <= 0) return this.toast('挪位券用完啦');
    const hasGarment = this.state.grid.some((row) => row.some(Boolean));
    if (!hasGarment) return this.toast('先挂几件衣服', '才能挪动它们');
    this.mode = 'pickMove'; this.sel = null; this.target = null;
    this.render();
  }

  onConfirm() {
    if (this.busy || !this.playing) return;
    if (isBoardFull(this.state.grid) && this.mode === 'idle') return this.commit({ type: 'skip' });
    if (this.mode === 'preview') return this.commit({ type: 'place', at: [this.sel.r, this.sel.c] });
    if (this.mode === 'movePreview') return this.commitMove();
  }

  resetMode() { this.mode = 'idle'; this.sel = this.target = null; this.render(); }

  commitMove() {
    const { r, c } = this.sel; const t = this.target;
    try {
      const res = applyMoveAction(this.state, r, c, t.r, t.c);
      this.state = res.state;
      safe(() => sound.playMoveTicket());
    } catch (e) { return this.toast(e.message); }
    this.mode = 'idle'; this.sel = this.target = null;
    this.render();
  }

  async commit(action) {
    if (this.busy) return;
    this.busy = true;
    const prev = this.state;
    let res;
    try { res = applyPlaceOrSkipAction(prev, action); } catch (e) { this.busy = false; return this.toast(e.message); }
    this.mode = 'idle'; this.sel = this.target = null;
    const step = prev.actionLog.length;

    if (action.type === 'place') safe(() => sound.playHangConfirm(this.currentType === 'H'));

    if (res.gustTriggered) {
      // 先展示“挂上后、起风前”的画面
      const before = action.type === 'place'
        ? previewActionForecast(prev, { type: 'place', r: action.at[0], c: action.at[1] }).tempGrid
        : prev.grid;
      this.state = { ...res.state, grid: before, score: prev.score, gustIndex: prev.gustIndex };
      this.render({ quiet: true });
      await sleep(380);
      await this.playGust(res.gustTriggered);
      this.state = res.state;
      this.render();
      this.bumpScore();
      const tTexts = TUTORIAL_TOAST[this.level.id];
      const gi = res.gustTriggered.gustNumber - 1;
      const gain = res.gustTriggered.gustScoreGain;
      if (tTexts && tTexts[gi] && this.demoToken === 0) this.toast(tTexts[gi]);
      else this.toast(gain > 0 ? `${res.gustTriggered.windName} +${gain}` : `${res.gustTriggered.windName}吹过`, gain > 0 ? `收下 ${res.gustTriggered.collectedRecords.length} 件衣服` : '这阵风没吹干衣服');
    } else {
      this.state = res.state;
      this.render();
    }
    void step;
    this.busy = false;

    if (this.state.status !== 'playing') {
      await sleep(900);
      if (this.demoActive) this.demoActive = false, ($('demo-banner').hidden = true);
      this.finish();
    }
  }

  async playGust(g) {
    const layer = $('gust-layer');
    layer.className = `gust-layer gust-${g.windDir}`;
    const horizontal = g.windDir === 'W' || g.windDir === 'E';
    let html = '';
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 2; k++) {
        const pos = `${(i * 33.3) + 16.6 + (k ? 6 : -6)}%`;
        const delay = (k * 0.18 + i * 0.06).toFixed(2);
        html += `<div class="streak" style="${horizontal ? 'top' : 'left'}:${pos};animation-delay:${delay}s"></div>`;
      }
    }
    layer.innerHTML = html;
    safe(() => sound.playWindGust(g.collectedRecords.length, g.hitRecords.length));
    await sleep(320);
    const cellEl = (r, c) => $('board').querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    for (const h of g.hitRecords) {
      const el = cellEl(h.r, h.c);
      if (!el) continue;
      if (h.collected) {
        el.classList.add('anim-fly', 'fx-collect');
        const f = document.createElement('div');
        f.className = 'float-pts'; f.textContent = `+${h.points}`;
        el.appendChild(f);
      } else {
        el.classList.add('anim-shake', 'fx-hit');
        const drops = el.querySelector('.drops .drop:last-child');
        if (drops) drops.classList.add('is-dry');
      }
    }
    await sleep(900);
    layer.innerHTML = '';
  }

  bumpScore() {
    const b = $('score-now');
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }

  /* ---------------- 渲染 ---------------- */
  render(opts = {}) {
    this.renderScore();
    this.renderWindRow();
    this.renderBoard(opts);
    this.renderWindSide();
    this.renderTray();
    this.renderCoach();
  }

  renderScore() {
    const { score, target } = this.state;
    $('score-now').textContent = score;
    $('score-target').textContent = target;
    const max = Math.max(target * 1.25, this.level.maxFoundScore || target);
    $('progress-fill').style.width = `${Math.min(100, (score / max) * 100)}%`;
    const goal = $('progress-goal');
    goal.style.left = `${(target / max) * 100}%`;
    goal.textContent = score >= target ? '✓' : '🏁';
    $('progress').classList.toggle('is-done', score >= target);
  }

  renderWindRow() {
    const s = this.state;
    const remain = s.gustEvery - (s.placedCount % s.gustEvery);
    $('wind-row').innerHTML = s.winds.map((w, i) => {
      const m = WIND_META[w];
      if (i === s.gustIndex && this.playing) {
        return `<div class="wind-dot is-now"><span class="arrow">${m.arrow}</span>${m.name}<small>· 再挂 ${remain} 件</small></div>`;
      }
      return `<div class="wind-dot ${i < s.gustIndex ? 'is-done' : ''}" title="${m.name}">${m.arrow}</div>`;
    }).join('<div class="wind-sep"></div>');
  }

  forecast() {
    const s = this.state;
    if (!this.playing) return null;
    if (this.mode === 'preview') return previewActionForecast(s, { type: 'place', r: this.sel.r, c: this.sel.c });
    if (this.mode === 'movePreview') return previewActionForecast(s, { type: 'move', fromR: this.sel.r, fromC: this.sel.c, toR: this.target.r, toC: this.target.c });
    return null;
  }

  renderBoard() {
    const s = this.state;
    const fc = this.forecast();
    const grid = fc ? fc.tempGrid : s.grid;
    const map = fc ? fc.forecast.cellMap : {};
    const g = this.guideAction;
    let html = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const item = grid[r][c];
        const cls = ['cell', item ? 'has-item' : 'is-empty'];
        let inner = '';
        if (item) inner = garmentHtml(item.type, item.wetness, { ghost: !!item.isPreview && this.mode === 'preview' });
        const f = map[`${r},${c}`];
        if (f) {
          cls.push(`fx-${f.status}`);
          const txt = f.status === 'collect' ? `+${f.detail.pointsGained}` : f.status === 'hit' ? '-1💧' : '挡住';
          inner += `<span class="tag ${f.status}">${txt}</span>`;
        }
        if (g) {
          if (g.type === 'place' && g.at[0] === r && g.at[1] === c) { cls.push('is-target'); inner += HAND; } else cls.push('is-locked');
        }
        if ((this.mode === 'pickMove' || this.mode === 'movePreview') && this.sel) {
          if (this.sel.r === r && this.sel.c === c && this.mode === 'pickMove') cls.push('is-selected');
          if (!item && this.mode === 'pickMove') cls.push('is-drop');
        } else if (this.mode === 'pickMove' && item) cls.push('is-movable');
        if (this.mode === 'preview' && this.sel.r === r && this.sel.c === c) cls.push('is-selected');
        if (this.mode === 'movePreview' && this.target.r === r && this.target.c === c) cls.push('is-selected');
        html += `<div class="${cls.join(' ')}" data-r="${r}" data-c="${c}">${inner}</div>`;
      }
    }
    $('board').innerHTML = html;
    this.renderHint(fc);
  }

  renderWindSide() {
    const s = this.state;
    const side = $('wind-side');
    const w = s.winds[s.gustIndex];
    if (!w) { side.innerHTML = ''; side.className = 'wind-side'; return; }
    side.className = `wind-side wind-${w}`;
    const B = $('board').clientWidth || 300;
    const pad = 10, gap = 8, cell = (B - pad * 2 - gap * 2) / 3, off = 34;
    const fc = this.forecast();
    const empty = fc ? fc.forecast.emptyScanlines : null;
    let html = '';
    for (let i = 0; i < 3; i++) {
      const center = off + pad + i * (cell + gap) + cell / 2 - 14;
      let pos;
      if (w === 'W') pos = `left:3px;top:${center}px`;
      if (w === 'E') pos = `right:3px;top:${center}px`;
      if (w === 'N') pos = `top:3px;left:${center}px`;
      if (w === 'S') pos = `bottom:3px;left:${center}px`;
      const dim = empty && empty.includes(i) ? ' is-dim' : '';
      html += `<div class="lane-arrow${dim}" style="${pos}"><span>${WIND_META[w].arrow}</span></div>`;
    }
    side.innerHTML = html;
  }

  renderHint(fc) {
    const s = this.state; const el = $('hint-line');
    if (!this.playing) { el.innerHTML = s.status === 'won' ? '<span class="g">过关啦！</span>' : ''; return; }
    if (this.guided) { el.innerHTML = ''; return; }
    const wind = WIND_META[s.winds[s.gustIndex]];
    if (fc) {
      const hits = fc.forecast.hitCells;
      const gain = hits.reduce((a, h) => a + h.pointsGained, 0);
      const key = this.mode === 'preview' ? `${this.sel.r},${this.sel.c}` : `${this.target.r},${this.target.c}`;
      const me = fc.forecast.cellMap[key];
      let msg = '';
      if (me?.status === 'blocked') msg = '这里会被前面的衣服<b>挡住</b>，风吹不到';
      else if (me?.status === 'hit') msg = '能吹到，但厚衣还要<b>再吹一次</b>';
      else if (me?.status === 'collect') msg = `下阵${wind.name}能把它<span class="g">吹干</span>`;
      el.innerHTML = `${msg}${gain ? ` · 预计 <span class="g">+${gain}</span>` : ''}${this.mode === 'preview' ? '<br><small>再点一次或按「挂在这里」</small>' : ''}`;
      return;
    }
    if (this.mode === 'pickMove') { el.innerHTML = this.sel ? '选一个<b>空格</b>，把衣服挪过去（不占步数）' : '点一件<b>已挂的衣服</b>来挪动'; return; }
    if (isBoardFull(s.grid)) { el.innerHTML = '晒场满了，这件只能<b>跳过</b>（不得分）'; return; }
    el.innerHTML = `<span class="w">${wind.arrow} ${wind.name}</span> ${wind.desc}，只吹到每${wind.axis === 'row' ? '行' : '列'}<b>第一件</b>`;
  }

  renderTray() {
    const s = this.state;
    const card = $('current-card');
    const full = isBoardFull(s.grid);
    if (!this.playing) {
      card.className = 'current-card is-empty';
      card.innerHTML = '衣篮空了';
    } else {
      const t = this.currentType; const m = GARMENT_META[t];
      card.className = `current-card${full ? ' is-skip' : ''}`;
      card.innerHTML = `<div class="label">${full ? '放不下了' : '现在挂'}</div>${garmentHtml(t, m.initialWetness)}<div class="name">${m.name}</div><div class="pts">吹干 +${m.points} 分</div>`;
    }
    // 队列：后续衣物 + 风的位置
    let q = '';
    for (let i = s.placedCount; i < s.queue.length; i++) {
      if (i > s.placedCount) q += `<div class="q-item">${garmentHtml(s.queue[i], 0, { drops: false })}</div>`;
      if ((i + 1) % s.gustEvery === 0) {
        const w = s.winds[(i + 1) / s.gustEvery - 1];
        if (w) q += `<div class="q-wind" title="${WIND_META[w].name}">${WIND_META[w].arrow}</div>`;
      }
    }
    $('queue').innerHTML = q || '<span class="q-empty">这是最后一件</span>';

    const tk = $('btn-ticket');
    const moving = this.mode === 'pickMove' || this.mode === 'movePreview';
    tk.innerHTML = moving ? '✕ 取消挪位' : `↔︎ 挪位 ×${s.tickets}`;
    tk.classList.toggle('is-active', moving);
    tk.disabled = !this.playing || this.guided || (!moving && s.tickets <= 0);
    tk.hidden = (this.level.tickets ?? 2) === 0;

    const btn = $('btn-confirm');
    if (this.playing && this.mode === 'preview') { btn.hidden = false; btn.textContent = '挂在这里'; }
    else if (this.playing && this.mode === 'movePreview') { btn.hidden = false; btn.textContent = '挪到这里'; }
    else if (this.playing && full && this.mode === 'idle') { btn.hidden = false; btn.textContent = '跳过这件'; }
    else btn.hidden = true;
  }

  renderCoach() {
    const el = $('coach');
    const lines = COACH[this.level.id];
    const step = this.state.actionLog.length;
    if (this.guided && lines && lines[step] && this.playing) {
      el.hidden = false; el.innerHTML = lines[step];
    } else if (this.level.id === 'L1' && step === 0 && this.mode === 'idle' && this.demoToken === 0) {
      el.hidden = false; el.innerHTML = '先<b>点一下</b>格子预览风的效果，再点一次挂上';
    } else el.hidden = true;
  }

  /* ---------------- 提示 ---------------- */
  toast(text, sub = '') {
    const t = $('toast');
    t.innerHTML = `${text}${sub ? `<small>${sub}</small>` : ''}`;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 1500);
  }

  /* ---------------- 弹层 ---------------- */
  openLayer(html, { center = false, locked = false } = {}) {
    $('layer').hidden = false;
    $('layer').classList.toggle('center', center);
    $('sheet').innerHTML = html;
    this.modalLocked = locked;
  }
  closeLayer() { $('layer').hidden = true; this.modalLocked = false; }

  openMenu() {
    if (this.busy) return;
    const items = [
      ['restart', '↻', '重新开始'],
      ['howto', '?', '怎么玩'],
      ['demo', '▶', '看一遍示范'],
      ['sfx', '♪', '音效', sound.sfxEnabled ? '开' : '关'],
      ['bgm', '☁', '庭院风声', sound.bgmEnabled ? '开' : '关'],
      ['map', '▦', '返回关卡'],
    ];
    this.openLayer(`<h2>${levelName(this.level)}</h2><p class="sub">${shortTitle(this.level)} · 目标 ${this.level.target} 分</p>
      <div class="menu-list">${items.map(([k, ic, t, v]) => `<button class="menu-item" data-k="${k}"><span class="ic">${ic}</span>${t}${v ? `<span class="val">${v}</span>` : ''}</button>`).join('')}</div>`);
    $('sheet').querySelectorAll('.menu-item').forEach((b) => b.addEventListener('click', () => {
      safe(() => sound.playUiClick());
      const k = b.dataset.k;
      if (k === 'restart') { this.closeLayer(); this.startLevel(this.levelIndex); }
      if (k === 'howto') this.openHowto();
      if (k === 'demo') { this.closeLayer(); this.runDemo(); }
      if (k === 'sfx') { this.toggleSfx(); this.openMenu(); }
      if (k === 'bgm') { sound.toggleBgm(); this.openMenu(); }
      if (k === 'map') { this.stopDemo(); this.show('map'); }
    }));
  }

  openHowto(page = 0) {
    const mini = (cells, arrows = true) => `<div class="mini-board">${arrows ? '<div class="mini-arrows"><span>→</span><span>→</span><span>→</span></div>' : ''}${cells.map((c) => {
      if (!c) return '<div class="mc"></div>';
      const [t, cls, tag] = c;
      return `<div class="mc ${cls || ''}">${garmentHtml(t, null, { drops: false })}${tag ? `<span class="mt ${tag[0]}">${tag.slice(1)}</span>` : ''}</div>`;
    }).join('')}</div>`;
    const cards = [
      {
        art: `<div class="howto-row"><div><div class="big-g">${garmentHtml('L', 1, { drops: false })}</div></div><span style="font-size:24px;color:#a7b1ba">→</span>${mini([null, null, null, ['L', 'hl'], null, null, null, null, null], false)}</div>`,
        t: '把衣服挂上晒场', p: '点空格挂上衣服，<br>每挂 <b>3 件</b>就会吹来一阵风。',
      },
      {
        art: mini([['L', 'hl', 'g+2'], ['L', 'dim', 'x挡'], null, null, null, ['L', 'hl', 'g+2'], ['H', ''], ['L', 'dim', 'x挡'], null]),
        t: '风只吹第一件', p: '风沿箭头吹过每一行，<br>只吹到<b>最先碰到</b>的那件，后面的被挡住。',
      },
      {
        art: `<div class="howto-row"><div><div class="big-g">${garmentHtml('L', 1)}</div><div class="lbl">薄衣<small>吹 1 次 · +2</small></div></div><div><div class="big-g">${garmentHtml('H', 2)}</div><div class="lbl">厚衣<small>吹 2 次 · +5</small></div></div></div>`,
        t: '吹干就能收', p: '每吹一次少 <b>1 滴水</b>，水滴没了就收下得分。',
      },
      {
        art: `<div class="howto-row" style="flex-direction:column;gap:10px"><div style="font-size:15px;font-weight:700">↔︎ 挪位券 ×2</div><div style="font-size:30px">🏁</div></div>`,
        t: '挪位券 · 达标过关', p: '点已挂的衣服可挪到空格（不占步数）。<br>挂完所有衣服时<b>达到目标分</b>就过关！',
      },
    ];
    const c = cards[page];
    const last = page === cards.length - 1;
    this.openLayer(`<div class="howto-card"><div class="howto-art">${c.art}</div><h3>${c.t}</h3><p>${c.p}</p></div>
      <div class="dots">${cards.map((_, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('')}</div>
      <div class="result-actions">${page > 0 ? '<button class="btn btn-soft" id="hw-prev">上一步</button>' : ''}<button class="btn btn-primary" id="hw-next">${last ? '知道了' : '下一步'}</button></div>`, { center: true });
    $('hw-next').onclick = () => { safe(() => sound.playUiClick()); last ? this.closeLayer() : this.openHowto(page + 1); };
    if (page > 0) $('hw-prev').onclick = () => this.openHowto(page - 1);
  }

  finish() {
    const lv = this.level; const s = this.state;
    const stars = starsFor(lv, s.score);
    const won = s.status === 'won';
    safe(() => sound.playEndgame(won));
    if (won && this.demoToken === 0) {
      this.save.best[lv.id] = Math.max(this.save.best[lv.id] || 0, s.score);
      this.save.stars[lv.id] = Math.max(this.save.stars[lv.id] || 0, stars);
      this.save.unlocked = Math.max(this.save.unlocked, Math.min(this.levelIndex + 1, LEVELS.length - 1));
      this.persist();
    }
    const hasNext = this.levelIndex < LEVELS.length - 1;
    let meta = won ? `目标 ${lv.target} 分 · 达成！` : `还差 ${lv.target - s.score} 分 · 试试别的位置`;
    if (won && lv.id === 'T3') meta = '教学完成！正式关卡每挂 3 件起一次风';
    if (this.demoToken !== 0) meta = '这是一种过关方法，换你来试试';
    this.openLayer(`<h2>${won ? (stars === 3 ? '完美晾晒！' : '晒干啦！') : '差一点点'}</h2>
      <div class="result-stars">${[0, 1, 2].map((k) => STAR(k < stars)).join('')}</div>
      <div class="result-score">${s.score}</div><div class="result-meta">${meta}</div>
      <div class="result-actions"><button class="btn btn-soft" id="rs-retry">${won ? '再玩一次' : '重试'}</button>${won && hasNext ? '<button class="btn btn-primary" id="rs-next">下一关</button>' : (!won ? '<button class="btn btn-primary" id="rs-demo">看示范</button>' : '')}</div>`,
      { center: true, locked: true });
    const wasDemo = this.demoToken !== 0;
    this.demoToken = 0;
    $('rs-retry').onclick = () => this.startLevel(this.levelIndex);
    if ($('rs-next')) $('rs-next').onclick = () => this.startLevel(wasDemo ? this.levelIndex : this.levelIndex + 1);
    if ($('rs-demo')) $('rs-demo').onclick = () => { this.closeLayer(); this.runDemo(); };
  }

  /* ---------------- 示范 ---------------- */
  async runDemo() {
    this.startLevel(this.levelIndex);
    const token = ++this.demoToken + Date.now();
    this.demoToken = token;
    this.demoActive = true;
    $('demo-banner').hidden = false;
    this.render();
    await sleep(700);
    for (const a of this.level.witnessActions) {
      if (this.demoToken !== token) return;
      if (a.type === 'move') {
        this.mode = 'movePreview'; this.sel = { r: a.from[0], c: a.from[1] }; this.target = { r: a.to[0], c: a.to[1] };
        this.render(); await sleep(800);
        if (this.demoToken !== token) return;
        this.commitMove();
      } else if (a.type === 'place') {
        this.mode = 'preview'; this.sel = { r: a.at[0], c: a.at[1] };
        this.render(); await sleep(750);
        if (this.demoToken !== token) return;
        await this.commit(a);
      } else {
        await this.commit(a);
      }
      await sleep(450);
    }
  }

  stopDemo(restart = false) {
    if (!this.demoActive && this.demoToken === 0) return;
    this.demoActive = false;
    this.demoToken = 0;
    $('demo-banner').hidden = true;
    if (restart && this.level) this.startLevel(this.levelIndex);
  }
}

window.addEventListener('DOMContentLoaded', () => { window.game = new Game(); });
