import {
  WIND_META,
  GARMENT_META,
  createInitialState,
  isBoardFull,
  countEmptyCells,
  previewActionForecast,
  applyMoveAction,
  applyPlaceOrSkipAction,
  replayActionSequence,
  diagnoseRemainingGarments,
  generateTwoLevelHints,
} from './engine.js';
import { LEVELS } from './levels.js';
import { sound } from './audio.js';
import { CourtyardVfxEngine } from './vfx.js';

const STORAGE_KEY = 'jggo_commercial_v1';

/**
 * Hand-crafted Rich Illustrated Garment Sprites with Wooden Clothespins,
 * Fabric Folds, Pockets, Knit Cable Patterns, and Soft Highlights.
 */
function renderIllustratedGarmentSvg(type, wetness) {
  const isDamp2 = wetness >= 2;
  if (type === 'L') {
    // Crisp Sunlit White-Cyan Linen Shirt with Wooden Clothespins
    return `
      <svg class="garment-illustration" viewBox="0 0 80 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="linenBody" x1="40" y1="12" x2="40" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="65%" stop-color="#E6F7FC"/>
            <stop offset="100%" stop-color="#BCE7F5"/>
          </linearGradient>
        </defs>
        <!-- Hanging Shadow -->
        <path d="M23 16 L10 26 L17 37 L24 33 L22 65 Q40 68 58 65 L56 33 L63 37 L70 26 L57 16 Z" fill="rgba(18,82,108,0.16)" transform="translate(1,3)"/>
        <!-- Shirt Silhouette -->
        <path d="M24 14 L9 25 L16 37 L24 32 L22 64 Q40 67 58 64 L56 32 L64 37 L71 25 L56 14 C50 19 30 19 24 14 Z"
              fill="url(#linenBody)" stroke="#16698A" stroke-width="2.6" stroke-linejoin="round"/>
        <!-- Collar & Placket -->
        <path d="M28 15 L36 23 L40 19 L44 23 L52 15" stroke="#16698A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="#D5F1FA"/>
        <line x1="40" y1="20" x2="40" y2="42" stroke="#53A8C6" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Pocket & Gentle Breeze Folds -->
        <rect x="45" y="30" width="8" height="9" rx="2" stroke="#3D95B5" stroke-width="1.6" fill="rgba(255,255,255,0.6)"/>
        <path d="M30 46 Q33 54 29 61" stroke="#7AC3DC" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M50 48 Q53 55 51 61" stroke="#7AC3DC" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Two Wooden Clothespins on Top Shoulders -->
        <rect x="24" y="5" width="5" height="13" rx="2" fill="#E39D45" stroke="#6E3F14" stroke-width="1.8"/>
        <rect x="51" y="5" width="5" height="13" rx="2" fill="#E39D45" stroke="#6E3F14" stroke-width="1.8"/>
      </svg>
    `;
  }

  // Cozy Terracotta Cable-Knit Thick Coat / Sweater (H)
  // Visual feedback: darker damp hem when wetness === 2, brighter warm amber when wetness === 1 (half-dry!)
  const bodyTop = isDamp2 ? '#F6B089' : '#FFD09E';
  const bodyBot = isDamp2 ? '#C95B2B' : '#E87A3D';
  const strokeCol = isDamp2 ? '#6E260E' : '#853312';

  return `
    <svg class="garment-illustration" viewBox="0 0 80 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="woolBody_${wetness}" x1="40" y1="12" x2="40" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${bodyTop}"/>
          <stop offset="100%" stop-color="${bodyBot}"/>
        </linearGradient>
      </defs>
      <!-- Drop Shadow -->
      <path d="M22 15 L6 29 L13 44 L22 38 L21 66 L59 66 L58 38 L67 44 L74 29 L58 15 Z" fill="rgba(75,24,6,0.22)" transform="translate(1,3)"/>
      <!-- Heavy Sweater Silhouette -->
      <path d="M23 13 L6 28 L13 43 L22 37 L21 65 Q40 68 59 65 L58 37 L67 43 L74 28 L57 13 C50 18 30 18 23 13 Z"
            fill="url(#woolBody_${wetness})" stroke="${strokeCol}" stroke-width="2.8" stroke-linejoin="round"/>
      <!-- Thick Ribbed Turtleneck Collar -->
      <rect x="28" y="9" width="24" height="9" rx="4.5" fill="#FCE3C8" stroke="${strokeCol}" stroke-width="2.4"/>
      <!-- Cable-Knit Center Pattern & Ribbed Hem -->
      <path d="M36 22 Q40 27 36 32 Q40 37 36 42 Q40 47 36 52" stroke="#FFEAD2" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
      <path d="M44 22 Q40 27 44 32 Q40 37 44 42 Q40 47 44 52" stroke="#FFEAD2" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
      <line x1="22" y1="58" x2="58" y2="58" stroke="${strokeCol}" stroke-width="2.2"/>
      ${isDamp2 ? `<path d="M22 58 L58 58 L59 65 Q40 68 21 65 Z" fill="rgba(26,115,158,0.32)"/>` : ''}
      <!-- Two Sturdy Wooden Clothespins -->
      <rect x="21" y="4" width="5.5" height="13" rx="2" fill="#E39D45" stroke="#6E3F14" stroke-width="1.8"/>
      <rect x="53.5" y="4" width="5.5" height="13" rx="2" fill="#E39D45" stroke="#6E3F14" stroke-width="1.8"/>
    </svg>
  `;
}

