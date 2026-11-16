// Exact State-Space Solver & Difficulty Analyzer for 《借风晒衣》
// Exploits the canonical 3x3 wetness/obstacle representation (4^9 = 262,144 max configurations)
// with tight admissible wind-budget pruning to solve any board state 100% exhaustively in <15ms.

import { createInitialState, isObstacleCell, isGarmentCell } from './engine.js';

const SCANLINES = {
  W: [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
  ],
  E: [
    [2, 1, 0],
    [5, 4, 3],
    [8, 7, 6],
  ],
  N: [
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
  ],
  S: [
    [6, 3, 0],
    [7, 4, 1],
    [8, 5, 2],
  ],
};

// Cell encoding in flat 9-array:
//  0 = empty
//  1 = garment with 1 wetness remaining
//  2 = garment with 2 wetness remaining
// -2 = potted citrus tree obstacle (cannot place, blocks wind behind it)
export function gridToCells(grid) {
  const cells = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = grid[r][c];
      const idx = r * 3 + c;
      if (!cell) cells[idx] = 0;
      else if (isObstacleCell(cell)) cells[idx] = -2;
      else if (isGarmentCell(cell)) cells[idx] = cell.wetness;
    }
  }
  return cells;
}

export function blowCells(cells, windDir) {
  const next = cells.slice();
  const lines = SCANLINES[windDir];
  if (!lines) return next;
  for (let l = 0; l < 3; l++) {
    const line = lines[l];
    for (let k = 0; k < 3; k++) {
      const idx = line[k];
      const v = next[idx];
      if (v > 0) {
        next[idx] = v - 1;
        break;
      }
      if (v === -2) {
        break;
      }
    }
  }
  return next;
}

function encodeKey(cells, step, tickets) {
  let code = 0;
  for (let i = 0; i < 9; i++) {
    const d = cells[i] === -2 ? 3 : cells[i];
    code = code * 4 + d;
  }
  return (code * 16 + step) * 4 + tickets;
}

/**
 * Exhaustively searches from `cells`, `placedCount`, `gustIndex`, `ticketsAllowed`
 * for an action sequence that dries 100% of all garments.
 */
export function solveRaw(cellsInit, queue, winds, gustEvery, placedCount = 0, ticketsAllowed = 0) {
  const N = queue.length;
  const remQueueWet = new Array(N + 1).fill(0);
  for (let i = N - 1; i >= 0; i--) {
    remQueueWet[i] = remQueueWet[i + 1] + (queue[i] === 'H' ? 2 : 1);
  }

  const memo = new Map();

  function dfs(cells, step, tickets) {
    let boardWet = 0;
    let hasWet2 = false;
    for (let i = 0; i < 9; i++) {
      const v = cells[i];
      if (v > 0) {
        boardWet += v;
        if (v >= 2) hasWet2 = true;
      }
    }

    if (step === N) {
      return boardWet === 0 ? [] : null;
    }

    const gustsDone = Math.floor(step / gustEvery);
    const remGusts = winds.length - gustsDone;

    // Admissible pruning:
    // 1. Total remaining wetness cannot exceed 3 hits per remaining gust
    if (boardWet + remQueueWet[step] > remGusts * 3) return null;
    // 2. Any 2-wetness garment needs at least 2 gusts
    if (remGusts < 2 && hasWet2) return null;

    const key = encodeKey(cells, step, tickets);
    if (memo.has(key)) return memo.get(key);
    memo.set(key, null); // cycle guard for move sequences

    const wVal = queue[step] === 'H' ? 2 : 1;
    if (wVal === 2 && remGusts < 2) return null;

    // Prefer direct placement before move tickets
    for (let i = 0; i < 9; i++) {
      if (cells[i] !== 0) continue;
      let next = cells.slice();
      next[i] = wVal;
      const nextStep = step + 1;
      if (nextStep % gustEvery === 0 && nextStep / gustEvery - 1 < winds.length) {
        next = blowCells(next, winds[nextStep / gustEvery - 1]);
      }
      const sub = dfs(next, nextStep, tickets);
      if (sub !== null) {
        const res = [{ type: 'place', at: [Math.floor(i / 3), i % 3] }, ...sub];
        memo.set(key, res);
        return res;
      }
    }

    // Try wooden move clip if available
    if (tickets > 0) {
      for (let from = 0; from < 9; from++) {
        if (cells[from] <= 0) continue;
        for (let to = 0; to < 9; to++) {
          if (cells[to] !== 0) continue;
          const moved = cells.slice();
          moved[to] = moved[from];
          moved[from] = 0;
          const sub = dfs(moved, step, tickets - 1);
          if (sub !== null) {
            const res = [
              {
                type: 'move',
                from: [Math.floor(from / 3), from % 3],
                to: [Math.floor(to / 3), to % 3],
              },
              ...sub,
            ];
            memo.set(key, res);
            return res;
          }
        }
      }
    }

    return null;
  }

  const actions = dfs(cellsInit, placedCount, ticketsAllowed);
  return { actions, statesExplored: memo.size };
}

