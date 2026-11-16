// Pure Rule State Machine for 《借风晒衣》
// Deterministic state transitions supporting:
// - 3x3 courtyard rack
// - Pre-hung garments (initialItems) & wind-blocking potted citrus trees (obstacles)
// - Basket garment queue (L: wetness 1, H: wetness 2), scheduled wind gusts, and wooden move clips (tickets)
// - 100%-All-Dry puzzle completion (every garment hung & dried cleanly) as well as legacy score targets

export const WIND_META = {
  W: { code: 'W', name: '西风', short: '西', arrow: '→', desc: '从左向右吹过每一排', axis: 'row', order: [0, 1, 2] },
  E: { code: 'E', name: '东风', short: '东', arrow: '←', desc: '从右向左吹过每一排', axis: 'row', order: [2, 1, 0] },
  N: { code: 'N', name: '北风', short: '北', arrow: '↓', desc: '从上向下吹过每一列', axis: 'col', order: [0, 1, 2] },
  S: { code: 'S', name: '南风', short: '南', arrow: '↑', desc: '从下向上吹过每一列', axis: 'col', order: [2, 1, 0] },
};

export const GARMENT_META = {
  L: { type: 'L', name: '薄衫', badge: '薄衫', initialWetness: 1, points: 2, desc: '1 滴水 · 吹 1 次风即干' },
  H: { type: 'H', name: '厚衣', badge: '厚衣', initialWetness: 2, points: 5, desc: '2 滴水 · 吹 2 次风才干' },
};

export const OBSTACLE_META = {
  P: { type: 'P', name: '橘树盆栽', desc: '不可挂衣，且会挡住顺风方向的后排格子' },
};

export function isGarmentCell(cell) {
  return Boolean(cell && (cell.type === 'L' || cell.type === 'H'));
}

export function isObstacleCell(cell) {
  return Boolean(cell && cell.type === 'P');
}

export function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((cell) => (cell ? { ...cell, hitHistory: [...(cell.hitHistory || [])] } : null))
  );
}

export function createInitialState(level) {
  const gustEvery = level.gustEvery || 2;
  const grid = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
  let nextItemId = 1;

  if (Array.isArray(level.obstacles)) {
    for (const [r, c] of level.obstacles) {
      if (r >= 0 && r < 3 && c >= 0 && c < 3) {
        grid[r][c] = { id: `obs_${r}_${c}`, type: 'P', isObstacle: true, hitHistory: [] };
      }
    }
  }

  let initialGarmentCount = 0;
  if (Array.isArray(level.initialItems)) {
    for (const item of level.initialItems) {
      const { r, c, type } = item;
      if (r >= 0 && r < 3 && c >= 0 && c < 3 && !grid[r][c] && GARMENT_META[type]) {
        const wetness = item.wetness ?? GARMENT_META[type].initialWetness;
        grid[r][c] = {
          id: nextItemId++,
          type,
          wetness,
          isInitial: true,
          placedAtStep: 0,
          placedCoord: [r, c],
          hitHistory: [],
        };
        initialGarmentCount += 1;
      }
    }
  }

  const totalGarments = initialGarmentCount + level.queue.length;
  const requireAllDry = level.requireAllDry !== false;

  return {
    levelId: level.id,
    grid,
    queue: [...level.queue],
    winds: [...level.winds],
    gustEvery,
    placedCount: 0,
    skippedCount: 0,
    gustIndex: 0,
    tickets: level.tickets ?? 0,
    maxTickets: level.tickets ?? 0,
    collectedL: 0,
    collectedH: 0,
    driedCount: 0,
    totalGarments,
    requireAllDry,
    score: 0,
    target: level.target ?? totalGarments,
    status: 'playing', // 'playing' | 'won' | 'lost'
    gustSummaries: [],
    actionLog: [],
    nextItemId,
  };
}

export function isBoardFull(grid) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!grid[r][c]) return false;
    }
  }
  return true;
}

export function countEmptyCells(grid) {
  let count = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!grid[r][c]) count++;
    }
  }
  return count;
}

export function countRemainingGarmentsOnBoard(grid) {
  let count = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (isGarmentCell(grid[r][c])) count++;
    }
  }
  return count;
}

