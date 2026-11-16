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

const STORAGE_KEY = 'jggo_v0_1_session';

// Distinct Dual-Encoded Garment SVGs (Silhouette + Pattern, not relying on color alone)
function getGarmentSvg(type) {
  if (type === 'L') {
    // Light Garment (L): Breezy short-sleeve linen T-shirt silhouette
    return `<svg class="garment-svg" viewBox="0 0 48 42" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 6 L8 12 L12 19 L16 16 L16 36 L32 36 L32 16 L36 19 L40 12 L33 6 C30 9.5 18 9.5 15 6 Z" fill="currentColor" fill-opacity="0.14"/>
      <path d="M20 15 H28" stroke-dasharray="2 2"/>
    </svg>`;
  }
  // Heavy Garment (H): Thick quilted winter coat / sweater with collar & double hem
  return `<svg class="garment-svg" viewBox="0 0 48 42" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14 5 L5 14 L9 24 L14 20 L14 37 L34 37 L34 20 L39 24 L43 14 L34 5 L28 9 L24 6 L20 9 Z" fill="currentColor" fill-opacity="0.22"/>
    <line x1="24" y1="9" x2="24" y2="37"/>
    <line x1="16" y1="26" x2="32" y2="26"/>
  </svg>`;
}

class JggoGameApp {
  constructor() {
    this.levels = LEVELS;
    this.currentLevelIndex = 3; // Default to L1 (Section 08 Standard Walkthrough Level), tutorials T1-T3 at 0..2
    this.state = null;

    // UI Interaction Mode:
    // - 'place': waiting to select empty cell for current queue garment
    // - 'move': selecting occupied cell (from) and empty cell (to) for Move Ticket
    // - 'replay': stepping through witness or completed run snapshots
    this.interactionMode = 'place';
    this.previewCell = null; // { r, c } for placement
    this.moveSource = null;  // { r, c } for move ticket
    this.moveDest = null;    // { r, c } for move ticket
    this.hintStage = 0;      // 0: hidden, 1: Level 1 hint, 2: Level 1 + Level 2 hint
    this.isAnimatingGust = false;

    // Replay state
    this.replayData = null; // { title, snapshots, index, timer }

    // Persistence & Telemetry (Section 11 & 13)
    this.bestScores = {};
    this.lastRunSummaries = {};
    this.retryCounts = {};
    this.telemetryEvents = [];
    this.cancelCountThisRun = 0;
    this.activeDurationMs = 0;
    this.lastResumeTimestamp = null;

    this._loadSession();
    this._setupLifecycleListeners();
    this._bindStaticElements();
    this.loadLevel(this.currentLevelIndex, false);
  }

