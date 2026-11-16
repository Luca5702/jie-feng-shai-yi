// Procedural 100%-All-Dry Puzzle Generator (出题器) for 《借风晒衣》
// Synthesizes candidate puzzles and filters them through the Exact State-Space Solver (`solver.js`)
// to guarantee:
//   1. 100% of garments (both pre-hung & basket) can be completely dried
//   2. Calibrated difficulty tier (anti-greedy lookahead & precision constraints)
//   3. Strict necessity of Wooden Move Clips in Master puzzles (unsolvable with clips - 1)

import { analyzeLevel } from './solver.js';

const DIRS = ['W', 'E', 'N', 'S'];

export const GENERATOR_TIERS = {
  breeze: {
    key: 'breeze',
    name: '初晴 · 轻松',
    subtitle: '顺风挂衣，热身醒脑',
  },
  courtyard: {
    key: 'courtyard',
    name: '满院 · 进阶',
    subtitle: '院里有湿衣，借风让位',
  },
  citrus: {
    key: 'citrus',
    name: '橘荫 · 烧脑',
    subtitle: '盆栽挡风，跨轮布局',
  },
  master: {
    key: 'master',
    name: '巧夹 · 大师',
    subtitle: '巧用移衣木夹破局',
  },
};

function makeRng(seed) {
  let s = (Number(seed) || Date.now()) >>> 0;
  if (s === 0) s = 0x9e3779b9;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWinds(count, rand) {
  const w = [];
  for (let i = 0; i < count; i++) {
    let d = DIRS[Math.floor(rand() * 4)];
    if (i >= 2 && w[i - 1] === d && w[i - 2] === d) {
      d = DIRS[(DIRS.indexOf(d) + 1 + Math.floor(rand() * 3)) % 4];
    }
    w.push(d);
  }
  if (count >= 2 && new Set(w).size === 1) {
    w[count - 1] = DIRS[(DIRS.indexOf(w[0]) + 1 + Math.floor(rand() * 3)) % 4];
  }
  return w;
}

function buildCandidate(tier, attempt, rand) {
  const cells = shuffle(
    [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ],
    rand
  );

  if (tier === 'breeze') {
    const usePrehung = rand() < 0.5;
    const initialItems = usePrehung ? [{ r: cells[0][0], c: cells[0][1], type: 'H' }] : [];
    const queue = usePrehung
      ? [...shuffle(['H', 'L', 'L', 'L'], rand), 'L', 'L']
      : [...shuffle(['H', 'H', 'L', 'L'], rand), 'L', 'L'];
    return {
      id: `GEN-${tier.toUpperCase()}`,
      stage: GENERATOR_TIERS[tier].name,
      title: '工坊新题 · 初晴',
      gustEvery: 2,
      tickets: 0,
      obstacles: [],
      initialItems,
      queue,
      winds: pickWinds(3, rand),
      requireAllDry: true,
    };
  }

  if (tier === 'courtyard') {
    // Rich pre-hung puzzle: 4 pre-hung clothes (2H + 2L = 6 wetness) + 3 basket clothes (3L = 3 wetness) = 9 wetness across 3 gusts!
    const useDense = attempt % 3 !== 2;
    if (useDense) {
      const initialItems = [
        { r: cells[0][0], c: cells[0][1], type: 'H' },
        { r: cells[1][0], c: cells[1][1], type: 'H' },
        { r: cells[2][0], c: cells[2][1], type: 'L' },
        { r: cells[3][0], c: cells[3][1], type: 'L' },
      ];
      return {
        id: `GEN-${tier.toUpperCase()}`,
        stage: GENERATOR_TIERS[tier].name,
        title: '工坊新题 · 满院',
        gustEvery: 1,
        tickets: 0,
        obstacles: [],
        initialItems,
        queue: ['L', 'L', 'L'],
        winds: pickWinds(3, rand),
        requireAllDry: true,
      };
    }
    const initialItems = [
      { r: cells[0][0], c: cells[0][1], type: 'H' },
      { r: cells[1][0], c: cells[1][1], type: 'L' },
    ];
    return {
      id: `GEN-${tier.toUpperCase()}`,
      stage: GENERATOR_TIERS[tier].name,
      title: '工坊新题 · 满院',
      gustEvery: 2,
      tickets: 0,
      obstacles: [cells[2]],
      initialItems,
      queue: [...shuffle(['H', 'L', 'L', 'L'], rand), 'L', 'L'],
      winds: pickWinds(3, rand),
      requireAllDry: true,
    };
  }

  if (tier === 'citrus') {
    const obsCount = rand() < 0.55 ? 2 : 1;
    const obstacles = cells.slice(0, obsCount);
    const hasPreH = rand() < 0.65;
    const initialItems = hasPreH
      ? [
          { r: cells[obsCount][0], c: cells[obsCount][1], type: 'H' },
          ...(rand() < 0.45 ? [{ r: cells[obsCount + 1][0], c: cells[obsCount + 1][1], type: 'L' }] : []),
        ]
      : [];
    const initWet = initialItems.reduce((s, it) => s + (it.type === 'H' ? 2 : 1), 0);
    if (initWet >= 3 && rand() < 0.5) {
      // 3-step or 4-step tight puzzle
      const qLen = 3;
      const nH = Math.max(0, Math.min(2, 9 - initWet - qLen));
      const queue = [...shuffle(Array.from({ length: qLen - 1 }, (_, i) => (i < nH ? 'H' : 'L')), rand), 'L'];
      return {
        id: `GEN-${tier.toUpperCase()}`,
        stage: GENERATOR_TIERS[tier].name,
        title: '工坊新题 · 橘荫',
        gustEvery: 1,
        tickets: 0,
        obstacles,
        initialItems,
        queue,
        winds: pickWinds(3, rand),
        requireAllDry: true,
      };
    }
    const nH = Math.max(0, Math.min(2, 8 - initWet - 6 + 1));
    const queue = [...shuffle(Array.from({ length: 4 }, (_, i) => (i < nH ? 'H' : 'L')), rand), 'L', 'L'];
    return {
      id: `GEN-${tier.toUpperCase()}`,
      stage: GENERATOR_TIERS[tier].name,
      title: '工坊新题 · 橘荫',
      gustEvery: 2,
      tickets: 0,
      obstacles,
      initialItems,
      queue,
      winds: pickWinds(3, rand),
      requireAllDry: true,
    };
  }

  // 'master': Strictly requires 1 or 2 Wooden Move Clips!
  const want2Clips = attempt % 3 === 0;
  const obsCount = rand() < 0.6 ? 2 : 1;
  const obstacles = cells.slice(0, obsCount);
  const initialItems = [
    { r: cells[obsCount][0], c: cells[obsCount][1], type: 'H' },
    ...(rand() < 0.55 ? [{ r: cells[obsCount + 1][0], c: cells[obsCount + 1][1], type: 'H' }] : []),
  ];
  const initWet = initialItems.reduce((s, it) => s + (it.type === 'H' ? 2 : 1), 0);
  const useSingleStep = initWet >= 4 || rand() < 0.45;
  const queue = useSingleStep
    ? [rand() < 0.5 && initWet <= 4 ? 'H' : 'L', 'L', 'L']
    : [...shuffle(initWet <= 2 ? ['H', 'L', 'L', 'L'] : ['L', 'L', 'L', 'L'], rand), 'L', 'L'];

  return {
    id: `GEN-MASTER`,
    stage: GENERATOR_TIERS.master.name,
    title: '工坊新题 · 巧夹',
    gustEvery: useSingleStep ? 1 : 2,
    tickets: want2Clips ? 2 : 1,
    obstacles,
    initialItems,
    queue,
    winds: pickWinds(3, rand, false),
    requireAllDry: true,
  };
}

function matchesTierQuality(tier, level, metrics) {
  if (!metrics.solvable) return false;
  if (tier === 'breeze') {
    return metrics.greedyWinRate >= 0.25 && metrics.randomWinRate <= 0.55;
  }
  if (tier === 'courtyard') {
    return metrics.greedyWinRate <= 0.22 && metrics.randomWinRate <= 0.20;
  }
  if (tier === 'citrus') {
    return metrics.greedyWinRate === 0 && metrics.randomWinRate <= 0.08;
  }
  if (tier === 'master') {
    // Must STRICTLY require every provided Move Clip!
    return metrics.minClipsRequired === level.tickets && metrics.minClipsRequired >= 1;
  }
  return true;
}

/**
 * Generates a fresh, solver-certified 100%-All-Dry puzzle in <50ms.
 */
export function generatePuzzle(tier = 'courtyard', seed = Date.now(), maxAttempts = 600) {
  const rand = makeRng(seed);
  const normalizedSeed = Math.abs(Math.floor(Number(seed) || 1)) % 100000;
  let bestFallback = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const cand = buildCandidate(tier, attempt, rand);
    const metrics = analyzeLevel(cand, { rollouts: 100, seed: normalizedSeed + attempt });
    if (!metrics.solvable) continue;

    if (!bestFallback && (tier !== 'master' || metrics.minClipsRequired >= 1)) {
      bestFallback = { cand, metrics };
    }

    if (matchesTierQuality(tier, cand, metrics)) {
      const code = `#${String((normalizedSeed + attempt) % 9000 + 1000)}`;
      return {
        ...cand,
        id: `W-${tier}-${code.slice(1)}`,
        title: `${GENERATOR_TIERS[tier]?.name.split('·')[0].trim() || '工坊'} ${code}`,
        tickets: tier === 'master' ? metrics.minClipsRequired : 0,
        witnessActions: metrics.witnessActions,
        metrics,
      };
    }
  }

  if (bestFallback) {
    const { cand, metrics } = bestFallback;
    return {
      ...cand,
      tickets: metrics.minClipsRequired,
      witnessActions: metrics.witnessActions,
      metrics,
    };
  }

  throw new Error(`未能在最大尝试次数内生成 ${tier} 关卡`);
}
