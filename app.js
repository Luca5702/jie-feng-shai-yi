// 《借风晒衣》 · 晴日绘本手帐版主控制器（零布局抖动 · 持久 DOM 与平滑过渡架构）
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
const WIND_ROT = { W: 0, S: -90, E: 180, N: 90 };
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
    this.activeScreen = 'home';
    this.level = null;
    this.levelIndex = 0;
    this.isWorkshop = false;
    this.workshopTier = 'courtyard';
    this.state = null;
    this.history = [];
    this.liftFrom = null; // { r, c } when moving an existing garment
    this.hoverCell = null; // { r, c } desktop hover preview
    this.hintSpot = null; // { type, r, c }
    this.busy = false;
    this.demoToken = 0;
    this.demoRunning = false;
    this.dialogLocked = false;
    this.closeModalTimer = null;
    this.sessionToken = 0;

    // 持久 DOM 引用与渲染签名缓存（避免无意义的 DOM 重建与重排闪烁）
    this.cellRefs = [];
    this.laneRefs = [];
    this.windChipRefs = [];
    this.lastNextKey = '';
    this.lastQueueKey = '';
    this.lastCoachHtml = '';
    this.lastWhisperHtml = '';

    sound.sfxEnabled = this.save.sfx !== false;
    this.initStaticIcons();
    this.initBoardDOM();
    this.initWindLanesDOM();
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

  /* 初始化常驻 3×3 棋盘节点：游戏全程零销毁，杜绝悬停或落子导致的动画重置 */
  initBoardDOM() {
    const board = $('board');
    board.innerHTML = '';
    this.cellRefs = [];

    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell is-empty';
        cellEl.dataset.r = String(r);
        cellEl.dataset.c = String(c);

        const entityEl = document.createElement('div');
        entityEl.className = 'cell-entity';

        const ghostEl = document.createElement('div');
        ghostEl.className = 'cell-ghost';

        const badgeEl = document.createElement('span');
        badgeEl.className = 'fx-badge';

        const guideEl = document.createElement('div');
        guideEl.className = 'cell-guide';
        guideEl.innerHTML = ICONS.hand;

        cellEl.append(entityEl, ghostEl, badgeEl, guideEl);
        board.appendChild(cellEl);

        row.push({
          cellEl,
          entityEl,
          ghostEl,
          badgeEl,
          guideEl,
          sig: '',
          ghostSig: '',
        });
      }
      this.cellRefs.push(row);
    }
  }

  /* 初始化常驻架边风向标节点：换风时平滑滑移与最短角旋转 */
  initWindLanesDOM() {
    const lanesEl = $('wind-lanes');
    lanesEl.innerHTML = '';
    this.laneRefs = [];

    for (let i = 0; i < 3; i++) {
      const tokenEl = document.createElement('div');
      tokenEl.className = 'lane-token is-instant';
      tokenEl.innerHTML = svgWindArrow('W');
      const arrowEl = tokenEl.querySelector('.wind-arrow-ic');
      lanesEl.appendChild(tokenEl);
      this.laneRefs.push({ tokenEl, arrowEl, rot: 0, initialized: false });
    }
  }

  /* 每关加载时构建等宽风向日程牌槽位 */
  initWindScheduleDOM() {
    const wrap = $('wind-schedule');
    wrap.innerHTML = '';
    this.windChipRefs = [];
    const s = this.state;

    s.winds.forEach((dir) => {
      const meta = WIND_META[dir];
      const chipEl = document.createElement('div');
      chipEl.className = 'w-chip';
      chipEl.title = `${meta.name}（每挂 ${s.gustEvery} 件吹一次）`;

      const pipsHtml = Array.from({ length: s.gustEvery }, () => '<i class="w-pip"></i>').join('');
      chipEl.innerHTML = `${svgWindArrow(dir)}<span class="w-name">${meta.name}</span><span class="w-pips">${pipsHtml}</span>`;
      wrap.appendChild(chipEl);

      this.windChipRefs.push({
        chipEl,
        pipEls: Array.from(chipEl.querySelectorAll('.w-pip')),
      });
    });
  }

  clearBoardTransientFx() {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const { cellEl, entityEl } = this.cellRefs[r][c];
        cellEl.classList.remove('anim-hit', 'anim-collect');
        entityEl.classList.remove('anim-place');
        entityEl.style.transition = '';
        entityEl.style.transform = '';
        cellEl.querySelectorAll('.collect-tag').forEach((n) => n.remove());
      }
    }
    $('gust-fx').innerHTML = '';
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
      if (this.state && this.activeScreen === 'play') {
        this.renderWindLanes(null, { instant: true });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('modal-layer').hidden && !this.dialogLocked) {
        this.closeModal();
      } else if (
        (e.key === 'z' || e.key === 'Z') &&
        this.activeScreen === 'play' &&
        $('modal-layer').hidden
      ) {
        this.undoStep();
      }
    });
  }

  showScreen(name) {
    this.sessionToken += 1;
    this.activeScreen = name;
    for (const key of ['home', 'map', 'play']) {
      const el = $(`screen-${key}`);
      const active = key === name;
      el.classList.toggle('is-screen-active', active);
      el.setAttribute('aria-hidden', active ? 'false' : 'true');
    }
    this.closeModal({ immediate: true });
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
    this.sessionToken += 1;
    this.stopDemo();
    this.clearBoardTransientFx();
    this.level = levelObj;
    this.state = createInitialState(levelObj);
    this.history = [];
    this.liftFrom = null;
    this.hoverCell = null;
    this.hintSpot = null;
    this.busy = false;
    this.lastNextKey = '';
    this.lastQueueKey = '';
    this.lastCoachHtml = '';
    this.lastWhisperHtml = '';

    for (const ref of this.laneRefs) ref.initialized = false;

    this.showScreen('play');
    if (this.isWorkshop) {
      $('play-kicker').textContent = `出题工坊 · 难度 ${levelObj.metrics?.difficultyScore ?? '--'}`;
      $('play-title').textContent = levelObj.title;
    } else {
      const chNames = ['一', '二', '三', '四'];
      $('play-kicker').textContent = `卷${chNames[(levelObj.chapter || 1) - 1]} · 第 ${String(levelObj.num).padStart(2, '0')} 关`;
      $('play-title').textContent = levelObj.title;
    }

    this.initWindScheduleDOM();
    this.renderAll({ instantLanes: true });
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
      this.renderAll({
        movedFrom: { r: fromR, c: fromC },
        movedTo: { r: toR, c: toC },
      });
    } catch (err) {
      this.showToast(err.message);
    }
  }

  async executePlacement(r, c) {
    if (this.busy) return;
    this.busy = true;
    const session = this.sessionToken;
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
      // 先呈现刚挂上瞬间（含衣篮平滑前移），再吹风结算
      const preGustGrid = previewActionForecast(snapshot, { type: 'place', r, c }).tempGrid;
      this.state = {
        ...res.state,
        grid: preGustGrid,
        status: 'playing',
        driedCount: snapshot.driedCount,
        gustIndex: snapshot.gustIndex,
      };
      this.renderAll({ placedAt: { r, c }, advanceQueue: true });
      await sleep(280);
      if (this.sessionToken !== session) return;
      await this.animateWindGust(res.gustTriggered);
      if (this.sessionToken !== session) return;
      this.clearBoardTransientFx();
      this.state = res.state;
      this.renderAll();
    } else {
      this.state = res.state;
      this.renderAll({ placedAt: { r, c }, advanceQueue: true });
    }

    this.busy = false;

    if (this.state.status !== 'playing') {
      await sleep(520);
      if (this.sessionToken !== session) return;
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
      const ref = this.cellRefs[hit.r]?.[hit.c];
      if (!ref) continue;
      if (hit.collected) {
        ref.cellEl.classList.add('anim-collect');
        const badge = document.createElement('span');
        badge.className = 'collect-tag';
        badge.textContent = '晒干';
        ref.cellEl.appendChild(badge);
      } else {
        ref.cellEl.classList.add('anim-hit');
      }
    }
    await sleep(560);
    fx.innerHTML = '';
  }

  undoStep() {
    if (this.busy || this.demoRunning || this.history.length === 0) return;
    this.clearBoardTransientFx();
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

  /* ---------------- 零抖动增量渲染 ---------------- */
  renderAll(opts = {}) {
    this.renderHeaderCounter();
    this.renderWindSchedule();
    this.renderBoardAndLanes(opts);
    this.renderDock({ advanceAnim: Boolean(opts.advanceQueue) });
    this.renderCoachAndWhisper();
  }

  renderHeaderCounter() {
    const { driedCount, totalGarments } = this.state;
    const pill = $('dry-pill');
    const done = driedCount === totalGarments;
    pill.innerHTML = `${svgSunStamp(done)}<span>${driedCount} / ${totalGarments}</span>`;
    pill.classList.toggle('is-done', done);
  }

  renderWindSchedule() {
    const s = this.state;
    if (this.windChipRefs.length !== s.winds.length) {
      this.initWindScheduleDOM();
    }
    const placedInCycle = s.placedCount % s.gustEvery;
    const playing = this.isPlaying;

    this.windChipRefs.forEach(({ chipEl, pipEls }, idx) => {
      const isDone = idx < s.gustIndex || !playing;
      const isActive = idx === s.gustIndex && playing;

      chipEl.classList.toggle('is-done', isDone && !isActive);
      chipEl.classList.toggle('is-active', isActive);

      pipEls.forEach((pipEl, k) => {
        const filled = isDone ? true : isActive ? k < placedInCycle : false;
        pipEl.classList.toggle('filled', filled);
      });
    });
  }

  computeDisplayForecast() {
    const s = this.state;
    const windDir = s.winds[s.gustIndex] || null;
    if (this.hoverCell && this.isPlaying && !this.guidedStepAction) {
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

  renderBoardAndLanes({
    placedAt = null,
    movedFrom = null,
    movedTo = null,
    instantLanes = false,
  } = {}) {
    const s = this.state;
    const { tempGrid, forecast } = this.computeDisplayForecast();
    const shadowSet = new Set(forecast.shadowEmptyCells.map((x) => `${x.r},${x.c}`));
    const exposedSet = new Set(forecast.exposedEmptyCells.map((x) => `${x.r},${x.c}`));
    const guided = this.guidedStepAction;
    const hoverValidMoveDest = Boolean(
      this.liftFrom &&
        this.hoverCell &&
        this.isPlaying &&
        !s.grid[this.hoverCell.r][this.hoverCell.c]
    );

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const key = `${r},${c}`;
        const ref = this.cellRefs[r][c];
        const { cellEl, entityEl, ghostEl, badgeEl, guideEl } = ref;
        const realCell = s.grid[r][c];
        const tempCell = tempGrid[r][c];

        // 1. 更新实体层（仅在真实格子内容或湿度改变时更新 SVG，悬停时完全不动）
        const nextSig = !realCell
          ? ''
          : isObstacleCell(realCell)
          ? 'P'
          : `G:${realCell.id ?? ''}:${realCell.type}:${realCell.wetness}`;

        if (ref.sig !== nextSig) {
          ref.sig = nextSig;
          if (!realCell) {
            entityEl.innerHTML = '';
          } else if (isObstacleCell(realCell)) {
            entityEl.innerHTML = `<div class="tree-art">${svgKumquatTree()}</div>`;
          } else {
            entityEl.innerHTML = renderGarmentMarkup(realCell.type, realCell.wetness);
          }
        }

        // 单次落子柔和摆正过渡
        if (placedAt && placedAt.r === r && placedAt.c === c && realCell) {
          entityEl.classList.remove('anim-place');
          void entityEl.offsetWidth;
          entityEl.classList.add('anim-place');
        }

        // 木夹移衣跨格平滑滑移过渡（FLIP）
        if (movedFrom && movedTo && movedTo.r === r && movedTo.c === c && realCell) {
          const fromEl = this.cellRefs[movedFrom.r]?.[movedFrom.c]?.cellEl;
          if (fromEl) {
            const r1 = fromEl.getBoundingClientRect();
            const r2 = cellEl.getBoundingClientRect();
            const dx = r1.left - r2.left;
            const dy = r1.top - r2.top;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              entityEl.style.transition = 'none';
              entityEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.04)`;
              void entityEl.offsetWidth;
              entityEl.style.transition = 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
              entityEl.style.transform = '';
            }
          }
        }

        // 2. 更新悬停预览虚影层（纯透明度过渡，不触发任何布局变化）
        const isGhost = Boolean(tempCell && tempCell.isPreview);
        if (isGhost) {
          const gSig = `${tempCell.type}:${tempCell.wetness}`;
          if (ref.ghostSig !== gSig) {
            ref.ghostSig = gSig;
            ghostEl.innerHTML = renderGarmentMarkup(tempCell.type, tempCell.wetness, {
              ghost: true,
            });
          }
          ghostEl.classList.add('is-visible');
        } else {
          ghostEl.classList.remove('is-visible');
        }

        // 3. 更新风效角标（收 / -1 / 挡）
        const fInfo = this.isPlaying && isGarmentCell(tempCell) ? forecast.cellMap[key] : null;
        if (fInfo) {
          const label =
            fInfo.status === 'collect' ? '收' : fInfo.status === 'hit' ? '-1' : '挡';
          badgeEl.textContent = label;
          badgeEl.className = `fx-badge is-visible ${fInfo.status}`;
        } else {
          badgeEl.classList.remove('is-visible');
        }

        // 4. 更新引导手势与格子状态类名（保留吹风瞬态类）
        const isGuideTarget = Boolean(
          guided && guided.type === 'place' && guided.at[0] === r && guided.at[1] === c
        );
        guideEl.classList.toggle('is-visible', isGuideTarget);

        const isLifted = Boolean(this.liftFrom && this.liftFrom.r === r && this.liftFrom.c === c);
        const isHintSpot = Boolean(this.hintSpot && this.hintSpot.r === r && this.hintSpot.c === c);

        cellEl.classList.toggle('is-empty', !realCell);
        cellEl.classList.toggle('has-tree', isObstacleCell(realCell));
        cellEl.classList.toggle('has-garment', isGarmentCell(realCell));
        cellEl.classList.toggle(
          'can-lift',
          isGarmentCell(realCell) && s.tickets > 0 && !guided && this.isPlaying
        );
        cellEl.classList.toggle('is-shadow', !tempCell && shadowSet.has(key));
        cellEl.classList.toggle(
          'is-exposed',
          !tempCell && !shadowSet.has(key) && exposedSet.has(key)
        );
        cellEl.classList.toggle('is-move-dest', !realCell && Boolean(this.liftFrom));
        cellEl.classList.toggle('is-lifted', isLifted);
        cellEl.classList.toggle('is-preview-away', isLifted && hoverValidMoveDest);
        cellEl.classList.toggle('is-hint-spot', isHintSpot);
        cellEl.classList.toggle('is-guide-target', isGuideTarget);
        cellEl.classList.toggle('is-guide-locked', Boolean(guided && !isGuideTarget));
      }
    }

    this.renderWindLanes(forecast, { instant: instantLanes });
  }

  renderWindLanes(forecastArg, { instant = false } = {}) {
    const lanesEl = $('wind-lanes');
    const s = this.state;
    const windDir = s.winds[s.gustIndex];
    if (!windDir || !this.isPlaying) {
      lanesEl.classList.add('is-hidden');
      return;
    }

    lanesEl.classList.remove('is-hidden');
    const forecast = forecastArg || computeWindForecast(s.grid, windDir);

    const shellW = $('rack-shell').clientWidth || 300;
    const framePad = 15; // 10px wood + 5px grid pad
    const gap = 7;
    const cellSize = (shellW - framePad * 2 - gap * 2) / 3;
    const offset = 28;
    const span = shellW + offset * 2;
    const tokenSize = 24;
    const targetRot = WIND_ROT[windDir] ?? 0;

    for (let i = 0; i < 3; i++) {
      const ref = this.laneRefs[i];
      const { tokenEl, arrowEl } = ref;
      const center = offset + framePad + i * (cellSize + gap) + cellSize / 2 - tokenSize / 2;

      let x = 0;
      let y = 0;
      if (windDir === 'W') {
        x = 0;
        y = center;
      } else if (windDir === 'E') {
        x = span - tokenSize;
        y = center;
      } else if (windDir === 'N') {
        x = center;
        y = 0;
      } else if (windDir === 'S') {
        x = center;
        y = span - tokenSize;
      }

      const useInstant = instant || !ref.initialized;
      if (useInstant) {
        tokenEl.classList.add('is-instant');
        ref.rot = targetRot;
      } else {
        // 最短角度旋转，避免 180° -> -90° 反向转大圈
        const delta = ((targetRot - ref.rot + 540) % 360) - 180;
        ref.rot += delta;
      }

      tokenEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      arrowEl.style.transform = `rotate(${ref.rot}deg)`;
      tokenEl.classList.toggle('is-idle', forecast.emptyScanlines.includes(i));
      ref.initialized = true;

      if (useInstant) {
        void tokenEl.offsetWidth;
        tokenEl.classList.remove('is-instant');
      }
    }
  }

  renderDock({ advanceAnim = false } = {}) {
    const s = this.state;
    const iconBox = $('next-icon-box');
    const metaBox = $('next-meta');

    const nextKey = this.isPlaying
      ? `play:${s.placedCount}:${s.queue[s.placedCount]}`
      : `done:${s.status}`;

    if (this.lastNextKey !== nextKey) {
      this.lastNextKey = nextKey;
      if (!this.isPlaying) {
        iconBox.innerHTML = svgSunStamp(s.status === 'won');
        metaBox.innerHTML = `
          <span class="kicker">衣篮状态</span>
          <span class="name">已挂完</span>
          <span class="sub">${s.status === 'won' ? '尽数干透' : '等待结算'}</span>
        `;
      } else {
        const curType = s.queue[s.placedCount];
        const meta = GARMENT_META[curType];
        iconBox.innerHTML = renderGarmentMarkup(curType, meta.initialWetness, {
          drops: false,
          pins: false,
        });
        metaBox.innerHTML = `
          <span class="kicker">待挂衣物</span>
          <span class="name">${meta.name}</span>
          <span class="sub">${meta.initialWetness} 滴水</span>
        `;
      }

      if (advanceAnim) {
        iconBox.classList.remove('anim-slot-in');
        void iconBox.offsetWidth;
        iconBox.classList.add('anim-slot-in');
      }
    }

    // 队列轨迹（含阵风分隔标与平滑前移过渡）
    const queueKey = `${s.placedCount}:${this.isPlaying}`;
    if (this.lastQueueKey !== queueKey) {
      this.lastQueueKey = queueKey;
      let items = '';
      for (let i = s.placedCount; i < s.queue.length; i++) {
        if (i > s.placedCount) {
          items += `<div class="q-garment" title="${GARMENT_META[s.queue[i]].name}">${renderGarmentMarkup(
            s.queue[i],
            1,
            { drops: false, pins: false }
          )}</div>`;
        }
        if ((i + 1) % s.gustEvery === 0) {
          const wDir = s.winds[(i + 1) / s.gustEvery - 1];
          if (wDir) {
            items += `<div class="q-gust" title="${WIND_META[wDir].name}">${svgWindArrow(wDir)}</div>`;
          }
        }
      }

      const content =
        items ||
        `<span class="q-done-msg">${this.isPlaying ? '挂好这件即吹最后一阵风' : '全部阵风已结算完毕'}</span>`;
      const cls = advanceAnim ? 'queue-track-inner is-advancing' : 'queue-track-inner';
      $('queue-track').innerHTML = `<div class="${cls}">${content}</div>`;
    }

    $('btn-undo').disabled = this.history.length === 0 || !this.isPlaying;
    $('btn-restart').disabled = this.history.length === 0 && s.status === 'playing';
    $('btn-hint').disabled = !this.isPlaying || Boolean(this.guidedStepAction);

    const clipBtn = $('btn-clip');
    if (s.maxTickets > 0) {
      clipBtn.hidden = false;
      clipBtn.classList.toggle('is-active', Boolean(this.liftFrom));
      clipBtn.disabled = !this.isPlaying || (!this.liftFrom && s.tickets <= 0);
      clipBtn.innerHTML = `${ICONS.clip}<span>${this.liftFrom ? '取消移衣' : `木夹 ×${s.tickets}`}</span>`;
    } else {
      clipBtn.hidden = true;
    }
  }

  renderCoachAndWhisper() {
    const coachEl = $('coach-note');
    const whisperEl = $('whisper-line');
    const step = this.state.actionLog.length;

    let coachHtml = '';
    const lines = !this.isWorkshop && GUIDED_COACH[this.level.id];
    if (lines && lines[step] && this.isPlaying && !this.demoRunning) {
      coachHtml = lines[step];
    } else if (
      !this.isWorkshop &&
      ['L6', 'L11', 'L16'].includes(this.level.id) &&
      step === 0 &&
      this.isPlaying
    ) {
      coachHtml = this.level.subtitle;
    }

    if (coachHtml) {
      if (this.lastCoachHtml !== coachHtml) {
        this.lastCoachHtml = coachHtml;
        coachEl.innerHTML = coachHtml;
      }
      coachEl.classList.add('is-visible');
    } else {
      coachEl.classList.remove('is-visible');
    }

    let whisperHtml = '';
    if (!this.isPlaying) {
      whisperHtml =
        this.state.status === 'won' ? '满架衣裳尽数晒干！' : '还有衣物没干透，试试撤回调整位置';
    } else if (this.liftFrom) {
      whisperHtml = '点选任意<b>空位</b>将衣服夹过去（不消耗挂衣步数）';
    } else {
      const remainToGust = this.state.gustEvery - (this.state.placedCount % this.state.gustEvery);
      const wind = WIND_META[this.state.winds[this.state.gustIndex]];
      whisperHtml = `再挂 <b>${remainToGust}</b> 件吹<b>${wind.name}</b> · 斜纹格为当前背风处`;
    }

    if (this.lastWhisperHtml !== whisperHtml) {
      this.lastWhisperHtml = whisperHtml;
      whisperEl.innerHTML = whisperHtml;
    }
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
    clearTimeout(this.closeModalTimer);
    this.dialogLocked = locked;
    const layer = $('modal-layer');
    layer.classList.remove('is-closing');
    $('paper-dialog').innerHTML = html;
    layer.hidden = false;
  }

  closeModal({ immediate = false } = {}) {
    const layer = $('modal-layer');
    clearTimeout(this.closeModalTimer);
    this.dialogLocked = false;
    if (layer.hidden) return;
    if (immediate) {
      layer.classList.remove('is-closing');
      layer.hidden = true;
      return;
    }
    layer.classList.add('is-closing');
    this.closeModalTimer = setTimeout(() => {
      layer.hidden = true;
      layer.classList.remove('is-closing');
    }, 160);
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
        <button class="menu-row" data-act="sfx"><span class="menu-ic" id="mn-sfx-ic">${sound.sfxEnabled ? ICONS.soundOn : ICONS.soundOff}</span><span>庭院音效</span><span class="menu-val" id="mn-sfx-val">${sound.sfxEnabled ? '开启' : '关闭'}</span></button>
        <button class="menu-row" data-act="bgm"><span class="menu-ic">${ICONS.soundOn}</span><span>午后微风环境音</span><span class="menu-val" id="mn-bgm-val">${sound.bgmEnabled ? '开启' : '关闭'}</span></button>
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
            $('mn-sfx-ic').innerHTML = sound.sfxEnabled ? ICONS.soundOn : ICONS.soundOff;
            $('mn-sfx-val').textContent = sound.sfxEnabled ? '开启' : '关闭';
          } else if (act === 'bgm') {
            sound.toggleBgm();
            $('mn-bgm-val').textContent = sound.bgmEnabled ? '开启' : '关闭';
          }
        })
      );
  }

  openRulesModal(startPage = 0) {
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

    let curIdx = startPage;
    this.openModal(`
      <h2 id="rl-title"></h2>
      <div class="rule-box" id="rl-box">
        <div class="rule-illus" id="rl-illus"></div>
        <p class="dialog-sub" id="rl-desc" style="margin:0"></p>
      </div>
      <div class="rule-dots" id="rl-dots">${pages.map(() => '<i></i>').join('')}</div>
      <div class="dialog-actions">
        <button class="tactile-btn btn-ivory" id="rl-prev"></button>
        <button class="tactile-btn btn-persimmon" id="rl-next"></button>
      </div>
    `);

    const syncPage = () => {
      const cur = pages[curIdx];
      const isLast = curIdx === pages.length - 1;
      $('rl-title').textContent = cur.title;
      $('rl-illus').innerHTML = cur.illus;
      $('rl-desc').innerHTML = cur.desc;
      $('rl-dots')
        .querySelectorAll('i')
        .forEach((dot, i) => dot.classList.toggle('on', i === curIdx));
      $('rl-prev').textContent = curIdx === 0 ? '关闭' : '上一页';
      $('rl-next').textContent = isLast ? '明白啦' : '下一页';
    };

    $('rl-prev').onclick = () => {
      playSfx(() => sound.playUiClick());
      if (curIdx === 0) this.closeModal();
      else {
        curIdx -= 1;
        syncPage();
      }
    };
    $('rl-next').onclick = () => {
      playSfx(() => sound.playUiClick());
      if (curIdx === pages.length - 1) this.closeModal();
      else {
        curIdx += 1;
        syncPage();
      }
    };

    syncPage();
  }

  openWorkshopModal() {
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
      <div class="tier-list" id="ws-tiers">${cards}</div>
      <div class="dialog-actions">
        <button class="tactile-btn btn-ivory" id="ws-cancel">取消</button>
        <button class="tactile-btn btn-persimmon" id="ws-go">生成新题</button>
      </div>
    `);

    const tierBtns = Array.from($('ws-tiers').querySelectorAll('.tier-card'));
    tierBtns.forEach((btn) =>
      btn.addEventListener('click', () => {
        playSfx(() => sound.playUiClick());
        this.workshopTier = btn.dataset.tier;
        tierBtns.forEach((b) => b.classList.toggle('is-picked', b === btn));
      })
    );

    $('ws-cancel').onclick = () => this.closeModal();
    $('ws-go').onclick = () => {
      const puzzle = generatePuzzle(this.workshopTier, Date.now());
      this.closeModal({ immediate: true });
      this.startWorkshopLevel(puzzle);
    };
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
      this.closeModal({ immediate: true });
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