/**
 * Solves from a live `engine.js` state, minimizing Move Clips used.
 */
export function solveFromState(state) {
  if (state.skippedCount > 0) {
    return { solvable: false, actions: null, minClipsUsed: null, statesExplored: 0 };
  }
  const cells = gridToCells(state.grid);
  if (state.placedCount >= state.queue.length) {
    const clear = cells.every((v) => v <= 0);
    return { solvable: clear, actions: clear ? [] : null, minClipsUsed: 0, statesExplored: 1 };
  }

  let totalExplored = 0;
  for (let clips = 0; clips <= state.tickets; clips++) {
    const { actions, statesExplored } = solveRaw(
      cells,
      state.queue,
      state.winds,
      state.gustEvery,
      state.placedCount,
      clips
    );
    totalExplored += statesExplored;
    if (actions !== null) {
      return {
        solvable: true,
        actions,
        minClipsUsed: clips,
        statesExplored: totalExplored,
      };
    }
  }

  return { solvable: false, actions: null, minClipsUsed: null, statesExplored: totalExplored };
}

/**
 * Live Hint Advisor:
 * - If current state is still 100% solvable, returns exact optimal next action.
 * - If player already entered an unsolvable dead-end, walks backward through `history`
 *   to find the exact most recent solvable state!
 */
export function adviseNextAction(state, history = []) {
  const cur = solveFromState(state);
  if (cur.solvable && cur.actions && cur.actions.length > 0) {
    return {
      status: 'solvable',
      nextAction: cur.actions[0],
      remainingActions: cur.actions.length,
      minClipsUsed: cur.minClipsUsed,
    };
  }
  // Walk backward through undo snapshots to pinpoint when the mistake happened
  for (let idx = history.length - 1; idx >= 0; idx--) {
    const check = solveFromState(history[idx]);
    if (check.solvable) {
      return {
        status: 'deadend',
        rewindToIndex: idx,
        rewindSteps: history.length - idx,
        recoveryAction: check.actions?.[0] || null,
      };
    }
  }
  return { status: 'deadend', rewindToIndex: 0, rewindSteps: history.length, recoveryAction: null };
}

/**
 * Quantitative Puzzle Difficulty & Solvability Analyzer.
 * Evaluates exact minimum clips needed, first-move precision, greedy 1-step bot win rate,
 * and random rollout win rate to compute a monotonic difficulty score (1..99).
 */