/**
 * Computes which cells are hit (first in scanline), blocked (behind first garment or obstacle),
 * or in wind-shadow (empty cell behind an obstacle or garment) for a given 3x3 grid and windDir.
 */
export function computeWindForecast(grid, windDir) {
  if (!windDir || !WIND_META[windDir]) {
    return {
      hitCells: [],
      blockedCells: [],
      shadowEmptyCells: [],
      exposedEmptyCells: [],
      emptyScanlines: [0, 1, 2],
      cellMap: {},
    };
  }
  const meta = WIND_META[windDir];
  const hitCells = [];
  const blockedCells = [];
  const shadowEmptyCells = [];
  const exposedEmptyCells = [];
  const emptyScanlines = [];
  const cellMap = {};

  for (let lineIdx = 0; lineIdx < 3; lineIdx++) {
    let firstBlocker = null;
    let lineHasHit = false;

    for (const stepIdx of meta.order) {
      const r = meta.axis === 'row' ? lineIdx : stepIdx;
      const c = meta.axis === 'row' ? stepIdx : lineIdx;
      const cell = grid[r][c];

      if (!cell) {
        if (!firstBlocker) {
          exposedEmptyCells.push({ r, c, scanlineIndex: lineIdx });
        } else {
          shadowEmptyCells.push({ r, c, blockedBy: firstBlocker, scanlineIndex: lineIdx });
        }
        continue;
      }

      if (isObstacleCell(cell)) {
        if (!firstBlocker) {
          firstBlocker = { r, c, type: 'P' };
          cellMap[`${r},${c}`] = { status: 'obstacle-front', detail: firstBlocker };
        } else {
          cellMap[`${r},${c}`] = { status: 'obstacle-shadow', detail: firstBlocker };
        }
        continue;
      }

      if (!firstBlocker) {
        const newWetness = Math.max(0, cell.wetness - 1);
        const willCollect = newWetness === 0;
        const pointsGained = willCollect ? GARMENT_META[cell.type].points : 0;
        const hitInfo = {
          r,
          c,
          cell,
          newWetness,
          willCollect,
          pointsGained,
          scanlineIndex: lineIdx,
        };
        firstBlocker = { r, c, type: cell.type };
        lineHasHit = true;
        hitCells.push(hitInfo);
        cellMap[`${r},${c}`] = { status: willCollect ? 'collect' : 'hit', detail: hitInfo };
      } else {
        const blockedInfo = {
          r,
          c,
          cell,
          blockedBy: firstBlocker,
          scanlineIndex: lineIdx,
        };
        blockedCells.push(blockedInfo);
        cellMap[`${r},${c}`] = { status: 'blocked', detail: blockedInfo };
      }
    }

    if (!lineHasHit) {
      emptyScanlines.push(lineIdx);
    }
  }

  return {
    hitCells,
    blockedCells,
    shadowEmptyCells,
    exposedEmptyCells,
    emptyScanlines,
    cellMap,
  };
}

/**
 * Builds a hypothetical grid after applying a preview placement or preview move,
 * and returns the wind forecast for the upcoming wind gust.
 */
export function previewActionForecast(state, previewAction) {
  const tempGrid = cloneGrid(state.grid);
  if (previewAction) {
    if (previewAction.type === 'place' && state.placedCount < state.queue.length) {
      const { r, c } = previewAction;
      if (tempGrid[r]?.[c] === null) {
        const itemType = state.queue[state.placedCount];
        tempGrid[r][c] = {
          id: 'preview',
          type: itemType,
          wetness: GARMENT_META[itemType].initialWetness,
          isPreview: true,
        };
      }
    } else if (previewAction.type === 'move') {
      const { fromR, fromC, toR, toC } = previewAction;
      if (isGarmentCell(tempGrid[fromR]?.[fromC]) && tempGrid[toR]?.[toC] === null) {
        tempGrid[toR][toC] = { ...tempGrid[fromR][fromC], isPreview: true };
        tempGrid[fromR][fromC] = null;
      }
    }
  }
  const currentWind = state.winds[state.gustIndex] || null;
  const forecast = computeWindForecast(tempGrid, currentWind);
  return { tempGrid, currentWind, forecast };
}

