import assert from 'node:assert/strict';
import {
  createInitialState,
  computeWindForecast,
  applyMoveAction,
  applyPlaceOrSkipAction,
  replayActionSequence,
  diagnoseRemainingGarments,
  generateTwoLevelHints,
} from './engine.js';
import { LEVELS } from './levels.js';

console.log('=== Running 《借风晒衣》 v0.1 Automated Rule & Boundary Test Suite ===');

// 1. Verify Section 08 exact walkthrough (Level L1)
const l1 = LEVELS.find((l) => l.id === 'L1');
assert.ok(l1, 'L1 level exists');
const { finalState: s08 } = replayActionSequence(l1, l1.witnessActions);
assert.equal(s08.score, 21, 'Section 08 final score must be 21');
assert.equal(s08.collectedH, 3, 'Section 08 collected H must be 3');
assert.equal(s08.collectedL, 3, 'Section 08 collected L must be 3');
assert.equal(s08.tickets, 2, 'Section 08 unused tickets must be 2');
assert.equal(s08.status, 'won', 'Section 08 status must be won (21 >= 20)');
assert.deepEqual(
  s08.gustSummaries.map((g) => g.totalScoreAfter),
  [0, 9, 9, 21],
  'Section 08 cumulative scores after gusts 1..4 must be 0 -> 9 -> 9 -> 21'
);

// Check Section 08 final board state:
// Row 1: H:1, L:1, L:1; Row 2: H:1, L:1, H:1; Row 3: empty
assert.equal(s08.grid[0][0]?.type, 'H');
assert.equal(s08.grid[0][0]?.wetness, 1);
assert.equal(s08.grid[0][1]?.type, 'L');
assert.equal(s08.grid[0][2]?.type, 'L');
assert.equal(s08.grid[1][0]?.type, 'H');
assert.equal(s08.grid[1][1]?.type, 'L');
assert.equal(s08.grid[1][2]?.type, 'H');
assert.equal(s08.grid[2][0], null);
assert.equal(s08.grid[2][1], null);
assert.equal(s08.grid[2][2], null);
console.log('✓ Test 1 Passed: Section 08 exact 12-step walkthrough matches spec table 100%');

// 2. Boundary: Simultaneous wind resolution (no chain penetration when front dries)
let st = createInitialState({
  id: 'test-block',
  queue: ['L', 'L', 'L'],
  winds: ['W'],
  gustEvery: 3,
  tickets: 0,
  target: 6,
});
st = applyPlaceOrSkipAction(st, { type: 'place', at: [0, 0] }).state;
st = applyPlaceOrSkipAction(st, { type: 'place', at: [0, 1] }).state;
st = applyPlaceOrSkipAction(st, { type: 'place', at: [0, 2] }).state;
// All 3 L garments were in Row 0; West wind should ONLY hit (0,0) and collect it (+2), leaving (0,1) and (0,2) at wetness 1
assert.equal(st.score, 2, 'Only first garment in Row 0 should dry and score +2');
assert.equal(st.grid[0][0], null, '(0,0) dried and was removed');
assert.equal(st.grid[0][1]?.wetness, 1, '(0,1) was blocked and must remain wetness 1');
assert.equal(st.grid[0][2]?.wetness, 1, '(0,2) was blocked and must remain wetness 1');
console.log('✓ Test 2 Passed: Front garment blocking prevents wind penetration in same gust');

// 3. Boundary: Occupied cell / invalid coordinate rejection & 0-ticket move rejection
assert.throws(
  () => applyPlaceOrSkipAction(st, { type: 'place', at: [0, 1] }),
  /当前局已结束/,
  'Cannot place after endgame'
);
let st2 = createInitialState(l1);
st2 = applyPlaceOrSkipAction(st2, { type: 'place', at: [1, 1] }).state;
assert.throws(
  () => applyPlaceOrSkipAction(st2, { type: 'place', at: [1, 1] }),
  /已有衣物/,
  'Cannot place on occupied cell'
);
assert.throws(
  () => applyPlaceOrSkipAction(st2, { type: 'skip' }),
  /仍有空格/,
  'Cannot voluntarily skip when board has empty cells'
);
st2 = applyMoveAction(st2, 1, 1, 0, 0).state;
st2 = applyMoveAction(st2, 0, 0, 2, 2).state;
assert.equal(st2.tickets, 0);
assert.throws(
  () => applyMoveAction(st2, 2, 2, 0, 0),
  /剩余挪位券为 0/,
  'Cannot move when tickets === 0'
);
console.log('✓ Test 3 Passed: Occupied cells, premature skip, and 0-ticket moves are rejected');

// 4. Boundary: Full board on 12th item still triggers final wind gust via skip
let stFull = createInitialState({
  id: 'test-full',
  queue: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  winds: ['W', 'W', 'W', 'E'],
  gustEvery: 3,
  tickets: 0,
  target: 10,
});
// Fill board so that at step 12 all 9 cells are occupied
// Place 1..3 in row 0: (0,0),(0,1),(0,2) -> W hits (0,0) 2->1
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [0, 0] }).state;
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [0, 1] }).state;
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [0, 2] }).state;
// Place 4..6 in row 1: (1,0),(1,1),(1,2) -> W hits (0,0) 1->0 (+5) and (1,0) 2->1
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [1, 0] }).state;
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [1, 1] }).state;
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [1, 2] }).state;
// Refill (0,0) and place (2,0),(2,1) -> W hits (0,0) 2->1, (1,0) 1->0 (+5), (2,0) 2->1
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [0, 0] }).state;
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [2, 0] }).state;
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [2, 1] }).state;
// Now 8 cells occupied: only (1,0) and (2,2) empty -> 7 occupied. Let's place 10 at (1,0), 11 at (2,2) -> all 9 cells full!
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [1, 0] }).state;
stFull = applyPlaceOrSkipAction(stFull, { type: 'place', at: [2, 2] }).state;
// Step 12: board is 100% full (9/9 occupied). Must allow skip and trigger 4th gust!
const res12 = applyPlaceOrSkipAction(stFull, { type: 'skip' });
assert.ok(res12.gustTriggered, '12th item full-board skip must still trigger 4th wind gust');
assert.equal(res12.gustTriggered.gustNumber, 4);
assert.notEqual(res12.state.status, 'playing', 'Game must end after 12th item skip + 4th gust');
console.log('✓ Test 4 Passed: Full-board skip on 12th item triggers 4th wind gust and ends cleanly');

// 5. Verify all 15 levels and their witness paths
for (const lv of LEVELS) {
  const { finalState } = replayActionSequence(lv, lv.witnessActions);
  assert.equal(finalState.status, 'won', `Level ${lv.id} witness must win`);
  assert.ok(finalState.score >= lv.target, `Level ${lv.id} witness score >= target`);
}
console.log('✓ Test 5 Passed: All 15 level witness paths verified');