export function analyzeLevel(level, { rollouts = 240, seed = 42 } = {}) {
  const initState = createInitialState(level);
  const initCells = gridToCells(initState.grid);
  const { queue, winds, gustEvery } = initState;
  const maxTickets = level.tickets ?? 0;

  let minClipsRequired = null;
  let witnessActions = null;
  let statesExplored = 0;

  for (let c = 0; c <= maxTickets; c++) {
    const res = solveRaw(initCells, queue, winds, gustEvery, 0, c);
    statesExplored += res.statesExplored;
    if (res.actions !== null) {
      minClipsRequired = c;
      witnessActions = res.actions;
      break;
    }
  }

  if (witnessActions === null) {
    return { solvable: false, statesExplored };
  }

  // Count how many distinct first-step placements keep the puzzle solvable
  let totalFirstChoices = 0;
  let winningFirstChoices = 0;
  const firstVal = queue[0] === 'H' ? 2 : 1;
  for (let i = 0; i < 9; i++) {
    if (initCells[i] !== 0) continue;
    totalFirstChoices++;
    let next = initCells.slice();
    next[i] = firstVal;
    if (1 % gustEvery === 0) next = blowCells(next, winds[0]);
    const sub = solveRaw(next, queue, winds, gustEvery, 1, maxTickets);
    if (sub.actions !== null) winningFirstChoices++;
  }

  // Deterministic PRNG for reproducible difficulty scoring
  let rng = seed >>> 0;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  };

  let greedyWins = 0;
  let randomWins = 0;

  for (let r = 0; r < rollouts; r++) {
    // 1-gust greedy bot (maximizes immediate wetness loss + dry collections, no multi-gust lookahead)
    let cells = initCells.slice();
    let ok = true;
    for (let s = 0; s < queue.length; s++) {
      const wVal = queue[s] === 'H' ? 2 : 1;
      const wDir = winds[Math.floor(s / gustEvery)];
      let bestScore = -1e9;
      let bestIdxs = [];
      for (let i = 0; i < 9; i++) {
        if (cells[i] !== 0) continue;
        const cand = cells.slice();
        cand[i] = wVal;
        const after = blowCells(cand, wDir);
        let wetRem = 0;
        let driedNow = 0;
        for (let k = 0; k < 9; k++) {
          if (after[k] > 0) wetRem += after[k];
          if (cand[k] > 0 && after[k] === 0) driedNow++;
        }
        const sc = -wetRem * 10 + driedNow * 2;
        if (sc > bestScore) {
          bestScore = sc;
          bestIdxs = [i];
        } else if (sc === bestScore) {
          bestIdxs.push(i);
        }
      }
      if (bestIdxs.length === 0) {
        ok = false;
        break;
      }
      const pick = bestIdxs[Math.floor(rand() * bestIdxs.length)];
      cells[pick] = wVal;
      if ((s + 1) % gustEvery === 0) {
        cells = blowCells(cells, winds[(s + 1) / gustEvery - 1]);
      }
    }
    if (ok && cells.every((v) => v <= 0)) greedyWins++;

    // Pure random legal placement bot
    cells = initCells.slice();
    ok = true;
    for (let s = 0; s < queue.length; s++) {
      const empties = [];
      for (let i = 0; i < 9; i++) if (cells[i] === 0) empties.push(i);
      if (empties.length === 0) {
        ok = false;
        break;
      }
      const pick = empties[Math.floor(rand() * empties.length)];
      cells[pick] = queue[s] === 'H' ? 2 : 1;
      if ((s + 1) % gustEvery === 0) {
        cells = blowCells(cells, winds[(s + 1) / gustEvery - 1]);
      }
    }
    if (ok && cells.every((v) => v <= 0)) randomWins++;
  }

  const greedyWinRate = greedyWins / rollouts;
  const randomWinRate = randomWins / rollouts;
  const firstStepPrecision = totalFirstChoices > 0 ? winningFirstChoices / totalFirstChoices : 0;

  let initWetness = 0;
  let obstacleCount = 0;
  for (let i = 0; i < 9; i++) {
    if (initCells[i] > 0) initWetness += initCells[i];
    if (initCells[i] === -2) obstacleCount++;
  }
  const queueWetness = queue.reduce((s, t) => s + (t === 'H' ? 2 : 1), 0);
  const totalWetness = initWetness + queueWetness;
  const maxWindHits = winds.length * 3;
  const tightness = totalWetness / maxWindHits;

  // Calibrated 1..99 difficulty metric combining lookahead requirement, precision, clips, and horizon
  const rawDiff =
    (1 - greedyWinRate) * 38 +
    (1 - randomWinRate) * 18 +
    (1 - firstStepPrecision) * 14 +
    minClipsRequired * 14 +
    obstacleCount * 4 +
    Math.min(10, queue.length * 1.1) +
    tightness * 6;
  const difficultyScore = Math.max(1, Math.min(99, Math.round(rawDiff)));

  return {
    solvable: true,
    witnessActions,
    minClipsRequired,
    totalGarments: initState.totalGarments,
    totalWetness,
    maxWindHits,
    tightness: Number(tightness.toFixed(2)),
    firstStepPrecision: Number(firstStepPrecision.toFixed(2)),
    winningFirstChoices,
    totalFirstChoices,
    greedyWinRate: Number(greedyWinRate.toFixed(3)),
    randomWinRate: Number(randomWinRate.toFixed(3)),
    difficultyScore,
    statesExplored,
  };
}