/**
 * Applies a Wooden Move Clip action: moves an existing garment on the rack to an empty cell.
 * Does NOT consume a placement count and does NOT trigger wind.
 */
export function applyMoveAction(state, fromR, fromC, toR, toC) {
  if (state.status !== 'playing') {
    throw new Error('本局已结束');
  }
  if (state.tickets <= 0) {
    throw new Error('移衣木夹已用完');
  }
  if (!isGarmentCell(state.grid[fromR]?.[fromC])) {
    throw new Error('只能移动已挂在架上的衣物');
  }
  if (state.grid[toR]?.[toC] !== null) {
    throw new Error('目标位置已有物品，请移到空位');
  }

  const next = {
    ...state,
    grid: cloneGrid(state.grid),
    gustSummaries: [...state.gustSummaries],
    actionLog: [
      ...state.actionLog,
      {
        type: 'move',
        from: [fromR, fromC],
        to: [toR, toC],
        step: state.placedCount,
        gustIndex: state.gustIndex,
      },
    ],
  };

  next.grid[toR][toC] = next.grid[fromR][fromC];
  next.grid[fromR][fromC] = null;
  next.tickets -= 1;

  return { state: next, gustTriggered: null };
}

/**
 * Applies a Placement action (or Full-Board Skip if board is full).
 * Automatically resolves a wind gust if placedCount reaches a multiple of gustEvery.
 */
export function applyPlaceOrSkipAction(state, action) {
  if (state.status !== 'playing') {
    throw new Error('本局已结束');
  }
  if (state.placedCount >= state.queue.length) {
    throw new Error('衣篮衣物已全部挂完');
  }

  const next = {
    ...state,
    grid: cloneGrid(state.grid),
    gustSummaries: [...state.gustSummaries],
    actionLog: [...state.actionLog],
  };

  const itemType = next.queue[next.placedCount];
  const full = isBoardFull(next.grid);

  if (action.type === 'skip') {
    if (!full) {
      throw new Error('晒衣架还有空位，不能跳过衣物');
    }
    next.placedCount += 1;
    next.skippedCount += 1;
    next.actionLog.push({
      type: 'skip',
      itemType,
      placementNumber: next.placedCount,
    });
  } else if (action.type === 'place') {
    const [r, c] = action.at;
    if (r < 0 || r > 2 || c < 0 || c > 2) {
      throw new Error('超出 3×3 晒衣架范围');
    }
    if (next.grid[r][c] !== null) {
      throw new Error('该位置不可挂衣，请选择空位');
    }
    next.placedCount += 1;
    next.grid[r][c] = {
      id: next.nextItemId++,
      type: itemType,
      wetness: GARMENT_META[itemType].initialWetness,
      placedAtStep: next.placedCount,
      placedCoord: [r, c],
      hitHistory: [],
    };
    next.actionLog.push({
      type: 'place',
      itemType,
      at: [r, c],
      placementNumber: next.placedCount,
    });
  } else {
    throw new Error(`未知动作类型: ${action.type}`);
  }

  let gustTriggered = null;

  // Check if a wind gust triggers
  if (next.placedCount % next.gustEvery === 0 && next.gustIndex < next.winds.length) {
    const windDir = next.winds[next.gustIndex];
    const gustNumber = next.gustIndex + 1;
    const forecast = computeWindForecast(next.grid, windDir);

    let gustScoreGain = 0;
    const hitRecords = [];
    const collectedRecords = [];
    const blockedRecords = forecast.blockedCells.map((b) => ({
      r: b.r,
      c: b.c,
      type: b.cell.type,
      wetness: b.cell.wetness,
      blockedBy: b.blockedBy,
    }));

    // Simultaneous wetness reduction based on pre-gust locked targets
    for (const hit of forecast.hitCells) {
      const targetCell = next.grid[hit.r][hit.c];
      const beforeWet = targetCell.wetness;
      const afterWet = beforeWet - 1;
      targetCell.wetness = afterWet;
      targetCell.hitHistory.push({ gustNumber, windDir, coord: [hit.r, hit.c] });

      hitRecords.push({
        r: hit.r,
        c: hit.c,
        type: targetCell.type,
        beforeWet,
        afterWet,
        collected: afterWet === 0,
        points: afterWet === 0 ? GARMENT_META[targetCell.type].points : 0,
      });

      if (afterWet === 0) {
        const pts = GARMENT_META[targetCell.type].points;
        gustScoreGain += pts;
        next.score += pts;
        next.driedCount += 1;
        if (targetCell.type === 'H') {
          next.collectedH += 1;
        } else {
          next.collectedL += 1;
        }
        collectedRecords.push({
          r: hit.r,
          c: hit.c,
          type: targetCell.type,
          points: pts,
        });
        next.grid[hit.r][hit.c] = null;
      }
    }

    gustTriggered = {
      gustNumber,
      windDir,
      windName: WIND_META[windDir].name,
      windArrow: WIND_META[windDir].arrow,
      hitRecords,
      collectedRecords,
      blockedRecords,
      emptyScanlines: forecast.emptyScanlines,
      gustScoreGain,
      totalScoreAfter: next.score,
    };

    next.gustSummaries.push(gustTriggered);
    next.gustIndex += 1;
  }

  // Endgame check
  if (next.placedCount >= next.queue.length) {
    if (next.requireAllDry) {
      const rem = countRemainingGarmentsOnBoard(next.grid);
      next.status = rem === 0 && next.skippedCount === 0 && next.driedCount === next.totalGarments ? 'won' : 'lost';
    } else {
      next.status = next.score >= next.target ? 'won' : 'lost';
    }
  }

  return { state: next, gustTriggered };
}

