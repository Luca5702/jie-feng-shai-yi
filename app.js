// 《借风晒衣》 · 晴日绘本手帐版主控制器
// 集成：确定性规则机 (engine.js) + 精确状态空间求解器 (solver.js) + 程序化出题器 (generator.js) + 绘本美术组件 (art.js)

import {
  WIND_META,
  GARMENT_META,
  createInitialState,
  isGarmentCell,
  isObstacleCell,
  computeWindForecast,
  previewActionForecast,
  applyMoveAction,
  applyPlaceOrSkipAction,
  diagnoseRemainingGarments,
} from './engine.js';
import { adviseNextAction } from './solver.js';
import { GENERATOR_TIERS, generatePuzzle } from './generator.js';
import { CHAPTER_META, LEVELS } from './levels.js';
import {
  svgKumquatTree,
  svgSunStamp,
  svgWindArrow,
  ICONS,
  renderGarmentMarkup,
} from './art.js';
import { sound } from './audio.js';

const SAVE_KEY = 'jggo_storybook_v4';
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const playSfx = (fn) => {
  try {
    fn();
  } catch (_) {
    /* ignore audio errors */
  }
};

const GUIDED_COACH = {
  L1: [
    '<b>西风 →</b> 从左往右吹，点亮格挂上第 1 件薄衫',
    '再把第 2 件挂在<b>另一排</b>，两件都能迎风吹干',
  ],
  L2: [
    '<b>北风 ↓</b> 从上往下吹，每列<b>最上面</b>那件会受风',
    '挂在第 2 列，互不遮挡',
    '最后一件挂满第 3 列，三件一起吹干！',
  ],
  L3: [
    '<b>厚衣</b>有 2 滴水，要吹 <b>2 阵风</b>才会干',
    '挂好这件薄衫就会吹第 1 阵西风',
  ],
};

class SunlitLaundryGame {
  constructor() {
    this.save = this.loadSave();
    this.level = null;
    this.levelIndex = 0;
    this.isWorkshop = false;
    this.workshopTier = 'courtyard';
    this.state = null;
    this.history = [];
    this.liftFrom = null; // { r, c } when moving an existing garment
    this.hoverCell = null; // { r, c } desktop hover preview
    this.hintSpot = null; // { r, c } or { from, to }
    this.busy = false;
    this.demoToken = 0;
    this.demoRunning = false;
    this.dialogLocked = false;

    sound.sfxEnabled = this.save.sfx !== false;
    this.initStaticIcons();
    this.renderCoverScene();
    this.bindEvents();
    this.showScreen('home');
  }

  loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      return { unlocked: 0, cleared: {}, sfx: true, ...raw };
    } catch (_) {
      return { unlocked: 0, cleared: {}, sfx: true };
    }
  }

  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
    } catch (_) {
      /* ignore storage errors */
    }
  }

  initStaticIcons() {
    $('btn-map-back').innerHTML = ICONS.back;
    $('btn-play-back').innerHTML = ICONS.back;
    $('btn-menu').innerHTML = ICONS.menu;
    $('btn-undo').innerHTML = `${ICONS.undo}<span>撤回</span>`;
    $('btn-restart').innerHTML = `${ICONS.restart}<span>重来</span>`;
    $('btn-hint').innerHTML = `${ICONS.hint}<span>提示</span>`;
    this.syncSoundButton();
  }

  syncSoundButton() {
    $('btn-home-sound').innerHTML = sound.sfxEnabled ? ICONS.soundOn : ICONS.soundOff;
  }

  renderCoverScene() {
    $('cover-scene').innerHTML = `
      <svg class="cover-rope" viewBox="0 0 340 140" preserveAspectRatio="none">
        <circle cx="52" cy="28" r="18" fill="#FFF8E3" opacity="0.85"/>
        <path d="M-6 26 Q170 46 346 24" fill="none" stroke="#3A2E28" stroke-width="2.3"/>
      </svg>
      <div class="cover-hang h1">${renderGarmentMarkup('L', 1, { drops: false })}</div>
      <div class="cover-hang h2">${renderGarmentMarkup('H', 2, { drops: false })}</div>
      <div class="cover-hang h3">${renderGarmentMarkup('L', 1, { drops: false })}</div>
      <div class="cover-tree">${svgKumquatTree()}</div>
    `;
  }

  bindEvents() {
    const on = (id, fn) =>
      $(id).addEventListener('click', () => {
        playSfx(() => sound.playUiClick());
        fn();
      });

    on('btn-home-sound', () => {
      this.save.sfx = sound.toggleSfx();
      this.persist();
      this.syncSoundButton();
    });
    on('btn-start', () => {
      const nextIdx = Math.min(this.save.unlocked, LEVELS.length - 1);
      this.startCampaignLevel(nextIdx);
    });
    on('btn-levels', () => this.showScreen('map'));
    on('btn-workshop-home', () => this.openWorkshopModal());
    on('btn-howto-home', () => this.openRulesModal(0));

    on('btn-map-back', () => this.showScreen('home'));
    on('btn-play-back', () => {
      this.stopDemo();
      if (this.isWorkshop) this.showScreen('home');
      else this.showScreen('map');
    });
    on('btn-menu', () => this.openMenuModal());
    on('btn-undo', () => this.undoStep());
    on('btn-restart', () => this.restartCurrentLevel());
    on('btn-clip', () => this.toggleClipMode());
    on('btn-hint', () => this.requestSmartHint());
    on('demo-pill', () => this.stopDemo(true));

    $('modal-scrim').addEventListener('click', () => {
      if (!this.dialogLocked) this.closeModal();
    });

    const board = $('board');
    board.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (cell) this.handleCellTap(Number(cell.dataset.r), Number(cell.dataset.c));
    });

    board.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || this.busy || this.demoRunning) return;
      const cell = e.target.closest('.cell');
      const next = cell ? { r: Number(cell.dataset.r), c: Number(cell.dataset.c) } : null;
      const prevKey = this.hoverCell ? `${this.hoverCell.r},${this.hoverCell.c}` : '';
      const nextKey = next ? `${next.r},${next.c}` : '';
      if (prevKey !== nextKey) {
        this.hoverCell = next;
        if (this.state && this.isPlaying) this.renderBoardAndLanes();
      }
    });

    board.addEventListener('pointerleave', () => {
      if (this.hoverCell) {
        this.hoverCell = null;
        if (this.state && this.isPlaying) this.renderBoardAndLanes();
      }
    });

    window.addEventListener('resize', () => {
      if (this.state && !$('screen-play').hidden) this.renderWindLanes();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('modal-layer').hidden && !this.dialogLocked) {
        this.closeModal();
      } else if ((e.key === 'z' || e.key === 'Z') && !$('screen-play').hidden && $('modal-layer').hidden) {
        this.undoStep();
      }
    });
  }

  showScreen(name) {
    for (const key of ['home', 'map', 'play']) {
      $(`screen-${key}`).hidden = key !== name;
    }
    this.closeModal();
    if (name === 'map') this.renderJournalMap();
    if (name === 'home') this.syncSoundButton();
  }

  /* ---------------- 选关手帐 ---------------- */
  renderJournalMap() {
    const clearedCount = LEVELS.filter((lv) => this.save.cleared[lv.id]).length;
    $('stamp-counter').innerHTML = `${svgSunStamp(true)}<span>${clearedCount} / ${LEVELS.length}</span>`;

    $('map-list').innerHTML = CHAPTER_META.map((ch) => {
      const chLevels = LEVELS.map((lv, idx) => ({ lv, idx })).filter(({ lv }) => lv.chapter === ch.chapter);
      const chDone = chLevels.filter(({ lv }) => this.save.cleared[lv.id]).length;

      const nodesHtml = chLevels
        .map(({ lv, idx }) => {
          const locked = idx > this.save.unlocked;
          const cleared = Boolean(this.save.cleared[lv.id]);
          const isCurrent = idx === this.save.unlocked && !cleared;
          const cls = [
            'lv-node',
            locked ? 'is-locked' : '',
            cleared ? 'is-cleared' : '',
            isCurrent ? 'is-current' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return `<button class="${cls}" data-idx="${idx}" ${locked ? 'disabled' : ''} aria-label="第 ${lv.num} 关 ${lv.title}">
            ${locked ? ICONS.lock : `<b>${String(lv.num).padStart(2, '0')}</b>${svgSunStamp(cleared)}`}
          </button>`;
        })
        .join('');

      return `<section class="chapter-card">
        <div class="chapter-head">
          <h3>${ch.name}</h3>
          <span>${chDone} / ${chLevels.length}</span>
        </div>
        <p class="chapter-desc">${ch.desc}</p>
        <div class="level-grid">${nodesHtml}</div>
      </section>`;
    }).join('');

    $('map-list')
      .querySelectorAll('.lv-node:not(.is-locked)')
      .forEach((btn) =>
        btn.addEventListener('click', () => {
          playSfx(() => sound.playUiClick());
          this.startCampaignLevel(Number(btn.dataset.idx));
        })
      );
  }

  /* ---------------- 启动关卡 ---------------- */
  startCampaignLevel(index) {
    this.isWorkshop = false;
    this.levelIndex = index;
    this.loadLevelObject(LEVELS[index]);
  }

  startWorkshopLevel(levelObj) {
    this.isWorkshop = true;
    this.loadLevelObject(levelObj);
  }

  loadLevelObject(levelObj) {
    this.stopDemo();
    this.level = levelObj;
    this.state = createInitialState(levelObj);
    this.history = [];
    this.liftFrom = null;
    this.hoverCell = null;
    this.hintSpot = null;
    this.busy = false;

    this.showScreen('play');
    if (this.isWorkshop) {
      $('play-kicker').textContent = `出题工坊 · 难度 ${levelObj.metrics?.difficultyScore ?? '--'}`;
      $('play-title').textContent = levelObj.title;
    } else {
      const chNames = ['一', '二', '三', '四'];
      $('play-kicker').textContent = `卷${chNames[(levelObj.chapter || 1) - 1]} · 第 ${String(levelObj.num).padStart(2, '0')} 关`;
      $('play-title').textContent = levelObj.title;
    }
    this.renderAll();
  }

  restartCurrentLevel() {
    if (this.busy || !this.level) return;
    this.loadLevelObject(this.level);
  }

  get isPlaying() {
    return Boolean(this.state && this.state.status === 'playing' && this.state.placedCount < this.state.queue.length);
  }

  get guidedStepAction() {
    if (this.isWorkshop || this.demoRunning || !this.level) return null;
    if (this.level.id !== 'L1' && this.level.id !== 'L2') return null;
    return this.level.witnessActions?.[this.state.actionLog.length] || null;
  }

  /* ---------------- 核心交互 ---------------- */
  handleCellTap(r, c) {
    if (this.busy || this.demoRunning || !this.isPlaying) return;
    this.hintSpot = null;
    this.hoverCell = null;

    const guided = this.guidedStepAction;
    if (guided) {
      if (guided.type === 'place' && guided.at[0] === r && guided.at[1] === c) {
        this.executePlacement(r, c);
      }
      return;
    }

    const cell = this.state.grid[r][c];

    // 若正处于移衣木夹状态
    if (this.liftFrom) {
      if (this.liftFrom.r === r && this.liftFrom.c === c) {
        this.liftFrom = null;
        playSfx(() => sound.playPreviewTap());
        this.renderAll();
        return;
      }
      if (isGarmentCell(cell)) {
        this.liftFrom = { r, c };
        playSfx(() => sound.playPreviewTap());
        this.renderAll();
        return;
      }
      if (!cell) {
        this.executeMoveClip(this.liftFrom.r, this.liftFrom.c, r, c);
        return;
      }
      this.showToast('橘树盆栽位置不能挂衣');
      return;
    }

    // 点击已有衣物：若有木夹则夹起准备移位
    if (isGarmentCell(cell)) {
      if (this.state.tickets > 0) {
        this.liftFrom = { r, c };
        playSfx(() => sound.playPreviewTap());
        this.renderAll();
      } else {
        this.showToast(
          this.state.maxTickets > 0 ? '移衣木夹已用完' : '本关无需移衣，点空位挂衣即可'
        );
      }
      return;
    }

    if (isObstacleCell(cell)) {
      this.showToast('橘树盆栽会挡住顺风方向的后排格子');
      return;
    }

    // 空位：单点直接挂衣！支持随时一键「撤回」
    this.executePlacement(r, c);
  }

  toggleClipMode() {
    if (this.busy || this.demoRunning || !this.isPlaying) return;
    if (this.liftFrom) {
      this.liftFrom = null;
      this.renderAll();
      return;
    }
    if (this.state.tickets <= 0) {
      this.showToast('移衣木夹已用完');
      return;
    }
    // 自动选中架上第一件可移动衣物或提示点选
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (isGarmentCell(this.state.grid[r][c])) {
          this.liftFrom = { r, c };
          this.renderAll();
          this.showToast('已夹起衣物，点任意空位挪过去', '点其它衣物可切换');
          return;
        }
      }
    }
    this.showToast('架上还没有衣物可挪动');
  }

  executeMoveClip(fromR, fromC, toR, toC) {
    const snapshot = structuredClone(this.state);
    try {
      const res = applyMoveAction(this.state, fromR, fromC, toR, toC);
      this.history.push(snapshot);
      this.state = res.state;
      this.liftFrom = null;
      playSfx(() => sound.playMoveTicket());
      this.renderAll();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  async executePlacement(r, c) {
    if (this.busy) return;
    this.busy = true;
    const snapshot = structuredClone(this.state);
    const placingType = this.state.queue[this.state.placedCount];

    let res;
    try {
      res = applyPlaceOrSkipAction(this.state, { type: 'place', at: [r, c] });
    } catch (err) {
      this.busy = false;
      this.showToast(err.message);
      return;
    }

    this.history.push(snapshot);
    this.liftFrom = null;
    playSfx(() => sound.playHangConfirm(placingType === 'H'));

    if (res.gustTriggered) {
      // 先呈现刚挂上瞬间，再吹风结算
      const preGustGrid = previewActionForecast(snapshot, { type: 'place', r, c }).tempGrid;
      this.state = {
        ...res.state,
        grid: preGustGrid,
        driedCount: snapshot.driedCount,
        gustIndex: snapshot.gustIndex,
      };
      this.renderAll();
      await sleep(280);
      await this.animateWindGust(res.gustTriggered);
      this.state = res.state;
      this.renderAll();
    } else {
      this.state = res.state;
      this.renderAll();
    }

    this.busy = false;

    if (this.state.status !== 'playing') {
      await sleep(520);
      if (this.demoRunning) {
        this.demoRunning = false;
        $('demo-pill').hidden = true;
      }
      this.openResultModal();
    }
  }

  async animateWindGust(gust) {
    const fx = $('gust-fx');
    fx.className = `gust-fx gust-${gust.windDir}`;
    const isRow = gust.windDir === 'W' || gust.windDir === 'E';
    let ribbons = '';
    for (let lane = 0; lane < 3; lane++) {
      const pos = `${lane * 33.33 + 16.6}%`;
      const delay = (lane * 0.06).toFixed(2);
      ribbons += `<div class="breeze-ribbon" style="${isRow ? 'top' : 'left'}:${pos};animation-delay:${delay}s"></div>`;
    }
    fx.innerHTML = ribbons;
    playSfx(() => sound.playWindGust(gust.collectedRecords.length, gust.hitRecords.length));

    await sleep(220);
    for (const hit of gust.hitRecords) {
      const cellEl = $('board').querySelector(`.cell[data-r="${hit.r}"][data-c="${hit.c}"]`);
      if (!cellEl) continue;
      if (hit.collected) {
        cellEl.classList.add('anim-collect');
        const badge = document.createElement('span');
        badge.className = 'collect-tag';
        badge.textContent = '晒干';
        cellEl.appendChild(badge);
      } else {
        cellEl.classList.add('anim-hit');
      }
    }
    await sleep(560);
    fx.innerHTML = '';
  }

  undoStep() {
    if (this.busy || this.demoRunning || this.history.length === 0) return;
    this.state = this.history.pop();
    this.liftFrom = null;
    this.hintSpot = null;
    this.renderAll();
  }

  /* ---------------- 实时精确求解提示 ---------------- */
  requestSmartHint() {
    if (this.busy || this.demoRunning || !this.isPlaying) return;
    const advice = adviseNextAction(this.state, this.history);

    if (advice.status === 'solvable' && advice.nextAction) {
      const act = advice.nextAction;
      if (act.type === 'place') {
        this.liftFrom = null;
        this.hintSpot = { type: 'place', r: act.at[0], c: act.at[1] };
        this.renderBoardAndLanes();
        this.showToast(`建议挂在第 ${act.at[0] + 1} 排第 ${act.at[1] + 1} 列`, '已为你高亮标记该格');
      } else if (act.type === 'move') {
        this.liftFrom = { r: act.from[0], c: act.from[1] };
        this.hintSpot = { type: 'move', r: act.to[0], c: act.to[1] };
        this.renderAll();
        this.showToast(
          `用木夹把 (${act.from[0] + 1},${act.from[1] + 1}) 挪到亮框处`,
          '已为你夹起该件衣服'
        );
      }
      return;
    }

    // 已经进入死胡同：精准定位可挽回的那一步！
    const steps = advice.rewindSteps || this.history.length;
    this.openModal(
      `<h2>前面有衣服被挡住啦</h2>
      <p class="dialog-sub">按目前的架上位置，已来不及在风停前把所有衣服晒干。<br>退回 <b>${steps}</b> 步就能重新解开！</p>
      <div class="dialog-actions">
        <button class="tactile-btn btn-ivory" id="dl-cancel">我自己看看</button>
        <button class="tactile-btn btn-persimmon" id="dl-rewind">退回 ${steps} 步</button>
      </div>`
    );
    $('dl-cancel').onclick = () => this.closeModal();
    $('dl-rewind').onclick = () => {
      const targetIdx = Math.max(0, advice.rewindToIndex ?? 0);
      if (this.history[targetIdx]) {
        this.state = this.history[targetIdx];
        this.history = this.history.slice(0, targetIdx);
      }
      this.liftFrom = null;
      this.hintSpot = null;
      this.closeModal();
      this.renderAll();
      this.requestSmartHint();
    };
  }

  /* ---------------- 渲染 ---------------- */
  renderAll() {
    this.renderHeaderCounter();
    this.renderWindSchedule();
    this.renderBoardAndLanes();
    this.renderDock();
    this.renderCoachAndWhisper();
  }

  renderHeaderCounter() {
    const { driedCount, totalGarments } = this.state;
    const pill = $('dry-pill');
    pill.innerHTML = `${svgSunStamp(driedCount === totalGarments)}<span>${driedCount} / ${totalGarments}</span>`;
    pill.classList.toggle('is-done', driedCount === totalGarments);
  }

  renderWindSchedule() {
    const s = this.state;
    const placedInCycle = s.placedCount % s.gustEvery;
    $('wind-schedule').innerHTML = s.winds
      .map((dir, idx) => {
        const meta = WIND_META[dir];
        if (idx === s.gustIndex && this.isPlaying) {
          const pips = Array.from(
            { length: s.gustEvery },
            (_, k) => `<i class="w-pip${k < placedInCycle ? ' filled' : ''}"></i>`
          ).join('');
          return `<div class="w-chip is-active">${svgWindArrow(dir)}<span>${meta.name}</span><span class="w-pips" title="挂满即吹风">${pips}</span></div>`;
        }
        return `<div class="w-chip${idx < s.gustIndex ? ' is-done' : ''}" title="${meta.name}">${svgWindArrow(dir)}<span>${meta.short}</span></div>`;
      })
      .join('');
  }

  computeDisplayForecast() {
    const s = this.state;
    const windDir = s.winds[s.gustIndex] || null;
    if (this.hoverCell && this.isPlaying) {
      const { r, c } = this.hoverCell;
      if (!s.grid[r][c]) {
        if (this.liftFrom) {
          return previewActionForecast(s, {
            type: 'move',
            fromR: this.liftFrom.r,
            fromC: this.liftFrom.c,
            toR: r,
            toC: c,
          });
        }
        return previewActionForecast(s, { type: 'place', r, c });
      }
    }
    return {
      tempGrid: s.grid,
      currentWind: windDir,
      forecast: computeWindForecast(s.grid, windDir),
    };
  }

  renderBoardAndLanes() {
    const { tempGrid, forecast } = this.computeDisplayForecast();
    const shadowSet = new Set(forecast.shadowEmptyCells.map((x) => `${x.r},${x.c}`));
    const exposedSet = new Set(forecast.exposedEmptyCells.map((x) => `${x.r},${x.c}`));
    const guided = this.guidedStepAction;

    let html = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const key = `${r},${c}`;
        const cell = tempGrid[r][c];
        const cls = ['cell'];
        let inner = '';

        if (!cell) {
          cls.push('is-empty');
          if (shadowSet.has(key)) cls.push('is-shadow');
          else if (exposedSet.has(key)) cls.push('is-exposed');
          if (this.liftFrom) cls.push('is-move-dest');
        } else if (isObstacleCell(cell)) {
          cls.push('has-tree');
          inner = `<div class="tree-art">${svgKumquatTree()}</div>`;
        } else if (isGarmentCell(cell)) {
          cls.push('has-garment');
          inner = renderGarmentMarkup(cell.type, cell.wetness, { ghost: Boolean(cell.isPreview) });
          const fInfo = forecast.cellMap[key];
          if (fInfo && this.isPlaying) {
            const label =
              fInfo.status === 'collect' ? '收' : fInfo.status === 'hit' ? '-1' : '挡';
            inner += `<span class="fx-badge ${fInfo.status}">${label}</span>`;
          }
        }

        if (this.liftFrom && this.liftFrom.r === r && this.liftFrom.c === c) {
          cls.push('is-lifted');
        }
        if (this.hintSpot && this.hintSpot.r === r && this.hintSpot.c === c) {
          cls.push('is-hint-spot');
        }
        if (guided) {
          if (guided.type === 'place' && guided.at[0] === r && guided.at[1] === c) {
            cls.push('is-guide-target');
            inner += ICONS.hand;
          } else {
            cls.push('is-guide-locked');
          }
        }

        html += `<div class="${cls.join(' ')}" data-r="${r}" data-c="${c}">${inner}</div>`;
      }
    }

    $('board').innerHTML = html;
    this.renderWindLanes(forecast);
  }

  renderWindLanes(forecastArg) {
    const lanesEl = $('wind-lanes');
    const s = this.state;
    const windDir = s.winds[s.gustIndex];
    if (!windDir || !this.isPlaying) {
      lanesEl.innerHTML = '';
      lanesEl.className = 'wind-lanes';
      return;
    }

    const forecast = forecastArg || computeWindForecast(s.grid, windDir);
    lanesEl.className = `wind-lanes wind-${windDir}`;

    const shellW = $('rack-shell').clientWidth || 300;
    const framePad = 15; // 10px wood + 5px grid pad
    const gap = 7;
    const cellSize = (shellW - framePad * 2 - gap * 2) / 3;
    const offset = 28;

    let html = '';
    for (let i = 0; i < 3; i++) {
      const center = offset + framePad + i * (cellSize + gap) + cellSize / 2 - 12;
      let style = '';
      if (windDir === 'W') style = `left:0px;top:${center}px`;
      if (windDir === 'E') style = `right:0px;top:${center}px`;
      if (windDir === 'N') style = `top:0px;left:${center}px`;
      if (windDir === 'S') style = `bottom:0px;left:${center}px`;

      const idle = forecast.emptyScanlines.includes(i) ? ' is-idle' : '';
      html += `<div class="lane-token${idle}" style="${style}">${svgWindArrow(windDir)}</div>`;
    }
    lanesEl.innerHTML = html;
  }

  renderDock() {
    const s = this.state;
    const nextSlot = $('next-slot');

    if (!this.isPlaying) {
      nextSlot.innerHTML = `<div class="next-meta"><span class="kicker">衣篮状态</span><span class="name">已挂完</span></div>`;
    } else {
      const curType = s.queue[s.placedCount];
      const meta = GARMENT_META[curType];
      nextSlot.innerHTML = `
        ${renderGarmentMarkup(curType, meta.initialWetness, { drops: false, pins: false })}
        <div class="next-meta">
          <span class="kicker">待挂衣物</span>
          <span class="name">${meta.name}</span>
          <span class="sub">${meta.initialWetness} 滴水</span>
        </div>
      `;
    }

    // 队列轨迹（含阵风分隔标）
    let track = '';
    for (let i = s.placedCount; i < s.queue.length; i++) {
      if (i > s.placedCount) {
        track += `<div class="q-garment" title="${GARMENT_META[s.queue[i]].name}">${renderGarmentMarkup(
          s.queue[i],
          1,
          { drops: false, pins: false }
        )}</div>`;
      }
      if ((i + 1) % s.gustEvery === 0) {
        const wDir = s.winds[(i + 1) / s.gustEvery - 1];
        if (wDir) {
          track += `<div class="q-gust" title="${WIND_META[wDir].name}">${svgWindArrow(wDir)}</div>`;
        }
      }
    }
    $('queue-track').innerHTML =
      track ||
      `<span class="q-done-msg">${this.isPlaying ? '挂好这件即吹最后一阵风' : '全部阵风已结算完毕'}</span>`;

    $('btn-undo').disabled = this.history.length === 0 || !this.isPlaying;
    $('btn-restart').disabled = this.history.length === 0 && s.status === 'playing';
    $('btn-hint').disabled = !this.isPlaying || Boolean(this.guidedStepAction);

    const clipBtn = $('btn-clip');
    if (s.maxTickets > 0) {
      clipBtn.hidden = false;
      clipBtn.classList.toggle('is-active', Boolean(this.liftFrom));
      clipBtn.disabled = !this.isPlaying || (!this.liftFrom && s.tickets <= 0);
      clipBtn.innerHTML = this.liftFrom
        ? `<span>取消移衣</span>`
        : `${ICONS.clip}<span>木夹 ×${s.tickets}</span>`;
    } else {
      clipBtn.hidden = true;
    }
  }

  renderCoachAndWhisper() {
    const coachEl = $('coach-note');
    const whisperEl = $('whisper-line');
    const step = this.state.actionLog.length;

    const lines = !this.isWorkshop && GUIDED_COACH[this.level.id];
    if (lines && lines[step] && this.isPlaying && !this.demoRunning) {
      coachEl.hidden = false;
      coachEl.innerHTML = lines[step];
    } else if (
      !this.isWorkshop &&
      ['L6', 'L11', 'L16'].includes(this.level.id) &&
      step === 0 &&
      this.isPlaying
    ) {
      coachEl.hidden = false;
      coachEl.innerHTML = this.level.subtitle;
    } else {
      coachEl.hidden = true;
    }

    if (!this.isPlaying) {
      whisperEl.innerHTML =
        this.state.status === 'won' ? '满架衣裳尽数晒干！' : '还有衣物没干透，试试撤回调整位置';
      return;
    }
    if (this.liftFrom) {
      whisperEl.innerHTML = '点选任意<b>空位</b>将衣服夹过去（不消耗挂衣步数）';
      return;
    }
    const remainToGust = this.state.gustEvery - (this.state.placedCount % this.state.gustEvery);
    const wind = WIND_META[this.state.winds[this.state.gustIndex]];
    whisperEl.innerHTML = `再挂 <b>${remainToGust}</b> 件吹<b>${wind.name}</b> · 斜纹格为当前背风处`;
  }

  /* ---------------- 提示与弹层 ---------------- */
  showToast(title, sub = '') {
    const el = $('toast-note');
    el.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`;
    el.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('is-visible'), 1650);
  }

  openModal(html, { locked = false } = {}) {
    this.dialogLocked = locked;
    $('paper-dialog').innerHTML = html;
    $('modal-layer').hidden = false;
  }

  closeModal() {
    $('modal-layer').hidden = true;
    this.dialogLocked = false;
  }

  openMenuModal() {
    if (this.busy) return;
    this.openModal(`
      <h2>${this.level.title}</h2>
      <p class="dialog-sub">${this.level.subtitle || '把衣篮与架上的所有衣物全部晒干'}</p>
      <div class="menu-stack">
        <button class="menu-row" data-act="demo">${ICONS.hint}<span>观看过关演示</span></button>
        <button class="menu-row" data-act="rules">${ICONS.workshop}<span>图解晒衣规则</span></button>
        <button class="menu-row" data-act="workshop">${ICONS.clip}<span>出题工坊（随机新题）</span></button>
        <button class="menu-row" data-act="sfx">${sound.sfxEnabled ? ICONS.soundOn : ICONS.soundOff}<span>庭院音效</span><span class="menu-val">${sound.sfxEnabled ? '开启' : '关闭'}</span></button>
        <button class="menu-row" data-act="bgm">${ICONS.soundOn}<span>午后微风环境音</span><span class="menu-val">${sound.bgmEnabled ? '开启' : '关闭'}</span></button>
      </div>
      <div class="dialog-actions">
        <button class="tactile-btn btn-ivory" id="mn-close">继续晾衣</button>
      </div>
    `);

    $('mn-close').onclick = () => this.closeModal();
    $('paper-dialog')
      .querySelectorAll('.menu-row')
      .forEach((row) =>
        row.addEventListener('click', () => {
          playSfx(() => sound.playUiClick());
          const act = row.dataset.act;
          if (act === 'demo') {
            this.closeModal();
            this.runWitnessDemo();
          } else if (act === 'rules') {
            this.openRulesModal(0);
          } else if (act === 'workshop') {
            this.openWorkshopModal();
          } else if (act === 'sfx') {
            this.save.sfx = sound.toggleSfx();
            this.persist();
            this.syncSoundButton();
            this.openMenuModal();
          } else if (act === 'bgm') {
            sound.toggleBgm();
            this.openMenuModal();
          }
        })
      );
  }

  openRulesModal(page = 0) {
    const pages = [
      {
        title: '一 · 顺风只吹第一件',
        desc: '每挂满几件衣服就会起风。风顺着箭头扫过每排或每列，<b>只吹到最前排那一件</b>，后面的衣服和盆栽身后都会被挡住。',
        illus: `<div class="mini-g">${renderGarmentMarkup('L', 1)}</div>
                <span style="font-weight:900;color:#4994a6">${svgWindArrow('W')}</span>
                <div class="mini-g" style="opacity:0.42">${renderGarmentMarkup('L', 1)}</div>`,
      },
      {
        title: '二 · 薄衫与厚衣',
        desc: '<b>薄衫</b>只有 1 滴水，吹 1 次风就干透收走；<br><b>厚衣</b>有 2 滴水，需要跨 2 阵风吹干。',
        illus: `<div class="mini-g">${renderGarmentMarkup('L', 1)}</div>
                <div class="mini-g">${renderGarmentMarkup('H', 2)}</div>`,
      },
      {
        title: '三 · 盆栽与移衣木夹',
        desc: '<b>橘树盆栽</b>会挡住身后的风；遇到绝境时，用<b>移衣木夹</b>把架上的衣服换去迎风位。<b>全部衣服晒干</b>即可盖章过关！',
        illus: `<div class="mini-g">${svgKumquatTree()}</div>
                <div class="mini-g" style="width:52px;height:52px">${svgSunStamp(true)}</div>`,
      },
    ];
    const cur = pages[page];
    const isLast = page === pages.length - 1;

    this.openModal(`
      <h2>${cur.title}</h2>
      <div class="rule-box">
        <div class="rule-illus">${cur.illus}</div>
        <p class="dialog-sub" style="margin:0">${cur.desc}</p>
      </div>
      <div class="rule-dots">${pages.map((_, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('')}</div>
      <div class="dialog-actions">
        ${page > 0 ? '<button class="tactile-btn btn-ivory" id="rl-prev">上一页</button>' : ''}
        <button class="tactile-btn btn-persimmon" id="rl-next">${isLast ? '明白啦' : '下一页'}</button>
      </div>
    `);
    if ($('rl-prev')) $('rl-prev').onclick = () => this.openRulesModal(page - 1);
    $('rl-next').onclick = () => (isLast ? this.closeModal() : this.openRulesModal(page + 1));
  }

  openWorkshopModal() {
    const renderContent = () => {
      const cards = Object.values(GENERATOR_TIERS)
        .map(
          (t) => `<button class="tier-card${this.workshopTier === t.key ? ' is-picked' : ''}" data-tier="${t.key}">
            <b>${t.name}</b>
            <span>${t.subtitle}</span>
          </button>`
        )
        .join('');

      this.openModal(`
        <h2>晴日出题工坊</h2>
        <p class="dialog-sub">内置实时出题器与精确求解器，当场生成保证<b>100% 全部晒干可达</b>的全新残局。</p>
        <div class="tier-list">${cards}</div>
        <div class="dialog-actions">
          <button class="tactile-btn btn-ivory" id="ws-cancel">取消</button>
          <button class="tactile-btn btn-persimmon" id="ws-go">生成新题</button>
        </div>
      `);

      $('paper-dialog')
        .querySelectorAll('.tier-card')
        .forEach((btn) =>
          btn.addEventListener('click', () => {
            this.workshopTier = btn.dataset.tier;
            renderContent();
          })
        );
      $('ws-cancel').onclick = () => this.closeModal();
      $('ws-go').onclick = () => {
        const puzzle = generatePuzzle(this.workshopTier, Date.now());
        this.closeModal();
        this.startWorkshopLevel(puzzle);
      };
    };
    renderContent();
  }

  openResultModal() {
    const won = this.state.status === 'won';
    const wasDemo = this.demoToken !== 0;
    this.demoToken = 0;
    playSfx(() => sound.playEndgame(won));

    if (won && !wasDemo && !this.isWorkshop) {
      this.save.cleared[this.level.id] = true;
      this.save.unlocked = Math.max(
        this.save.unlocked,
        Math.min(this.levelIndex + 1, LEVELS.length - 1)
      );
      this.persist();
    }

    if (won) {
      const hasNext = !this.isWorkshop && this.levelIndex < LEVELS.length - 1;
      const subText = wasDemo
        ? '这是一种满分晒干走法，现在换你亲手试试吧！'
        : `共收下全部 <b>${this.state.totalGarments}</b> 件清爽干衣！`;

      this.openModal(
        `<div class="stamp-hero">${svgSunStamp(true)}</div>
        <h2>${wasDemo ? '演示完毕' : '晴日晒干！'}</h2>
        <p class="dialog-sub">${subText}</p>
        <div class="dialog-actions">
          <button class="tactile-btn btn-ivory" id="rs-again">${wasDemo ? '自己来试' : '再晒一次'}</button>
          ${
            this.isWorkshop
              ? '<button class="tactile-btn btn-persimmon" id="rs-new">再来一题</button>'
              : hasNext && !wasDemo
              ? '<button class="tactile-btn btn-persimmon" id="rs-next">下一关</button>'
              : '<button class="tactile-btn btn-persimmon" id="rs-map">返回手帐</button>'
          }
        </div>`,
        { locked: true }
      );

      $('rs-again').onclick = () => this.loadLevelObject(this.level);
      if ($('rs-next')) $('rs-next').onclick = () => this.startCampaignLevel(this.levelIndex + 1);
      if ($('rs-new')) {
        $('rs-new').onclick = () => {
          const puzzle = generatePuzzle(this.workshopTier, Date.now());
          this.startWorkshopLevel(puzzle);
        };
      }
      if ($('rs-map')) $('rs-map').onclick = () => this.showScreen('map');
      return;
    }

    // 未能全部晒干：给出简洁诊断 + 支持退回上一步继续！
    const remCount = this.state.totalGarments - this.state.driedCount;
    const diag = diagnoseRemainingGarments(this.state)[0];
    this.openModal(
      `<div class="stamp-hero">${svgSunStamp(false)}</div>
      <h2>还剩 ${remCount} 件没干透</h2>
      <p class="dialog-sub">${diag ? `${diag.coordLabel}：${diag.reasonText}` : '每一件衣服都要晒干才算过关哦。'}</p>
      <div class="dialog-actions">
        ${this.history.length > 0 ? '<button class="tactile-btn btn-ivory" id="rs-undo">撤回一步</button>' : ''}
        <button class="tactile-btn btn-ivory" id="rs-demo">看演示</button>
        <button class="tactile-btn btn-persimmon" id="rs-retry">重新摆</button>
      </div>`,
      { locked: true }
    );

    if ($('rs-undo')) {
      $('rs-undo').onclick = () => {
        this.closeModal();
        this.undoStep();
      };
    }
    $('rs-demo').onclick = () => {
      this.closeModal();
      this.runWitnessDemo();
    };
    $('rs-retry').onclick = () => this.loadLevelObject(this.level);
  }

  /* ---------------- 自动演示可达解 ---------------- */
  async runWitnessDemo() {
    if (!this.level?.witnessActions?.length) return;
    this.loadLevelObject(this.level);
    const token = Date.now();
    this.demoToken = token;
    this.demoRunning = true;
    $('demo-pill').hidden = false;

    await sleep(480);
    for (const act of this.level.witnessActions) {
      if (this.demoToken !== token) return;
      if (act.type === 'move') {
        this.liftFrom = { r: act.from[0], c: act.from[1] };
        this.hintSpot = { type: 'move', r: act.to[0], c: act.to[1] };
        this.renderAll();
        await sleep(580);
        if (this.demoToken !== token) return;
        this.hintSpot = null;
        this.executeMoveClip(act.from[0], act.from[1], act.to[0], act.to[1]);
      } else if (act.type === 'place') {
        this.hintSpot = { type: 'place', r: act.at[0], c: act.at[1] };
        this.renderBoardAndLanes();
        await sleep(460);
        if (this.demoToken !== token) return;
        this.hintSpot = null;
        await this.executePlacement(act.at[0], act.at[1]);
      }
      await sleep(360);
    }
  }

  stopDemo(reset = false) {
    if (!this.demoRunning && this.demoToken === 0) return;
    this.demoRunning = false;
    this.demoToken = 0;
    $('demo-pill').hidden = true;
    if (reset && this.level) this.loadLevelObject(this.level);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new SunlitLaundryGame();
});