class CommercialJggoGame {
  constructor() {
    this.levels = LEVELS;
    this.currentScreen = 'title'; // 'title' | 'map' | 'play'
    this.currentLevelIndex = 0;   // Start fresh players at T1 (15s onboarding), or resume saved level
    this.state = null;

    this.interactionMode = 'place'; // 'place' | 'move' | 'replay'
    this.previewCell = null;
    this.moveSource = null;
    this.moveDest = null;
    this.hintStage = 0;
    this.replayData = null;
    this.justBillowedCells = new Set();

    // Progress & Telemetry
    this.bestScores = {};
    this.retryCounts = {};
    this.telemetryEvents = [];
    this.cancelCountThisRun = 0;
    this.activeDurationMs = 0;
    this.lastResumeTs = performance.now();

    this._loadProgress();

    // Initialize VFX Canvas
    const canvasEl = document.getElementById('courtyard-vfx-canvas');
    this.vfx = new CourtyardVfxEngine(canvasEl);

    this._bindEvents();
    this._renderTitleButtonState();
    this.showScreen('title');
  }

  _loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.bestScores = data.bestScores || {};
      this.retryCounts = data.retryCounts || {};
      if (typeof data.currentLevelIndex === 'number' && this.levels[data.currentLevelIndex]) {
        this.currentLevelIndex = data.currentLevelIndex;
      }
      if (data.savedState && data.savedState.levelId === this.levels[this.currentLevelIndex].id) {
        this.state = data.savedState;
      }
    } catch (e) {}
  }

  _saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: '1.0',
          currentLevelIndex: this.currentLevelIndex,
          bestScores: this.bestScores,
          retryCounts: this.retryCounts,
          savedState: this.state,
        })
      );
    } catch (e) {}
  }

  _fgSec() {
    const extra =
      this.currentScreen === 'play' && this.state?.status === 'playing'
        ? performance.now() - this.lastResumeTs
        : 0;
    return Math.round((this.activeDurationMs + extra) / 100) / 10;
  }

  _logEvent(eventType, payload = {}) {
    const lv = this.levels[this.currentLevelIndex];
    this.telemetryEvents.push({
      ts: new Date().toISOString(),
      levelId: lv?.id,
      fgSec: this._fgSec(),
      eventType,
      ...payload,
    });
    if (this.telemetryEvents.length > 300) this.telemetryEvents.shift();
  }

  _calcStars(lv, score) {
    if (typeof score !== 'number' || score < lv.target) return 0;
    if (score >= lv.maxFoundScore) return 3;
    if (score >= lv.target + 2 || lv.target === lv.maxFoundScore) return 2;
    return 1;
  }

  showScreen(screenName) {
    this.currentScreen = screenName;
    document.getElementById('screen-title').hidden = screenName !== 'title';
    document.getElementById('screen-map').hidden = screenName !== 'map';
    document.getElementById('screen-play').hidden = screenName !== 'play';

    if (screenName === 'title') {
      this.vfx.stop();
      this._renderTitleButtonState();
    } else if (screenName === 'map') {
      this.vfx.stop();
      this._renderMapScreen();
    } else if (screenName === 'play') {
      if (!this.state) {
        this.startLevel(this.currentLevelIndex, true);
      } else {
        this.renderPlayScreen();
      }
      requestAnimationFrame(() => {
        this.vfx.resize();
        this.vfx.start();
      });
    }
  }

  _renderTitleButtonState() {
    const btn = document.getElementById('btn-title-continue');
    if (!btn) return;
    const clearedCount = this.levels.filter(
      (lv) => (this.bestScores[lv.id] ?? -1) >= lv.target
    ).length;
    if (clearedCount > 0) {
      const lv = this.levels[this.currentLevelIndex];
      btn.textContent = `☀ 继续晒衣（${lv.title.split('·')[0].trim()} · 已通 ${clearedCount}/15）`;
    } else {
      btn.textContent = '☀ 开始晒衣之旅（从 30 秒新手引导开始）';
    }
  }

  _bindEvents() {
    // Title Screen
    document.getElementById('btn-title-continue')?.addEventListener('click', () => {
      sound.playUiClick();
      this.startLevel(this.currentLevelIndex, !this.state || this.state.status !== 'playing');
      this.showScreen('play');
    });

    document.getElementById('btn-title-levels')?.addEventListener('click', () => {
      sound.playUiClick();
      this.showScreen('map');
    });

    document.getElementById('btn-title-rules')?.addEventListener('click', () => {
      sound.playUiClick();
      document.getElementById('modal-handbook')?.removeAttribute('hidden');
    });

    // Map Screen
    document.getElementById('btn-map-back')?.addEventListener('click', () => {
      sound.playUiClick();
      this.showScreen('title');
    });

    document.getElementById('btn-map-rules')?.addEventListener('click', () => {
      sound.playUiClick();
      document.getElementById('modal-handbook')?.removeAttribute('hidden');
    });

    // Play HUD
    document.getElementById('btn-play-to-map')?.addEventListener('click', () => {
      sound.playUiClick();
      this._stopReplayTimer();
      this.showScreen('map');
    });

    document.getElementById('btn-play-hint')?.addEventListener('click', () => {
      sound.playUiClick();
      this.hintStage = (this.hintStage + 1) % 3;
      this._logEvent('toggle_hint', { hintStage: this.hintStage });
      this.renderPlayScreen();
    });

    document.getElementById('btn-play-witness')?.addEventListener('click', () => {
      sound.playUiClick();
      this.startWitnessReplay();
    });

    document.getElementById('btn-play-bgm')?.addEventListener('click', (e) => {
      const on = sound.toggleBgm();
      e.currentTarget.textContent = on ? '🎐 庭院音:开' : '🎐 庭院音:关';
    });

    document.getElementById('btn-play-sfx')?.addEventListener('click', (e) => {
      const on = sound.toggleSfx();
      e.currentTarget.textContent = on ? '🔊' : '🔇';
    });

    document.getElementById('btn-play-restart')?.addEventListener('click', () => {
      sound.playUiClick();
      const lv = this.levels[this.currentLevelIndex];
      this.retryCounts[lv.id] = (this.retryCounts[lv.id] || 0) + 1;
      this._logEvent('manual_restart', { prevScore: this.state?.score || 0 });
      this.startLevel(this.currentLevelIndex, true);
    });

    // Dock Action Buttons
    document.getElementById('btn-confirm-hang')?.addEventListener('click', () => {
      this.confirmAction();
    });

    document.getElementById('btn-cancel-preview')?.addEventListener('click', () => {
      sound.playUiClick();
      this.cancelCountThisRun += 1;
      this._logEvent('cancel_preview');
      this.interactionMode = 'place';
      this.previewCell = null;
      this.moveSource = null;
      this.moveDest = null;
      this.renderPlayScreen();
    });

    document.getElementById('btn-use-ticket')?.addEventListener('click', () => {
      sound.playUiClick();
      this.toggleMoveTicketMode();
    });

    document.getElementById('btn-open-recap')?.addEventListener('click', () => {
      sound.playUiClick();
      this._renderRecapModal();
      document.getElementById('modal-recap')?.removeAttribute('hidden');
    });

    // Replay Controls
    document.getElementById('btn-replay-prev')?.addEventListener('click', () => this.stepReplay(-1));
    document.getElementById('btn-replay-next')?.addEventListener('click', () => this.stepReplay(1));
    document.getElementById('btn-replay-auto')?.addEventListener('click', () => this.toggleReplayAuto());
    document.getElementById('btn-replay-close')?.addEventListener('click', () => {
      sound.playUiClick();
      this._stopReplayTimer();
      this.interactionMode = 'place';
      this.replayData = null;
      this.renderPlayScreen();
    });

    // Modals Close & Endgame Actions
    document.getElementById('btn-close-handbook')?.addEventListener('click', () => {
      document.getElementById('modal-handbook')?.setAttribute('hidden', '');
    });

    document.getElementById('btn-close-recap')?.addEventListener('click', () => {
      document.getElementById('modal-recap')?.setAttribute('hidden', '');
    });

    document.getElementById('btn-export-logs')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.telemetryEvents, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jie-feng-shai-yi-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('btn-endgame-next')?.addEventListener('click', () => {
      sound.playUiClick();
      document.getElementById('modal-endgame')?.setAttribute('hidden', '');
      const nextIdx = (this.currentLevelIndex + 1) % this.levels.length;
      this.startLevel(nextIdx, true);
    });

    document.getElementById('btn-endgame-retry')?.addEventListener('click', () => {
      sound.playUiClick();
      document.getElementById('modal-endgame')?.setAttribute('hidden', '');
      this.startLevel(this.currentLevelIndex, true);
    });

    document.getElementById('btn-endgame-witness')?.addEventListener('click', () => {
      sound.playUiClick();
      document.getElementById('modal-endgame')?.setAttribute('hidden', '');
      this.startWitnessReplay();
    });

    document.getElementById('btn-endgame-close')?.addEventListener('click', () => {
      document.getElementById('modal-endgame')?.setAttribute('hidden', '');
    });
  }

  _renderMapScreen() {
    const root = document.getElementById('map-chapters-root');
    const summaryEl = document.getElementById('map-progress-summary');
    if (!root) return;

    const clearedTotal = this.levels.filter(
      (lv) => (this.bestScores[lv.id] ?? -1) >= lv.target
    ).length;
    const totalStars = this.levels.reduce(
      (acc, lv) => acc + this._calcStars(lv, this.bestScores[lv.id]),
      0
    );
    if (summaryEl) {
      summaryEl.textContent = `已达标 ${clearedTotal} / ${this.levels.length} 关 · 累计获得 ⭐ ${totalStars} / ${this.levels.length * 3}`;
    }

    const stages = ['新手教学', '早期标准', '中期进阶', '后期挑战'];
    root.innerHTML = '';

    stages.forEach((stageName) => {
      const groupLevels = this.levels
        .map((lv, idx) => ({ lv, idx }))
        .filter((item) => item.lv.stage === stageName);

      const sec = document.createElement('div');
      sec.className = 'chapter-section';
      sec.innerHTML = `
        <div class="chapter-header">
          <h3 class="chapter-title">${stageName}</h3>
          <span style="font-size:0.78rem;color:var(--ink-body);">${groupLevels.length} 个庭院关卡</span>
        </div>
        <div class="level-cards-grid"></div>
      `;

      const grid = sec.querySelector('.level-cards-grid');
      groupLevels.forEach(({ lv, idx }) => {
        const best = this.bestScores[lv.id];
        const stars = this._calcStars(lv, best);
        const starStr =
          stars > 0 ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆';
        const windsStr = lv.winds.map((w) => `${WIND_META[w].short}${WIND_META[w].arrow}`).join(' ');

        const card = document.createElement('button');
        card.type = 'button';
        card.className = `map-level-card ${stars > 0 ? 'is-cleared' : ''}`;
        card.innerHTML = `
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <span style="font-weight:900;font-size:0.9rem;color:var(--wood-dark);">${lv.title}</span>
              <span class="map-stars">${starStr}</span>
            </div>
            <p style="margin:4px 0 0;font-size:0.74rem;color:var(--ink-body);line-height:1.4;">${lv.subtitle}</p>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.74rem;font-weight:700;padding-top:6px;border-top:1px dashed rgba(124,79,43,0.2);">
            <span style="color:var(--wind-sky-deep);">风序: ${windsStr}</span>
            <span>${typeof best === 'number' ? `最高 ${best}/${lv.target}分` : `目标 ${lv.target}分`}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          sound.playUiClick();
          this.startLevel(idx, true);
          this.showScreen('play');
        });
        grid.appendChild(card);
      });

      root.appendChild(sec);
    });
  }

  startLevel(index, resetState = true) {
    this._stopReplayTimer();
    this.currentLevelIndex = index;
    const lv = this.levels[index];
    if (resetState || !this.state || this.state.levelId !== lv.id) {
      this.state = createInitialState(lv);
      this.activeDurationMs = 0;
      this.lastResumeTs = performance.now();
      this.cancelCountThisRun = 0;
      this._logEvent('level_start', { target: lv.target });
    }
    this.interactionMode = 'place';
    this.previewCell = null;
    this.moveSource = null;
    this.moveDest = null;
    this.hintStage = lv.stage === '新手教学' ? 1 : 0; // Automatically show friendly guide bubble on Tutorial levels
    this.replayData = null;
    this._saveProgress();
    this.renderPlayScreen();
  }

  onTileClick(r, c) {
    if (this.interactionMode === 'replay' || this.state.status !== 'playing') return;
    const cell = this.state.grid[r][c];

    if (this.interactionMode === 'move') {
      if (cell !== null) {
        this.moveSource = { r, c };
        this.moveDest = null;
        sound.playPreviewTap();
        this.renderPlayScreen();
      } else if (this.moveSource) {
        if (this.moveDest && this.moveDest.r === r && this.moveDest.c === c) {
          this.confirmAction();
          return;
        }
        this.moveDest = { r, c };
        sound.playPreviewTap();
        this.renderPlayScreen();
      }
      return;
    }

    // Placement mode
    if (cell !== null) {
      // One-tap shortcut into Move Ticket mode if player taps an existing garment
      if (this.state.tickets > 0 && countEmptyCells(this.state.grid) > 0) {
        this.interactionMode = 'move';
        this.previewCell = null;
        this.moveSource = { r, c };
        this.moveDest = null;
        sound.playPreviewTap();
        this.renderPlayScreen();
      }
      return;
    }

    // Tap empty cell once to preview wind & blocking; tap the same cell again (or click Hang button) to confirm!
    if (this.previewCell && this.previewCell.r === r && this.previewCell.c === c) {
      this.confirmAction();
      return;
    }

    this.previewCell = { r, c };
    sound.playPreviewTap();
    this._logEvent('preview_place', { at: [r, c] });
    this.renderPlayScreen();
  }

  toggleMoveTicketMode() {
    if (this.interactionMode === 'replay' || this.state.status !== 'playing') return;
    if (this.interactionMode === 'move') {
      this.interactionMode = 'place';
      this.moveSource = null;
      this.moveDest = null;
    } else if (this.state.tickets > 0 && countEmptyCells(this.state.grid) > 0) {
      this.interactionMode = 'move';
      this.previewCell = null;
      this.moveSource = null;
      this.moveDest = null;
    }
    this.renderPlayScreen();
  }

  confirmAction() {
    if (this.interactionMode === 'replay' || this.state.status !== 'playing') return;

    // 1. Move Ticket execution
    if (this.interactionMode === 'move') {
      if (!this.moveSource || !this.moveDest) return;
      const { state: nextState } = applyMoveAction(
        this.state,
        this.moveSource.r,
        this.moveSource.c,
        this.moveDest.r,
        this.moveDest.c
      );
      sound.playMoveTicket();
      this._logEvent('confirm_move', {
        from: [this.moveSource.r, this.moveSource.c],
        to: [this.moveDest.r, this.moveDest.c],
      });
      this.state = nextState;
      this.interactionMode = 'place';
      this.moveSource = null;
      this.moveDest = null;
      this._saveProgress();
      this.renderPlayScreen();
      return;
    }

    // 2. Full Board Skip
    if (isBoardFull(this.state.grid)) {
      const { state: nextState, gustTriggered } = applyPlaceOrSkipAction(this.state, {
        type: 'skip',
      });
      this._logEvent('confirm_full_skip');
      this._applyPostPlacementEffects(nextState, gustTriggered, false);
      return;
    }

    // 3. Normal Placement
    if (!this.previewCell) return;
    const itemType = this.state.queue[this.state.placedCount];
    const coords = [this.previewCell.r, this.previewCell.c];
    const { state: nextState, gustTriggered } = applyPlaceOrSkipAction(this.state, {
      type: 'place',
      at: coords,
    });
    this._logEvent('confirm_place', { at: coords, itemType });
    this._applyPostPlacementEffects(nextState, gustTriggered, itemType === 'H');
  }

  _applyPostPlacementEffects(nextState, gustTriggered, isHeavy) {
    this.previewCell = null;
    this.state = nextState;
    this.justBillowedCells.clear();

    if (gustTriggered) {
      sound.playWindGust(gustTriggered.collectedRecords.length, gustTriggered.hitRecords.length);
      this.vfx.triggerWindGustVfx(gustTriggered.windDir);

      // Spawn particle sparkles & floating score popups on every hit cell!
      gustTriggered.hitRecords.forEach((rec) => {
        const key = `${rec.r},${rec.c}`;
        this.justBillowedCells.add(key);
        const tileEl = document.getElementById(`tile-${rec.r}-${rec.c}`);
        if (tileEl) {
          this.vfx.spawnCellBurst(tileEl, rec.points, rec.collected);
        }
      });
    } else {
      sound.playHangConfirm(isHeavy);
    }

    this._saveProgress();
    this.renderPlayScreen();

    if (this.state.status !== 'playing') {
      const lv = this.levels[this.currentLevelIndex];
      const won = this.state.status === 'won';
      if (this.state.score > (this.bestScores[lv.id] ?? -1)) {
        this.bestScores[lv.id] = this.state.score;
        this._saveProgress();
      }
      this._logEvent('endgame', {
        won,
        score: this.state.score,
        target: this.state.target,
      });

      setTimeout(() => {
        sound.playEndgame(won);
        this._openEndgameModal();
      }, 620);
    }
  }

  _openEndgameModal() {
    const lv = this.levels[this.currentLevelIndex];
    const won = this.state.status === 'won';
    const stars = this._calcStars(lv, this.state.score);

    const starsEl = document.getElementById('endgame-stars');
    const headEl = document.getElementById('endgame-heading');
    const scoreEl = document.getElementById('endgame-score-line');
    const subEl = document.getElementById('endgame-sub-stats');
    const diagEl = document.getElementById('endgame-diagnosis-box');

    if (starsEl) {
      starsEl.textContent = won ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '🌧️';
    }
    if (headEl) {
      headEl.textContent = won
        ? stars === 3
          ? '清风满院 · 完美三星收衣！'
          : '阳光暖晒 · 顺利达标通关！'
        : '差一点点 · 还有湿衣留在竹架上';
    }
    if (scoreEl) {
      scoreEl.textContent = `${this.state.score} / ${this.state.target} 分`;
      scoreEl.style.color = won ? 'var(--emerald-deep)' : 'var(--crimson-warn)';
    }
    if (subEl) {
      subEl.textContent = `收走厚袄 ${this.state.collectedH} 件 (+${this.state.collectedH * 5}) · 收走薄衫 ${this.state.collectedL} 件 (+${this.state.collectedL * 2}) · 四阵得分 [${this.state.gustSummaries.map((g) => g.gustScoreGain).join(' → ')}]`;
    }

    if (diagEl) {
      const rem = diagnoseRemainingGarments(this.state);
      if (rem.length === 0) {
        diagEl.innerHTML = `<strong>✨ 全场清空！</strong> 所有挂上的衣物都借风吹干收走了，没有任何遮挡浪费。`;
      } else {
        diagEl.innerHTML = `
          <strong>🔍 留场未干衣物复盘（留场得 0 分）：</strong>
          <ul style="margin:4px 0 0;padding-left:18px;">
            ${rem
              .map(
                (r) =>
                  `<li><strong>${r.coordLabel} ${r.type === 'H' ? '厚袄' : '薄衫'}(剩湿${r.wetness})</strong>：${r.reasonText}</li>`
              )
              .join('')}
          </ul>
        `;
      }
    }

    document.getElementById('modal-endgame')?.removeAttribute('hidden');
  }

  // Witness Replay System
  startWitnessReplay() {
    this._stopReplayTimer();
    const lv = this.levels[this.currentLevelIndex];
    const { snapshots } = replayActionSequence(lv, lv.witnessActions);
    this.interactionMode = 'replay';
    this.replayData = {
      title: `达标演示（${lv.witnessScore} 分走法）`,
      snapshots,
      index: 0,
      timer: null,
    };
    this.renderPlayScreen();
    this.toggleReplayAuto(); // Immediately play smoothly so player sees the magic!
  }

  stepReplay(delta) {
    if (!this.replayData) return;
    const nextIdx = Math.max(
      0,
      Math.min(this.replayData.snapshots.length - 1, this.replayData.index + delta)
    );
    this.replayData.index = nextIdx;
    const snap = this.replayData.snapshots[nextIdx];
    this.justBillowedCells.clear();

    if (snap.gust && delta > 0) {
      sound.playWindGust(snap.gust.collectedRecords.length, snap.gust.hitRecords.length);
      this.vfx.triggerWindGustVfx(snap.gust.windDir);
      snap.gust.hitRecords.forEach((rec) => {
        this.justBillowedCells.add(`${rec.r},${rec.c}`);
        const tileEl = document.getElementById(`tile-${rec.r}-${rec.c}`);
        if (tileEl) this.vfx.spawnCellBurst(tileEl, rec.points, rec.collected);
      });
    } else if (delta > 0) {
      sound.playHangConfirm(false);
    }
    this.renderPlayScreen();
  }

  toggleReplayAuto() {
    if (!this.replayData) return;
    if (this.replayData.timer) {
      this._stopReplayTimer();
      this.renderPlayScreen();
      return;
    }
    if (this.replayData.index >= this.replayData.snapshots.length - 1) {
      this.replayData.index = 0;
    }
    this.replayData.timer = setInterval(() => {
      if (!this.replayData || this.replayData.index >= this.replayData.snapshots.length - 1) {
        this._stopReplayTimer();
        this.renderPlayScreen();
        return;
      }
      this.stepReplay(1);
    }, 880);
    this.renderPlayScreen();
  }

  _stopReplayTimer() {
    if (this.replayData?.timer) {
      clearInterval(this.replayData.timer);
      this.replayData.timer = null;
    }
  }

  // Main Play Screen Render
  renderPlayScreen() {
    const lv = this.levels[this.currentLevelIndex];
    const activeState =
      this.interactionMode === 'replay' && this.replayData
        ? this.replayData.snapshots[this.replayData.index].state
        : this.state;

    // Sync ambient wind drift direction in VFX engine
    const upcomingWind = activeState.winds[activeState.gustIndex] || 'W';
    this.vfx.setAmbientWindDirection(upcomingWind);

    // 1. HUD
    document.getElementById('hud-level-title').textContent = lv.title;
    document.getElementById('hud-level-sub').textContent = lv.subtitle;
    document.getElementById('hud-score-text').textContent = `${activeState.score} / ${activeState.target}`;
    const pct = Math.min(100, Math.round((activeState.score / Math.max(1, activeState.target)) * 100));
    document.getElementById('hud-score-bar').style.width = `${pct}%`;

    // 2. Weather Forecast Ribbon
    const ribbonEl = document.getElementById('weather-ribbon');
    ribbonEl.style.gridTemplateColumns = `repeat(${activeState.winds.length}, 1fr)`;
    ribbonEl.innerHTML = activeState.winds
      .map((wDir, idx) => {
        const meta = WIND_META[wDir];
        const isCurrent = idx === activeState.gustIndex && activeState.status === 'playing';
        const isPast = idx < activeState.gustIndex;
        const sum = activeState.gustSummaries[idx];
        const stepsLeft =
          isCurrent
            ? `差 ${activeState.gustEvery - (activeState.placedCount % activeState.gustEvery)} 件吹风`
            : sum
            ? `收 +${sum.gustScoreGain} 分`
            : `第 ${(idx + 1) * activeState.gustEvery} 件后`;

        return `
          <div class="weather-badge ${isCurrent ? 'is-upcoming' : ''} ${isPast ? 'is-past' : ''}">
            <div class="weather-wind-icon">${meta.arrow}</div>
            <div class="weather-meta">
              <span class="weather-meta-top">第 ${idx + 1} 阵 · ${stepsLeft}</span>
              <span class="weather-meta-main">${meta.name}</span>
            </div>
          </div>
        `;
      })
      .join('');

    // 3. Guide / Two-Level Hint Speech Bubble
    const bubbleEl = document.getElementById('guide-bubble');
    if (this.hintStage === 0) {
      bubbleEl.hidden = true;
    } else {
      bubbleEl.hidden = false;
      if (lv.stage === '新手教学' && this.hintStage === 1 && activeState.placedCount === 0) {
        bubbleEl.innerHTML = `<strong>🌱 庭院引导：</strong>${lv.focus}（再点一次上方“💡提示”可查看实时盘面诊断）`;
      } else {
        const hints = generateTwoLevelHints(activeState);
        bubbleEl.innerHTML =
          this.hintStage === 1
            ? `${hints.level1} <span style="color:var(--wind-sky-deep);font-weight:700;">（再点“💡提示”看行列建议）</span>`
            : `<div>${hints.level1}</div><div style="margin-top:4px;padding-top:4px;border-top:1px dashed rgba(26,163,200,0.35);">${hints.level2}</div>`;
      }
    }

    // 4. Courtyard 3x3 Tiles + Edge Wind Stream Indicators
    let previewAction = null;
    if (this.interactionMode === 'place' && this.previewCell) {
      previewAction = { type: 'place', r: this.previewCell.r, c: this.previewCell.c };
    } else if (this.interactionMode === 'move' && this.moveSource && this.moveDest) {
      previewAction = {
        type: 'move',
        fromR: this.moveSource.r,
        fromC: this.moveSource.c,
        toR: this.moveDest.r,
        toC: this.moveDest.c,
      };
    }

    const { tempGrid, currentWind, forecast } = previewActionForecast(activeState, previewAction);

    ['N', 'S', 'W', 'E'].forEach((dir) => {
      const edgeEl = document.getElementById(`edge-${dir.toLowerCase()}`);
      if (!edgeEl) return;
      const isActiveSide = currentWind === dir && activeState.status === 'playing';
      const arrow = WIND_META[dir].arrow;
      edgeEl.innerHTML = [0, 1, 2]
        .map((lineIdx) => {
          if (!isActiveSide) return `<span class="wind-lane-pill"></span>`;
          const hasTarget = !forecast.emptyScanlines.includes(lineIdx);
          return `<span class="wind-lane-pill ${
            hasTarget ? 'is-active-lane' : 'is-empty-lane'
          }">${arrow}</span>`;
        })
        .join('');
    });

    const gridEl = document.getElementById('courtyard-grid');
    gridEl.innerHTML = '';

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cellData = tempGrid[r][c];
        const fInfo = forecast.cellMap[`${r},${c}`];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = `tile-${r}-${c}`;
        btn.className = 'courtyard-tile';
        btn.setAttribute('aria-label', `第 ${r + 1} 行第 ${c + 1} 列`);

        const isPreviewSpot =
          (this.previewCell && this.previewCell.r === r && this.previewCell.c === c) ||
          (this.moveDest && this.moveDest.r === r && this.moveDest.c === c);

        if (isPreviewSpot) btn.classList.add('is-preview-cell');
        if (this.moveSource && this.moveSource.r === r && this.moveSource.c === c) {
          btn.classList.add('is-move-origin');
        }

        if (fInfo && activeState.status === 'playing') {
          if (fInfo.status === 'collect') btn.classList.add('forecast-collect');
          else if (fInfo.status === 'hit') btn.classList.add('forecast-hit');
        }

        let tileHtml = '';
        if (cellData) {
          const drops = '💧'.repeat(cellData.wetness);
          const billowClass = this.justBillowedCells.has(`${r},${c}`) ? 'billow-gust' : '';
          let pillHtml = '';
          if (fInfo && activeState.status === 'playing') {
            if (fInfo.status === 'collect') {
              pillHtml = `<span class="tile-forecast-pill pill-collect">🌬 本阵吹干 +${fInfo.detail.pointsGained}分</span>`;
            } else if (fInfo.status === 'hit') {
              pillHtml = `<span class="tile-forecast-pill pill-hit">🌬 迎风减湿 ${cellData.wetness}→${fInfo.detail.newWetness}</span>`;
            } else if (fInfo.status === 'blocked') {
              const b = fInfo.detail.blockedBy;
              pillHtml = `<span class="tile-forecast-pill pill-blocked">🛡 被前排挡风</span>`;
            }
          }

          tileHtml = `
            <span class="wetness-droplets-badge">${drops} ${cellData.wetness}</span>
            <div class="garment-sprite-wrap ${cellData.type === 'H' ? 'is-heavy' : ''} ${
            cellData.isPreview ? 'is-ghost-preview' : ''
          } ${billowClass}">
              ${renderIllustratedGarmentSvg(cellData.type, cellData.wetness)}
            </div>
            ${pillHtml}
          `;
        }

        btn.innerHTML = tileHtml;
        btn.addEventListener('click', () => this.onTileClick(r, c));
        gridEl.appendChild(btn);
      }
    }

    // 5. Action Dock & Laundry Basket Queue
    this._renderDockAndQueue(lv, activeState);
  }

  _renderDockAndQueue(lv, activeState) {
    const normalBtns = document.getElementById('dock-normal-btns');
    const replayBtns = document.getElementById('dock-replay-btns');
    const promptEl = document.getElementById('dock-prompt-text');
    const confirmBtn = document.getElementById('btn-confirm-hang');
    const cancelBtn = document.getElementById('btn-cancel-preview');
    const ticketBtn = document.getElementById('btn-use-ticket');

    if (this.interactionMode === 'replay' && this.replayData) {
      normalBtns.hidden = true;
      replayBtns.hidden = false;
      const snap = this.replayData.snapshots[this.replayData.index];
      promptEl.innerHTML = `🎬 <strong>${this.replayData.title}</strong> · 第 ${this.replayData.index}/${this.replayData.snapshots.length - 1} 步：${snap.label}`;
      document.getElementById('btn-replay-auto').textContent = this.replayData.timer
        ? '⏸ 暂停'
        : '▶ 自动播放';
    } else {
      normalBtns.hidden = false;
      replayBtns.hidden = true;

      if (activeState.status !== 'playing') {
        promptEl.innerHTML =
          activeState.status === 'won'
            ? `🎉 <strong>本关已达标（${activeState.score} 分）！</strong> 可点击“重开”挑战更高星级或前往下一关。`
            : `⛅ <strong>本局结束（${activeState.score}/${activeState.target} 分）</strong> · 点“🎬 演示”可学习过关走法。`;
        confirmBtn.disabled = true;
        confirmBtn.textContent = '本局已结束';
        cancelBtn.disabled = true;
        ticketBtn.disabled = true;
      } else if (this.interactionMode === 'move') {
        if (!this.moveSource) {
          promptEl.innerHTML = `🎫 <strong>挪位模式</strong>：请点击竹架上要移动的一件衣物（不消耗步数）`;
          confirmBtn.disabled = true;
        } else if (!this.moveDest) {
          promptEl.innerHTML = `🎫 已选 <strong>(${this.moveSource.r + 1},${this.moveSource.c + 1})</strong>，请点击目标空竹竿预览`;
          confirmBtn.disabled = true;
        } else {
          promptEl.innerHTML = `🎫 再次点击目标格或按右侧按钮，确认移至 <strong>(${this.moveDest.r + 1},${this.moveDest.c + 1})</strong>`;
          confirmBtn.disabled = false;
        }
        confirmBtn.textContent = '🎫 确认挪位 (-1券)';
        cancelBtn.disabled = false;
        ticketBtn.textContent = '退出挪位';
        ticketBtn.disabled = false;
      } else if (isBoardFull(activeState.grid)) {
        promptEl.innerHTML = `⚠️ <strong>9 格竹架已满</strong>：本件放不下，确认跳过（得 0 分，仍计 1 次挂衣以招来阵风）`;
        confirmBtn.disabled = false;
        confirmBtn.textContent = '跳过本件';
        cancelBtn.disabled = true;
      } else {
        const curType = activeState.queue[activeState.placedCount];
        const curName = curType === 'H' ? '🧥 绞花厚袄 (+5分·需2风)' : '👕 亚麻薄衫 (+2分·需1风)';
        if (this.previewCell) {
          const stepsLeft =
            activeState.gustEvery - (activeState.placedCount % activeState.gustEvery);
          const windMeta = WIND_META[activeState.winds[activeState.gustIndex]];
          promptEl.innerHTML = `📌 已预览挂在 <strong>(${this.previewCell.r + 1},${this.previewCell.c + 1})</strong> · 再次点击该格或按右侧按钮挂好`;
          confirmBtn.disabled = false;
          confirmBtn.textContent =
            stepsLeft === 1 ? `📌 挂好并吹${windMeta.name}!` : '📌 挂上竹竿';
          cancelBtn.disabled = false;
        } else {
          promptEl.innerHTML = `🧺 待挂第 <strong>${activeState.placedCount + 1}/${activeState.queue.length}</strong> 件：<strong>${curName}</strong>`;
          confirmBtn.disabled = true;
          confirmBtn.textContent = '点空格预览 → 挂好';
          cancelBtn.disabled = true;
        }
        const canUseTicket =
          activeState.tickets > 0 &&
          countEmptyCells(activeState.grid) > 0 &&
          countEmptyCells(activeState.grid) < 9;
        ticketBtn.disabled = !canUseTicket;
        ticketBtn.textContent = `🎫 挪位券 (${activeState.tickets})`;
      }
    }

    // Basket Queue Strip
    const basketEl = document.getElementById('basket-queue-strip');
    const gustEvery = activeState.gustEvery;
    const rounds = Math.ceil(activeState.queue.length / gustEvery);
    basketEl.style.gridTemplateColumns = rounds <= 2 ? `repeat(${rounds}, 1fr)` : '';

    let html = '';
    for (let b = 0; b < rounds; b++) {
      const start = b * gustEvery;
      const end = Math.min(activeState.queue.length, start + gustEvery);
      const wDir = activeState.winds[b];
      const wMeta = WIND_META[wDir];
      const isCurRound = b === activeState.gustIndex && activeState.status === 'playing';

      let itemsHtml = '';
      for (let i = start; i < end; i++) {
        const t = activeState.queue[i];
        const done = i < activeState.placedCount;
        const now = i === activeState.placedCount && activeState.status === 'playing';
        itemsHtml += `
          <div class="mini-garment-card type-${t} ${done ? 'is-done' : ''} ${now ? 'is-now' : ''}">
            <span>${t === 'H' ? '🧥厚袄' : '👕薄衫'}</span>
            <span style="font-size:0.6rem;opacity:0.8;">${t === 'H' ? '2💧 +5' : '1💧 +2'}</span>
          </div>
        `;
      }

      html += `
        <div class="basket-round-box ${isCurRound ? 'is-current-round' : ''}">
          <div class="basket-round-head">
            <span>第 ${b + 1} 轮衣篮</span>
            <span style="color:var(--wind-sky-deep);">${wMeta ? `吹${wMeta.name}${wMeta.arrow}` : ''}</span>
          </div>
          <div class="basket-mini-items">${itemsHtml}</div>
        </div>
      `;
    }
    basketEl.innerHTML = html;
  }

  _renderRecapModal() {
    const box = document.getElementById('recap-gust-list');
    if (!box) return;
    const s = this.state;
    let html = `<div><strong>当前用时：</strong>${this._fgSec()} 秒 ｜ <strong>取消预览：</strong>${this.cancelCountThisRun} 次 ｜ <strong>重开次数：</strong>${this.retryCounts[s.levelId] || 0} 次</div>`;

    if (s.gustSummaries.length === 0) {
      html += `<div style="color:var(--ink-body);margin-top:6px;">本局尚未触发阵风结算。</div>`;
    } else {
      s.gustSummaries.forEach((g) => {
        const hits =
          g.hitRecords.length > 0
            ? g.hitRecords
                .map(
                  (h) =>
                    `(${h.r + 1},${h.c + 1})${h.type === 'H' ? '厚袄' : '薄衫'}[${h.beforeWet}→${h.afterWet}${
                      h.collected ? ` 收+${h.points}` : ''
                    }]`
                )
                .join('、')
            : '无受风衣物';
        const blocked =
          g.blockedRecords.length > 0
            ? g.blockedRecords
                .map((b) => `(${b.r + 1},${b.c + 1})被(${b.blockedBy.r + 1},${b.blockedBy.c + 1})挡住`)
                .join('、')
            : '无遮挡';
        html += `
          <div style="padding-top:8px;border-top:1px dashed rgba(124,79,43,0.25);">
            <strong>第 ${g.gustNumber} 阵 · ${g.windName}${g.windArrow}（本阵 +${g.gustScoreGain} 分 / 累计 ${g.totalScoreAfter} 分）</strong><br/>
            <span>迎风命中：${hits}</span><br/>
            <span style="color:var(--ink-muted);">前排遮挡：${blocked}</span>
          </div>
        `;
      });
    }
    box.innerHTML = html;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new CommercialJggoGame();
});