  _loadSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === '0.1') {
        this.bestScores = parsed.bestScores || {};
        this.lastRunSummaries = parsed.lastRunSummaries || {};
        this.retryCounts = parsed.retryCounts || {};
        if (typeof parsed.currentLevelIndex === 'number' && this.levels[parsed.currentLevelIndex]) {
          this.currentLevelIndex = parsed.currentLevelIndex;
        }
        if (parsed.savedState && parsed.savedState.levelId === this.levels[this.currentLevelIndex].id) {
          this.state = parsed.savedState;
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  _saveSession() {
    try {
      const payload = {
        version: '0.1',
        currentLevelIndex: this.currentLevelIndex,
        bestScores: this.bestScores,
        lastRunSummaries: this.lastRunSummaries,
        retryCounts: this.retryCounts,
        savedState: this.state,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Ignore storage errors
    }
  }

  _setupLifecycleListeners() {
    this.lastResumeTimestamp = performance.now();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.lastResumeTimestamp !== null && this.state?.status === 'playing') {
          this.activeDurationMs += performance.now() - this.lastResumeTimestamp;
        }
        this.lastResumeTimestamp = null;
        this._stopReplayTimer();
        this._recordTelemetry('visibility_pause');
      } else {
        this.lastResumeTimestamp = performance.now();
        this._recordTelemetry('visibility_resume');
      }
    });
  }

  _getForegroundSeconds() {
    let total = this.activeDurationMs;
    if (this.lastResumeTimestamp !== null && this.state?.status === 'playing') {
      total += performance.now() - this.lastResumeTimestamp;
    }
    return Math.round(total / 100) / 10;
  }

  _recordTelemetry(eventType, detail = {}) {
    const lv = this.levels[this.currentLevelIndex];
    this.telemetryEvents.push({
      ts: new Date().toISOString(),
      levelId: lv?.id || 'unknown',
      version: 'v0.1',
      fgSec: this._getForegroundSeconds(),
      eventType,
      ...detail,
    });
    if (this.telemetryEvents.length > 300) {
      this.telemetryEvents.shift();
    }
  }

  _bindStaticElements() {
    // Header buttons
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      const html = document.documentElement;
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      const label = document.getElementById('theme-toggle-label');
      if (label) label.textContent = next === 'dark' ? '日间庭院' : '夜间模式';
    });

    document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
      const on = sound.toggle();
      const btn = document.getElementById('btn-audio-toggle');
      if (btn) btn.textContent = on ? '音效：开' : '音效：关';
    });

    document.getElementById('btn-open-rules')?.addEventListener('click', () => {
      document.getElementById('modal-rules')?.removeAttribute('hidden');
    });

    document.getElementById('btn-close-rules')?.addEventListener('click', () => {
      document.getElementById('modal-rules')?.setAttribute('hidden', '');
    });

    document.getElementById('btn-open-telemetry')?.addEventListener('click', () => {
      this._renderTelemetryModal();
      document.getElementById('modal-telemetry')?.removeAttribute('hidden');
    });

    document.getElementById('btn-close-telemetry')?.addEventListener('click', () => {
      document.getElementById('modal-telemetry')?.setAttribute('hidden', '');
    });

    document.getElementById('btn-export-telemetry')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.telemetryEvents, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jggo-telemetry-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Primary game controls
    document.getElementById('btn-confirm-action')?.addEventListener('click', () => {
      this.confirmCurrentAction();
    });

    document.getElementById('btn-cancel-action')?.addEventListener('click', () => {
      this.cancelCurrentPreview(true);
    });

    document.getElementById('btn-toggle-move')?.addEventListener('click', () => {
      this.toggleMoveMode();
    });

    document.getElementById('btn-Restart-level')?.addEventListener('click', () => {
      this.restartLevel(true);
    });

    document.getElementById('btn-step-hint')?.addEventListener('click', () => {
      this.advanceHintStage();
    });

    document.getElementById('btn-watch-witness')?.addEventListener('click', () => {
      this.startWitnessReplay();
    });

    // Replay controls
    document.getElementById('btn-replay-prev')?.addEventListener('click', () => {
      this.stepReplay(-1);
    });
    document.getElementById('btn-replay-next')?.addEventListener('click', () => {
      this.stepReplay(1);
    });
    document.getElementById('btn-replay-auto')?.addEventListener('click', () => {
      this.toggleReplayAuto();
    });
    document.getElementById('btn-replay-exit')?.addEventListener('click', () => {
      this.exitReplayMode();
    });
  }

  loadLevel(index, forceReset = true) {
    this._stopReplayTimer();
    this.currentLevelIndex = index;
    const lv = this.levels[index];
    if (forceReset || !this.state || this.state.levelId !== lv.id) {
      this.state = createInitialState(lv);
      this.activeDurationMs = 0;
      this.lastResumeTimestamp = performance.now();
      this.cancelCountThisRun = 0;
      this._recordTelemetry('level_start', { target: lv.target });
    }
    this.interactionMode = 'place';
    this.previewCell = null;
    this.moveSource = null;
    this.moveDest = null;
    this.hintStage = 0;
    this.replayData = null;
    this._saveSession();
    this.renderAll();
  }

  restartLevel(isUserRetry = true) {
    const lv = this.levels[this.currentLevelIndex];
    if (isUserRetry) {
      this.retryCounts[lv.id] = (this.retryCounts[lv.id] || 0) + 1;
      this._recordTelemetry('manual_restart', {
        prevScore: this.state?.score || 0,
        placedCount: this.state?.placedCount || 0,
        retryCount: this.retryCounts[lv.id],
      });
    }
    this.loadLevel(this.currentLevelIndex, true);
  }

  onCellClick(r, c) {
    if (this.isAnimatingGust || this.interactionMode === 'replay') return;
    if (this.state.status !== 'playing') return;

    const cell = this.state.grid[r][c];

    if (this.interactionMode === 'move') {
      if (cell !== null) {
        // Select or switch move source garment
        this.moveSource = { r, c };
        this.moveDest = null;
        sound.playPreviewTap();
        this._recordTelemetry('preview_move_source', { from: [r, c], type: cell.type });
        this.renderAll();
      } else if (this.moveSource) {
        // Select destination empty cell for move
        this.moveDest = { r, c };
        sound.playPreviewTap();
        this._recordTelemetry('preview_move_dest', {
          from: [this.moveSource.r, this.moveSource.c],
          to: [r, c],
        });
        this.renderAll();
      }
      return;
    }

    // Placement mode:
    if (cell !== null) {
      // Convenience: if player clicks an existing garment and has tickets & empty space, offer to enter move mode
      if (this.state.tickets > 0 && countEmptyCells(this.state.grid) > 0) {
        this.interactionMode = 'move';
        this.previewCell = null;
        this.moveSource = { r, c };
        this.moveDest = null;
        sound.playPreviewTap();
        this._recordTelemetry('preview_move_source', { from: [r, c], type: cell.type });
        this.renderAll();
      }
      return;
    }

    // Toggle or set preview cell for placement
    if (this.previewCell && this.previewCell.r === r && this.previewCell.c === c) {
      // Double-tap / second click on already previewed cell confirms immediately for frictionless mobile UX,
      // while the explicit "挂好" button is also right below!
      this.confirmCurrentAction();
      return;
    }

    this.previewCell = { r, c };
    sound.playPreviewTap();
    this._recordTelemetry('preview_place', {
      at: [r, c],
      itemType: this.state.queue[this.state.placedCount],
    });
    this.renderAll();
  }

  toggleMoveMode() {
    if (this.interactionMode === 'replay' || this.state.status !== 'playing') return;
    if (this.interactionMode === 'move') {
      this.interactionMode = 'place';
      this.moveSource = null;
      this.moveDest = null;
    } else {
      if (this.state.tickets <= 0 || countEmptyCells(this.state.grid) === 0) return;
      this.interactionMode = 'move';
      this.previewCell = null;
      this.moveSource = null;
      this.moveDest = null;
    }
    this.renderAll();
  }

  cancelCurrentPreview(countAsCancel = true) {
    if (this.previewCell || this.moveSource || this.moveDest || this.interactionMode === 'move') {
      if (countAsCancel) {
        this.cancelCountThisRun += 1;
        this._recordTelemetry('cancel_preview', {
          mode: this.interactionMode,
          cancelCountThisRun: this.cancelCountThisRun,
        });
      }
      this.interactionMode = 'place';
      this.previewCell = null;
      this.moveSource = null;
      this.moveDest = null;
      this.renderAll();
    }
  }

  confirmCurrentAction() {
    if (this.isAnimatingGust || this.interactionMode === 'replay') return;
    if (this.state.status !== 'playing') return;

    // 1. Move Ticket confirmation
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
      this._recordTelemetry('confirm_move', {
        from: [this.moveSource.r, this.moveSource.c],
        to: [this.moveDest.r, this.moveDest.c],
        ticketsRemaining: nextState.tickets,
      });
      this.state = nextState;
      this.interactionMode = 'place';
      this.moveSource = null;
      this.moveDest = null;
      this._saveSession();
      this.renderAll();
      return;
    }

    // 2. Full Board Skip confirmation
    if (isBoardFull(this.state.grid)) {
      const { state: nextState, gustTriggered } = applyPlaceOrSkipAction(this.state, {
        type: 'skip',
      });
      this._recordTelemetry('confirm_full_skip', {
        placedCount: nextState.placedCount,
      });
      this._handlePostPlaceState(nextState, gustTriggered, false);
      return;
    }

    // 3. Standard Garment Placement confirmation
    if (!this.previewCell) return;
    const itemType = this.state.queue[this.state.placedCount];
    const coords = [this.previewCell.r, this.previewCell.c];
    const { state: nextState, gustTriggered } = applyPlaceOrSkipAction(this.state, {
      type: 'place',
      at: coords,
    });

    this._recordTelemetry('confirm_place', {
      at: coords,
      itemType,
      placedCount: nextState.placedCount,
    });

    this._handlePostPlaceState(nextState, gustTriggered, itemType === 'H');
  }

  _handlePostPlaceState(nextState, gustTriggered, isHeavy) {
    this.previewCell = null;
    this.state = nextState;

    if (gustTriggered) {
      sound.playWindGust(gustTriggered.collectedRecords.length);
      this._recordTelemetry('gust_resolved', {
        gustNumber: gustTriggered.gustNumber,
        windDir: gustTriggered.windDir,
        gustScoreGain: gustTriggered.gustScoreGain,
        totalScoreAfter: gustTriggered.totalScoreAfter,
      });
      const boardEl = document.getElementById('drying-grid');
      if (boardEl) {
        boardEl.classList.remove('animate-gust');
        void boardEl.offsetWidth;
        boardEl.classList.add('animate-gust');
      }
    } else {
      sound.playHangConfirm(isHeavy);
    }

    if (this.state.status !== 'playing') {
      const lv = this.levels[this.currentLevelIndex];
      const won = this.state.status === 'won';
      sound.playEndgame(won);
      const prevBest = this.bestScores[lv.id] ?? 0;
      if (this.state.score > prevBest) {
        this.bestScores[lv.id] = this.state.score;
      }
      this.lastRunSummaries[lv.id] = {
        score: this.state.score,
        target: this.state.target,
        won,
        collectedH: this.state.collectedH,
        collectedL: this.state.collectedL,
        gustGains: this.state.gustSummaries.map((g) => g.gustScoreGain),
        fgSec: this._getForegroundSeconds(),
        cancelCount: this.cancelCountThisRun,
      };
      this._recordTelemetry('endgame', {
        status: this.state.status,
        score: this.state.score,
        target: this.state.target,
        cancelCount: this.cancelCountThisRun,
      });
    }

    this._saveSession();
    this.renderAll();
  }

  advanceHintStage() {
    this.hintStage = (this.hintStage + 1) % 3;
    this._recordTelemetry('toggle_hint', { hintStage: this.hintStage });
    this.renderAll();
  }

  // Witness & Run Replay System
  startWitnessReplay() {
    this._stopReplayTimer();
    const lv = this.levels[this.currentLevelIndex];
    const { snapshots } = replayActionSequence(lv, lv.witnessActions);
    this.interactionMode = 'replay';
    this.replayData = {
      title: `达标见证演示（${lv.witnessScore} 分 / 目标 ${lv.target} 分）`,
      snapshots,
      index: 0,
      timer: null,
    };
    this._recordTelemetry('start_witness_replay');
    this.renderAll();
  }

  startPlayerRunReplay() {
    if (!this.state?.actionLog?.length) return;
    this._stopReplayTimer();
    const lv = this.levels[this.currentLevelIndex];
    const { snapshots } = replayActionSequence(lv, this.state.actionLog);
    this.interactionMode = 'replay';
    this.replayData = {
      title: `本局动作回放（共 ${snapshots.length - 1} 步）`,
      snapshots,
      index: 0,
      timer: null,
    };
    this.renderAll();
  }

  stepReplay(delta) {
    if (!this.replayData) return;
    const nextIdx = Math.max(
      0,
      Math.min(this.replayData.snapshots.length - 1, this.replayData.index + delta)
    );
    this.replayData.index = nextIdx;
    const snap = this.replayData.snapshots[nextIdx];
    if (snap.gust) {
      sound.playWindGust(snap.gust.collectedRecords.length);
    } else if (delta > 0) {
      sound.playPreviewTap();
    }
    this.renderAll();
  }

  toggleReplayAuto() {
    if (!this.replayData) return;
    if (this.replayData.timer) {
      this._stopReplayTimer();
      this.renderAll();
      return;
    }
    if (this.replayData.index >= this.replayData.snapshots.length - 1) {
      this.replayData.index = 0;
    }
    this.replayData.timer = setInterval(() => {
      if (!this.replayData || this.replayData.index >= this.replayData.snapshots.length - 1) {
        this._stopReplayTimer();
        this.renderAll();
        return;
      }
      this.stepReplay(1);
    }, 850);
    this.renderAll();
  }

  _stopReplayTimer() {
    if (this.replayData?.timer) {
      clearInterval(this.replayData.timer);
      this.replayData.timer = null;
    }
  }

  exitReplayMode() {
    this._stopReplayTimer();
    this.interactionMode = 'place';
    this.replayData = null;
    this.renderAll();
  }

  // Rendering Methods
  renderAll() {
    const lv = this.levels[this.currentLevelIndex];
    const activeState =
      this.interactionMode === 'replay' && this.replayData
        ? this.replayData.snapshots[this.replayData.index].state
        : this.state;

    this._renderLevelHeaderAndKPIs(lv, activeState);
    this._renderWindTrack(lv, activeState);
    this._renderBoardAndCompass(lv, activeState);
    this._renderActionBar(lv, activeState);
    this._renderQueuePanel(lv, activeState);
    this._renderLevelList();
    this._renderHintsAndDiagnostics(lv, activeState);
  }

  _renderLevelHeaderAndKPIs(lv, activeState) {
    const titleEl = document.getElementById('current-level-title');
    const focusEl = document.getElementById('current-level-focus');
    if (titleEl) titleEl.textContent = `${lv.title}`;
    if (focusEl) focusEl.textContent = `${lv.subtitle} —— ${lv.focus}`;

    const scoreEl = document.getElementById('kpi-score');
    const scoreSubEl = document.getElementById('kpi-score-sub');
    const targetEl = document.getElementById('kpi-target');
    const placedEl = document.getElementById('kpi-placed');
    const ticketsEl = document.getElementById('kpi-tickets');

    if (scoreEl) scoreEl.textContent = `${activeState.score}`;
    if (scoreSubEl) {
      scoreSubEl.textContent = `${activeState.collectedH}厚×5 + ${activeState.collectedL}薄×2`;
    }
    if (targetEl) targetEl.textContent = `${activeState.target}`;
    if (placedEl) placedEl.textContent = `${activeState.placedCount}/${activeState.queue.length}`;
    if (ticketsEl) ticketsEl.textContent = `${activeState.tickets}`;
  }

  _renderWindTrack(lv, activeState) {
    const container = document.getElementById('wind-track');
    if (!container) return;
    container.innerHTML = '';

    activeState.winds.forEach((wDir, idx) => {
      const meta = WIND_META[wDir];
      const slot = document.createElement('div');
      slot.className = 'wind-slot';
      if (idx === activeState.gustIndex && activeState.status === 'playing') {
        slot.classList.add('is-current');
      } else if (idx < activeState.gustIndex) {
        slot.classList.add('is-done');
      }
      const triggerStep = (idx + 1) * activeState.gustEvery;
      const summary = activeState.gustSummaries[idx];
      const resultText = summary ? `已收 +${summary.gustScoreGain}分` : `第 ${triggerStep} 件后`;

      slot.innerHTML = `
        <span class="wind-slot-index">第 ${idx + 1} 阵</span>
        <span class="wind-slot-dir">${meta.name} ${meta.arrow}</span>
        <span class="wind-slot-trigger">${resultText}</span>
      `;
      container.appendChild(slot);
    });
  }

  _renderBoardAndCompass(lv, activeState) {
    // Determine preview action if in playing mode
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

    // Update 4-edge compass arrows
    const edges = ['N', 'S', 'W', 'E'];
    edges.forEach((dir) => {
      const edgeEl = document.getElementById(`compass-${dir.toLowerCase()}`);
      if (!edgeEl) return;
      const isCurrent = currentWind === dir && activeState.status === 'playing';
      const arrowChar = WIND_META[dir].arrow;
      edgeEl.innerHTML = [0, 1, 2]
        .map((lineIdx) => {
          const isScanHit =
            isCurrent && !forecast.emptyScanlines.includes(lineIdx);
          return `<span class="scan-arrow ${isCurrent ? 'active-wind' : ''}" title="${
            WIND_META[dir].name
          }扫描线 ${lineIdx + 1}">${ isScanHit ? arrowChar : '·' }</span>`;
        })
        .join('');
    });

    // Render 3x3 cells
    const gridEl = document.getElementById('drying-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cellData = tempGrid[r][c];
        const cellInfo = forecast.cellMap[`${r},${c}`];
        const cellBtn = document.createElement('button');
        cellBtn.type = 'button';
        cellBtn.id = `cell-${r}-${c}`;
        cellBtn.className = 'grid-cell';
        cellBtn.setAttribute('aria-label', `第 ${r + 1} 行第 ${c + 1} 列`);

        if (
          (this.previewCell && this.previewCell.r === r && this.previewCell.c === c) ||
          (this.moveDest && this.moveDest.r === r && this.moveDest.c === c)
        ) {
          cellBtn.classList.add('is-preview-target');
        }
        if (this.moveSource && this.moveSource.r === r && this.moveSource.c === c) {
          cellBtn.classList.add('is-move-source');
        }

        if (cellInfo && activeState.status === 'playing') {
          if (cellInfo.status === 'collect') {
            cellBtn.classList.add('will-dry-now');
          } else if (cellInfo.status === 'hit') {
            cellBtn.classList.add('will-be-hit');
          }
        }

        let innerHtml = `<span class="cell-coord">(${r + 1},${c + 1})</span>`;

        if (cellData) {
          const gMeta = GARMENT_META[cellData.type];
          const drops = '💧'.repeat(cellData.wetness);
          let forecastBadge = '';
          if (cellInfo && activeState.status === 'playing') {
            if (cellInfo.status === 'collect') {
              forecastBadge = `<span class="wind-forecast-tag tag-collect">本阵收走 +${cellInfo.detail.pointsGained}分</span>`;
            } else if (cellInfo.status === 'hit') {
              forecastBadge = `<span class="wind-forecast-tag tag-hit">本阵受风 ${cellData.wetness}→${cellInfo.detail.newWetness}</span>`;
            } else if (cellInfo.status === 'blocked') {
              const b = cellInfo.detail.blockedBy;
              forecastBadge = `<span class="wind-forecast-tag tag-blocked">被(${b.r + 1},${b.c + 1})挡风</span>`;
            }
          }

          innerHtml += `
            <div class="garment-token type-${cellData.type} ${cellData.isPreview ? 'is-ghost' : ''}">
              ${getGarmentSvg(cellData.type)}
              <div class="garment-meta">
                <span>${gMeta.badge}</span>
                <span class="wetness-pill">湿${cellData.wetness} ${drops}</span>
              </div>
              ${forecastBadge}
            </div>
          `;
        }

        cellBtn.innerHTML = innerHtml;
        cellBtn.addEventListener('click', () => this.onCellClick(r, c));
        gridEl.appendChild(cellBtn);
      }
    }
  }

  _renderActionBar(lv, activeState) {
    const normalBar = document.getElementById('normal-action-controls');
    const replayBar = document.getElementById('replay-action-controls');
    const statusTextEl = document.getElementById('action-status-text');
    const confirmBtn = document.getElementById('btn-confirm-action');
    const cancelBtn = document.getElementById('btn-cancel-action');
    const moveBtn = document.getElementById('btn-toggle-move');

    if (this.interactionMode === 'replay' && this.replayData) {
      if (normalBar) normalBar.hidden = true;
      if (replayBar) replayBar.hidden = false;
      const snap = this.replayData.snapshots[this.replayData.index];
      if (statusTextEl) {
        statusTextEl.innerHTML = `<strong>${this.replayData.title}</strong> <span>步骤 ${this.replayData.index}/${this.replayData.snapshots.length - 1}：${snap.label}</span>`;
      }
      const autoBtn = document.getElementById('btn-replay-auto');
      if (autoBtn) {
        autoBtn.textContent = this.replayData.timer ? '暂停播放' : '自动播放';
      }
      return;
    }

    if (normalBar) normalBar.hidden = false;
    if (replayBar) replayBar.hidden = true;

    if (activeState.status !== 'playing') {
      const won = activeState.status === 'won';
      if (statusTextEl) {
        statusTextEl.innerHTML = won
          ? `<strong style="color: var(--dry-green);">🎉 本局达标！收衣总分 ${activeState.score} 分（目标 ${activeState.target} 分）</strong>`
          : `<strong style="color: var(--danger-red);">本局结束：收衣总分 ${activeState.score} 分（未达目标 ${activeState.target} 分）</strong>`;
      }
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '本局已结束';
      }
      if (cancelBtn) cancelBtn.disabled = true;
      if (moveBtn) moveBtn.disabled = true;
      return;
    }

    const currentItemType = activeState.queue[activeState.placedCount];
    const itemMeta = GARMENT_META[currentItemType];
    const stepsUntilWind =
      activeState.gustEvery - (activeState.placedCount % activeState.gustEvery);
    const windDir = activeState.winds[activeState.gustIndex];
    const windMeta = WIND_META[windDir];

    if (this.interactionMode === 'move') {
      if (!this.moveSource) {
        statusTextEl.innerHTML = `<span><strong>挪位模式</strong>：请先点击晒场上的一件在场衣物（剩余 ${activeState.tickets} 券）</span>`;
        confirmBtn.disabled = true;
        confirmBtn.textContent = '确认挪位 (-1 券)';
      } else if (!this.moveDest) {
        statusTextEl.innerHTML = `<span>已选 <strong>(${this.moveSource.r + 1},${this.moveSource.c + 1})</strong>，请点击目标空格预览挪位</span>`;
        confirmBtn.disabled = true;
        confirmBtn.textContent = '确认挪位 (-1 券)';
      } else {
        statusTextEl.innerHTML = `<span>预览挪位：<strong>(${this.moveSource.r + 1},${this.moveSource.c + 1}) → (${this.moveDest.r + 1},${this.moveDest.c + 1})</strong>（湿度不变，不消耗投放）</span>`;
        confirmBtn.disabled = false;
        confirmBtn.textContent = '确认挪位 (-1 券)';
      }
      cancelBtn.disabled = false;
      moveBtn.textContent = '退出挪位';
      moveBtn.disabled = false;
      return;
    }

    // Placement Mode
    const full = isBoardFull(activeState.grid);
    if (full) {
      statusTextEl.innerHTML = `<span style="color: var(--danger-red);"><strong>盘面已满</strong>：本件【${itemMeta.badge}】放不下，跳过得 0 分（仍计 1 次投放）</span>`;
      confirmBtn.disabled = false;
      confirmBtn.textContent = '本件放不下，跳过';
      cancelBtn.disabled = true;
    } else if (this.previewCell) {
      const willTriggerWind = stepsUntilWind === 1;
      statusTextEl.innerHTML = `<span>已预览将【${itemMeta.badge}】挂在 <strong>(${this.previewCell.r + 1},${this.previewCell.c + 1})</strong>${
        willTriggerWind ? ` · 确认后吹来第 ${activeState.gustIndex + 1} 阵【${windMeta.name} ${windMeta.arrow}】` : ''
      }</span>`;
      confirmBtn.disabled = false;
      confirmBtn.textContent = willTriggerWind
        ? `挂好并吹来${windMeta.name} ${windMeta.arrow}`
        : `挂好（再放 ${stepsUntilWind - 1} 件吹${windMeta.short}风）`;
      cancelBtn.disabled = false;
    } else {
      statusTextEl.innerHTML = `<span>待挂第 <strong>${activeState.placedCount + 1}/${activeState.queue.length}</strong> 件：<strong>${itemMeta.badge}</strong>（点击空格预览，再放 ${stepsUntilWind} 件吹【${windMeta.name} ${windMeta.arrow}】）</span>`;
      confirmBtn.disabled = true;
      confirmBtn.textContent = '请先点空格预览 → 挂好';
      cancelBtn.disabled = true;
    }

    const canMove =
      activeState.tickets > 0 &&
      countEmptyCells(activeState.grid) > 0 &&
      countEmptyCells(activeState.grid) < 9;
    moveBtn.disabled = !canMove;
    moveBtn.textContent = `使用挪位券 (${activeState.tickets})`;
  }

  _renderQueuePanel(lv, activeState) {
    const container = document.getElementById('queue-groups');
    if (!container) return;
    container.innerHTML = '';

    const gustEvery = activeState.gustEvery;
    const totalBatches = Math.ceil(activeState.queue.length / gustEvery);

    for (let b = 0; b < totalBatches; b++) {
      const row = document.createElement('div');
      row.className = 'queue-batch-row';
      if (b === activeState.gustIndex && activeState.status === 'playing') {
        row.classList.add('is-active-batch');
      }

      const startIdx = b * gustEvery;
      const endIdx = Math.min(activeState.queue.length, startIdx + gustEvery);
      const wDir = activeState.winds[b];
      const wMeta = WIND_META[wDir];

      let chipsHtml = '';
      for (let i = startIdx; i < startIdx + 3; i++) {
        if (i < endIdx) {
          const t = activeState.queue[i];
          const isPlaced = i < activeState.placedCount;
          const isCurrent = i === activeState.placedCount && activeState.status === 'playing';
          chipsHtml += `<div class="queue-chip chip-${t} ${isPlaced ? 'is-placed' : ''} ${
            isCurrent ? 'is-current-item' : ''
          }" title="第 ${i + 1} 件：${GARMENT_META[t].desc}">#${i + 1} ${t === 'H' ? '厚H' : '薄L'}</div>`;
        } else {
          chipsHtml += `<div></div>`;
        }
      }

      row.innerHTML = `
        <span class="batch-label">第 ${b + 1} 轮</span>
        ${chipsHtml}
        <span class="batch-wind-pill">${wMeta ? `${wMeta.short}${wMeta.arrow}` : '-'}</span>
      `;
      container.appendChild(row);
    }
  }

  _renderLevelList() {
    const listEl = document.getElementById('level-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    this.levels.forEach((lv, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `level-item-btn ${idx === this.currentLevelIndex ? 'is-selected' : ''}`;
      const best = this.bestScores[lv.id];
      const cleared = typeof best === 'number' && best >= lv.target;
      const windStr = lv.winds.map((w) => WIND_META[w].short).join('→');

      btn.innerHTML = `
        <div>
          <span class="level-item-title">${lv.title}</span>
          <span class="level-item-meta">[${lv.stage}] 风向 ${windStr} · 目标 ${lv.target}分</span>
        </div>
        <span class="level-score-badge ${cleared ? 'is-cleared' : ''}">
          ${typeof best === 'number' ? `最高 ${best}分` : `目标 ${lv.target}`}
        </span>
      `;
      btn.addEventListener('click', () => this.loadLevel(idx, true));
      listEl.appendChild(btn);
    });
  }

  _renderHintsAndDiagnostics(lv, activeState) {
    // 1. Two-level Hint Box
    const hintBox = document.getElementById('hint-display-box');
    const hintBtn = document.getElementById('btn-step-hint');
    if (hintBox && hintBtn) {
      const hints = generateTwoLevelHints(activeState);
      if (this.hintStage === 0) {
        hintBox.hidden = true;
        hintBtn.textContent = '一级提示：遮挡诊断';
      } else if (this.hintStage === 1) {
        hintBox.hidden = false;
        hintBox.innerHTML = `<div>${hints.level1}</div>`;
        hintBtn.textContent = '二级提示：行列规划';
      } else {
        hintBox.hidden = false;
        hintBox.innerHTML = `<div>${hints.level1}</div><hr style="border:0;border-top:1px dashed var(--border-strong);margin:6px 0;"/><div>${hints.level2}</div>`;
        hintBtn.textContent = '收起提示';
      }
    }

    // 2. Gust History & Endgame Diagnosis
    const logContainer = document.getElementById('gust-log-list');
    if (!logContainer) return;
    logContainer.innerHTML = '';

    if (activeState.gustSummaries.length === 0) {
      logContainer.innerHTML = `<div class="gust-log-card" style="color:var(--text-secondary);">尚未触发阵风。每挂好 ${activeState.gustEvery} 件衣物将自动结算一阵风，并在此记录受风、收衣与被遮挡详情。</div>`;
    } else {
      activeState.gustSummaries.forEach((g) => {
        const hitStr =
          g.hitRecords.length > 0
            ? g.hitRecords
                .map(
                  (h) =>
                    `(${h.r + 1},${h.c + 1})${h.type}[${h.beforeWet}→${h.afterWet}${
                      h.collected ? ` 收+${h.points}` : ''
                    }]`
                )
                .join('、')
            : '无受风衣物';
        const blockedStr =
          g.blockedRecords.length > 0
            ? g.blockedRecords
                .map(
                  (b) =>
                    `(${b.r + 1},${b.c + 1})${b.type} 被(${b.blockedBy.r + 1},${b.blockedBy.c + 1})挡住`
                )
                .join('、')
            : '无被挡衣物';

        const card = document.createElement('div');
        card.className = 'gust-log-card';
        card.innerHTML = `
          <div class="gust-log-header">
            <span>第 ${g.gustNumber} 阵 · ${g.windName} ${g.windArrow}</span>
            <span style="color: var(--dry-green);">本阵 +${g.gustScoreGain} 分（累计 ${g.totalScoreAfter}）</span>
          </div>
          <div><strong>受风锁定：</strong>${hitStr}</div>
          <div style="color: var(--text-secondary);"><strong>遮挡情况：</strong>${blockedStr}</div>
        `;
        logContainer.appendChild(card);
      });
    }

    // If endgame, append uncollected garment diagnosis + comparison with previous run
    if (activeState.status !== 'playing') {
      const remaining = diagnoseRemainingGarments(activeState);
      const diagCard = document.createElement('div');
      diagCard.className = 'callout-box';
      let diagHtml = `<strong>终局留场未干原因诊断（留场衣物得 0 分）：</strong>`;
      if (remaining.length === 0) {
        diagHtml += `<div>太棒了！场上无任何残留湿衣，全部吹干收走。</div>`;
      } else {
        diagHtml += `<ul style="margin:6px 0 0;padding-left:18px;">${remaining
          .map(
            (item) =>
              `<li><strong>${item.coordLabel} ${GARMENT_META[item.type].badge}（剩湿 ${item.wetness}）</strong>：${item.reasonText}</li>`
          )
          .join('')}</ul>`;
      }

      const prevSummary = this.lastRunSummaries[lv.id];
      if (prevSummary) {
        diagHtml += `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--border-strong);font-size:0.74rem;">
          <strong>本局记录：</strong>各阵得分 [${activeState.gustSummaries.map((g) => g.gustScoreGain).join(' → ')}] · 前台用时 ${this._getForegroundSeconds()}s · 改点取消 ${this.cancelCountThisRun} 次
        </div>`;
      }
      diagCard.innerHTML = diagHtml;
      logContainer.appendChild(diagCard);
    }
  }

  _renderTelemetryModal() {
    const tbody = document.getElementById('telemetry-table-body');
    const summaryEl = document.getElementById('telemetry-summary-stats');
    if (summaryEl) {
      const lv = this.levels[this.currentLevelIndex];
      summaryEl.innerHTML = `
        当前关卡：<strong>${lv.title}</strong> ｜ 前台有效时长：<strong>${this._getForegroundSeconds()} 秒</strong> ｜ 
        本局取消/改点：<strong>${this.cancelCountThisRun} 次</strong> ｜ 
        本关重开次数：<strong>${this.retryCounts[lv.id] || 0} 次</strong> ｜ 
        累计事件数：<strong>${this.telemetryEvents.length} 条</strong>
      `;
    }
    if (!tbody) return;
    tbody.innerHTML = this.telemetryEvents
      .slice()
      .reverse()
      .slice(0, 40)
      .map(
        (ev) => `
        <tr>
          <td>${ev.ts.slice(11, 19)}</td>
          <td>${ev.levelId}</td>
          <td><code>${ev.eventType}</code></td>
          <td>${ev.fgSec}s</td>
          <td style="font-family:monospace;font-size:0.7rem;">${JSON.stringify(
            Object.fromEntries(
              Object.entries(ev).filter(
                ([k]) => !['ts', 'levelId', 'version', 'fgSec', 'eventType'].includes(k)
              )
            )
          )}</td>
        </tr>
      `
      )
      .join('');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.jggoApp = new JggoGameApp();
});
