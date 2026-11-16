// Pure Rule State Machine for 《借风晒衣》 (Borrowing the Wind to Dry Clothes) v0.1
// Implements Section 07 & Section 08 specifications with 100% deterministic replayability.

export const WIND_META = {
  W: { code: 'W', name: '西风', short: '西', arrow: '→', desc: '从左向右扫每一行', axis: 'row', order: [0, 1, 2] },
  E: { code: 'E', name: '东风', short: '东', arrow: '←', desc: '从右向左扫每一行', axis: 'row', order: [2, 1, 0] },
  N: { code: 'N', name: '北风', short: '北', arrow: '↓', desc: '从上向下扫每一列', axis: 'col', order: [0, 1, 2] },
  S: { code: 'S', name: '南风', short: '南', arrow: '↑', desc: '从下向上扫每一列', axis: 'col', order: [2, 1, 0] },
};

export const GARMENT_META = {
  L: { type: 'L', name: '薄衣', badge: '薄衣 L', initialWetness: 1, points: 2, desc: '初始湿度 1 · 吃 1 阵风即干 (+2分)' },
  H: { type: 'H', name: '厚衣', badge: '厚衣 H', initialWetness: 2, points: 5, desc: '初始湿度 2 · 跨 2 阵风吹干 (+5分)' },
};

export function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((cell) => (cell ? { ...cell, hitHistory: [...(cell.hitHistory || [])] } : null))
  );
}

