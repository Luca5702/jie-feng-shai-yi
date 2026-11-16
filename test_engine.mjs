import assert from 'node:assert/strict';
import {
  createInitialState,
  applyMoveAction,
  applyPlaceOrSkipAction,
  replayActionSequence,
  countRemainingGarmentsOnBoard,
} from './engine.js';
import { solveFromState, adviseNextAction, analyzeLevel } from './solver.js';
import { generatePuzzle } from './generator.js';
import { LEVELS } from './levels.js';

console.log('=== Running 《借风晒衣》 Engine + Exact Solver + Generator Test Suite ===');

// 1. Simultaneous wind resolution (no chain penetration when front dries)
let st = createInitialState({
  id: 'test-block',
  queue: ['L', 'L', 'L'],
  winds: ['W'],
  gustEvery: 3,
  tickets: 0,
});
st = applyPlaceOrSkipAction(st, { type: 'place', at: [0, 0] }).state;
st = applyPlaceOrSkipAction(st, { type: 'place', at: [0, 1] }).state;
st = applyPlaceOrSkipAction(st, { type: 'place', at: [0, 2] }).state;
assert.equal(st.driedCount, 1, 'Only front garment in Row 0 dries');
assert.equal(st.status, 'lost', '2 wet garments remain -> must NOT win under 100%-all-dry rule');
console.log('✓ Test 1 Passed: Simultaneous wind lock & 100%-all-dry win check');

// 2. Potted kumquat tree obstacle blocks wind behind it
let stTree = createInitialState({
  id: 'test-tree',
  obstacles: [[0, 0]],
  queue: ['L', 'L'],
  winds: ['W'],
  gustEvery: 2,
  tickets: 0,
});
assert.throws(() => applyPlaceOrSkipAction(stTree, { type: 'place', at: [0, 0] }), /不可挂衣/);
stTree = applyPlaceOrSkipAction(stTree, { type: 'place', at: [0, 1] }).state;
stTree = applyPlaceOrSkipAction(stTree, { type: 'place', at: [1, 0] }).state;
assert.equal(stTree.grid[0][1]?.wetness, 1, '(0,1) behind tree (0,0) must be blocked from West wind');
assert.equal(stTree.grid[1][0], null, '(1,0) in clear Row 1 must dry');
console.log('✓ Test 2 Passed: Potted kumquat tree blocks placement & casts wind shadow');

// 3. Verify all 20 Campaign Levels: 100% all-dry, strict monotonic difficulty, and exact clip necessity
assert.equal(LEVELS.length, 20, 'Campaign must contain 20 curated levels');
for (let i = 0; i < LEVELS.length; i++) {
  const lv = LEVELS[i];
  const { finalState } = replayActionSequence(lv, lv.witnessActions);
  assert.equal(finalState.status, 'won', `${lv.id} witness must win`);
  assert.equal(finalState.driedCount, finalState.totalGarments, `${lv.id} must dry 100% of garments`);
  assert.equal(countRemainingGarmentsOnBoard(finalState.grid), 0, `${lv.id} rack must be completely empty`);

  if (i > 0) {
    assert.ok(
      lv.difficulty > LEVELS[i - 1].difficulty,
      `Difficulty must strictly increase: ${LEVELS[i - 1].id}(${LEVELS[i - 1].difficulty}) < ${lv.id}(${lv.difficulty})`
    );
  }

  if (lv.chapter === 4) {
    const checkLess = analyzeLevel({ ...lv, tickets: lv.tickets - 1 }, { rollouts: 10 });
    assert.equal(
      checkLess.solvable,
      false,
      `${lv.id} must be strictly unsolvable with ${lv.tickets - 1} clips`
    );
  }
}
console.log('✓ Test 3 Passed: All 20 levels dry 100% of clothes, strictly increase in difficulty (11 -> 99), and Ch4 clips are strictly necessary');

// 4. Live solver hint & dead-end rewind advisor
const hardLv = LEVELS[15]; // L16
const s0 = createInitialState(hardLv);
const advOk = adviseNextAction(s0, []);
assert.equal(advOk.status, 'solvable');
assert.ok(advOk.nextAction, 'Advisor returns optimal next action on solvable board');

// Force a dead-end on L2 (put 2 shirts in same column under North wind)
const l2 = LEVELS[1];
const h0 = createInitialState(l2);
const h1 = applyPlaceOrSkipAction(h0, { type: 'place', at: [0, 0] }).state;
const h2Dead = applyPlaceOrSkipAction(h1, { type: 'place', at: [1, 0] }).state;
assert.equal(solveFromState(h2Dead).solvable, false, 'Blocking under 1-gust North wind is immediately detected as unsolvable');
const advDead = adviseNextAction(h2Dead, [h0, h1]);
assert.equal(advDead.status, 'deadend');
assert.equal(advDead.rewindToIndex, 1, 'Advisor pinpoints exact last solvable step (index 1)');
console.log('✓ Test 4 Passed: Live solver hint & exact dead-end rewind detection');

// 5. Procedural Puzzle Generator across all 4 tiers
for (const tier of ['breeze', 'courtyard', 'citrus', 'master']) {
  const gen = generatePuzzle(tier, 202611);
  const { finalState } = replayActionSequence(gen, gen.witnessActions);
  assert.equal(finalState.status, 'won', `Generated ${tier} puzzle must dry all garments`);
  assert.equal(countRemainingGarmentsOnBoard(finalState.grid), 0);
}
console.log('✓ Test 5 Passed: Procedural generator produces verified 100%-clear puzzles across all 4 tiers');
console.log('=== ALL TESTS PASSED ===');