/**
 * Replays a complete action sequence from scratch on a level and returns all intermediate snapshots.
 */
export function replayActionSequence(level, actions) {
  let state = createInitialState(level);
  const snapshots = [{ label: '初始盘面', action: null, state: structuredClone(state), gust: null }];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    if (act.type === 'move') {
      const [r1, c1] = act.from;
      const [r2, c2] = act.to;
      const res = applyMoveAction(state, r1, c1, r2, c2);
      state = res.state;
      snapshots.push({
        label: `移衣 (${r1 + 1},${c1 + 1})→(${r2 + 1},${c2 + 1})`,
        action: act,
        state: structuredClone(state),
        gust: null,
      });
    } else {
      const res = applyPlaceOrSkipAction(state, act);
      state = res.state;
      const itemLabel = act.type === 'skip'
        ? `第 ${state.placedCount} 件跳过`
        : `第 ${state.placedCount} 件 ${state.queue[state.placedCount - 1]}→(${act.at[0] + 1},${act.at[1] + 1})`;
      snapshots.push({
        label: res.gustTriggered
          ? `${itemLabel} ＋ 第 ${res.gustTriggered.gustNumber} 阵${res.gustTriggered.windName}`
          : itemLabel,
        action: act,
        state: structuredClone(state),
        gust: res.gustTriggered,
      });
    }
  }

  return { finalState: state, snapshots };
}

/**
 * Analyzes why any remaining garments on the board at endgame did not dry.
 */
export function diagnoseRemainingGarments(state) {
  const reasons = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = state.grid[r][c];
      if (!isGarmentCell(cell)) continue;
      let reasonText = '';
      if (cell.type === 'H' && cell.placedAtStep > state.queue.length - state.gustEvery) {
        reasonText = '最后一轮才挂上厚衣，只剩 1 阵风不够吹干';
      } else if (cell.hitHistory.length === 0) {
        reasonText = '全程被前排衣物或盆栽挡住，没吹到风';
      } else if (cell.wetness === 1) {
        reasonText = '吹干了一半（还剩 1 滴水），后续风向被挡住或落空';
      } else {
        reasonText = `还剩 ${cell.wetness} 滴水未吹干`;
      }
      reasons.push({
        r,
        c,
        coordLabel: `(${r + 1},${c + 1})`,
        type: cell.type,
        wetness: cell.wetness,
        placedAtStep: cell.placedAtStep,
        reasonText,
      });
    }
  }
  return reasons;
}