export function createInitialState(level) {
  const gustEvery = level.gustEvery || 3;
  return {
    levelId: level.id,
    grid: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    queue: [...level.queue],
    winds: [...level.winds],
    gustEvery,
    placedCount: 0,
    gustIndex: 0,
    tickets: level.tickets ?? 2,
    collectedL: 0,
    collectedH: 0,
    score: 0,
    target: level.target,
    status: 'playing', // 'playing' | 'won' | 'lost'
    gustSummaries: [],
    actionLog: [],
    nextItemId: 1,
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

/**
 * Computes which cells are hit (first in scanline) vs blocked (behind first in scanline)
 * for a given 3x3 grid and wind direction ('W' | 'E' | 'N' | 'S').
 */
export function computeWindForecast(grid, windDir) {
  if (!windDir || !WIND_META[windDir]) {
    return { hitCells: [], blockedCells: [], emptyScanlines: [0, 1, 2], cellMap: {} };
  }
  const meta = WIND_META[windDir];
  const hitCells = [];
  const blockedCells = [];
  const emptyScanlines = [];
  const cellMap = {};

  for (let lineIdx = 0; lineIdx < 3; lineIdx++) {
    let firstHit = null;
    for (const stepIdx of meta.order) {
      const r = meta.axis === 'row' ? lineIdx : stepIdx;
      const c = meta.axis === 'row' ? stepIdx : lineIdx;
      const cell = grid[r][c];
      if (!cell) continue;

      if (!firstHit) {
        const newWetness = Math.max(0, cell.wetness - 1);
        const willCollect = newWetness === 0;
        const pointsGained = willCollect ? GARMENT_META[cell.type].points : 0;
        firstHit = {
          r,
          c,
          cell,
          newWetness,
          willCollect,
          pointsGained,
          scanlineIndex: lineIdx,
        };
        hitCells.push(firstHit);
        cellMap[`${r},${c}`] = { status: willCollect ? 'collect' : 'hit', detail: firstHit };
      } else {
        const blockedInfo = {
          r,
          c,
          cell,
          blockedBy: { r: firstHit.r, c: firstHit.c, type: firstHit.cell.type },
          scanlineIndex: lineIdx,
        };
        blockedCells.push(blockedInfo);
        cellMap[`${r},${c}`] = { status: 'blocked', detail: blockedInfo };
      }
    }
    if (!firstHit) {
      emptyScanlines.push(lineIdx);
    }
  }

  return { hitCells, blockedCells, emptyScanlines, cellMap };
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
      if (tempGrid[r][c] === null) {
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
      if (tempGrid[fromR]?.[fromC] && tempGrid[toR]?.[toC] === null) {
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
 * Applies a Move Ticket action: moves an existing garment on the board to an empty cell.
 * Does NOT consume a placement count and does NOT trigger wind.
 */
export function applyMoveAction(state, fromR, fromC, toR, toC) {
  if (state.status !== 'playing') {
    throw new Error('当前局已结束，无法挪位');
  }
  if (state.tickets <= 0) {
    throw new Error('剩余挪位券为 0，无法挪位');
  }
  if (!state.grid[fromR]?.[fromC]) {
    throw new Error('起始格没有在场衣物');
  }
  if (state.grid[toR]?.[toC] !== null) {
    throw new Error('目标格已有衣物，只能移到空格');
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
    throw new Error('当前局已结束');
  }
  if (state.placedCount >= state.queue.length) {
    throw new Error('衣篮队列已全部处理完毕');
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
      throw new Error('盘面仍有空格，不能主动丢弃可摆放的衣物');
    }
    next.placedCount += 1;
    next.actionLog.push({
      type: 'skip',
      itemType,
      placementNumber: next.placedCount,
    });
  } else if (action.type === 'place') {
    const [r, c] = action.at;
    if (r < 0 || r > 2 || c < 0 || c > 2) {
      throw new Error('坐标超出 3×3 晒场范围');
    }
    if (next.grid[r][c] !== null) {
      throw new Error('该格已有衣物，请选择空格');
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

  // Endgame check: after 12th item (or final queue item) and final wind resolution
  if (next.placedCount >= next.queue.length) {
    next.status = next.score >= next.target ? 'won' : 'lost';
  }

  return { state: next, gustTriggered };
}

/**
 * Replays a complete action sequence from scratch on a level and returns all intermediate snapshots.
 */
export function replayActionSequence(level, actions) {
  let state = createInitialState(level);
  const snapshots = [{ label: '初始空盘', action: null, state: structuredClone(state), gust: null }];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    if (act.type === 'move') {
      const [r1, c1] = act.from;
      const [r2, c2] = act.to;
      const res = applyMoveAction(state, r1, c1, r2, c2);
      state = res.state;
      snapshots.push({
        label: `挪位 (${r1 + 1},${c1 + 1})→(${r2 + 1},${c2 + 1})`,
        action: act,
        state: structuredClone(state),
        gust: null,
      });
    } else {
      const res = applyPlaceOrSkipAction(state, act);
      state = res.state;
      const itemLabel = act.type === 'skip'
        ? `第 ${state.placedCount} 件满盘跳过`
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
      if (!cell) continue;
      let reasonText = '';
      if (cell.type === 'H' && cell.placedAtStep > state.queue.length - state.gustEvery) {
        reasonText = `第 ${cell.placedAtStep} 手才挂上厚衣（仅剩 1 阵风，厚衣需 2 阵风才能吹干）`;
      } else if (cell.hitHistory.length === 0) {
        reasonText = `自第 ${cell.placedAtStep} 手挂上后未处于迎风首格，全程被前排衣物遮挡`;
      } else if (cell.type === 'H' && cell.wetness === 1) {
        const hitGust = cell.hitHistory[0]?.gustNumber;
        reasonText = `在第 ${hitGust} 阵风吹至半干（剩 1 湿度），但后续阵风被遮挡或未在对应扫描线迎风`;
      } else {
        reasonText = `剩余湿度 ${cell.wetness}，未能吃到足够迎风次数`;
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

/**
 * Generates Two-Level Hints (Section 09: 提示分两级：先解释本阵哪些衣物被挡，再建议关注某行/某列；不直接摆出唯一答案).
 */
export function generateTwoLevelHints(state) {
  const windDir = state.winds[state.gustIndex];
  if (!windDir) {
    return {
      level1: '本局所有阵风已结算完毕。可查看下方每阵受风明细或点击“演示达标见证”。',
      level2: '复盘建议：留意终局留在场上的半干厚衣，尝试提前一轮将其摆在双风向交汇处。',
    };
  }
  const meta = WIND_META[windDir];
  const forecast = computeWindForecast(state.grid, windDir);
  const nextWindDir = state.winds[state.gustIndex + 1];
  const nextMeta = nextWindDir ? WIND_META[nextWindDir] : null;
  const currentItem = state.queue[state.placedCount];
  const stepsToGust = state.gustEvery - (state.placedCount % state.gustEvery);

  // Level 1: Explain current blocking & scanlines
  let level1 = `【一级提示 · 遮挡与扫描诊断】即将吹来第 ${state.gustIndex + 1} 阵【${meta.name} ${meta.arrow}】（${meta.desc}，还差 ${stepsToGust} 次投放触发）。`;
  if (forecast.blockedCells.length > 0) {
    const blockedStr = forecast.blockedCells
      .map(
        (b) =>
          `(${b.r + 1},${b.c + 1}) 的${GARMENT_META[b.cell.type].name}被前排 (${b.blockedBy.r + 1},${b.blockedBy.c + 1}) 挡住`
      )
      .join('；');
    level1 += ` 当前盘面有遮挡：${blockedStr}（同扫描线每阵只吹第一件）。`;
  } else {
    level1 += ` 当前盘面暂无衣物被遮挡。`;
  }
  if (forecast.emptyScanlines.length > 0) {
    const lineType = meta.axis === 'row' ? '行' : '列';
    const lines = forecast.emptyScanlines.map((i) => `第 ${i + 1} ${lineType}`).join('、');
    level1 += ` 目前 ${lines} 尚无迎风衣物，可优先利用。`;
  }

  // Level 2: Row/Col tactical suggestion without spoiling exact cell
  let level2 = `【二级提示 · 行列与跨阵规划】当前待挂为【${GARMENT_META[currentItem].badge}】。`;
  if (currentItem === 'H') {
    if (nextMeta) {
      level2 += ` 厚衣需受风 2 次（+5分）：建议放入本阵【${meta.name}】能直接吹到的迎风首格，且在下一阵【${nextMeta.name} ${nextMeta.arrow}】中也能处于迎风边缘（或预留挪位券调整）。`;
    } else {
      level2 += ` 当前已是最后一阵风周期，新挂上的全新厚衣（湿度 2）在本阵最多减至湿度 1，优先不要挡住场上已半干（湿度 1）的厚衣或薄衣！`;
    }
  } else {
    level2 += ` 薄衣只需受风 1 次即可收走（+2分）并腾空该格：适合放在本阵【${meta.name}】空闲的扫描线最前排，吹干后自动为后排衣物让出通道。`;
  }

  return { level1, level2 };
}
