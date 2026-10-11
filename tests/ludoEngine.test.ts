import {
  TRACK_COORDINATES,
  HOME_COLUMNS,
  BASE_POSITIONS,
  COLOR_START_INDEX,
  SAFE_TRACK_INDICES,
  getGlobalTrackIndex,
  getTokenCoordinates,
  isSafePosition,
  canTokenMove,
  getMovableTokens,
  calculateDestination,
  processDiceRoll,
  executeMove,
  getNextPlayerColor,
  chooseBotMove,
} from '../src/utils/ludoEngine';
import { GameRoom, Player, PlayerColor, Token } from '../src/types/ludo';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

function createTestPlayer(color: PlayerColor, id: string = `p_${color}`): Player {
  return {
    id,
    name: color.toUpperCase(),
    avatar: 'avatar.png',
    color,
    isHost: color === 'red',
    isReady: true,
    isOnline: true,
    isBot: color !== 'red',
    tokens: [
      { id: 0, color, step: -1, isSafe: true, isFinished: false },
      { id: 1, color, step: -1, isSafe: true, isFinished: false },
      { id: 2, color, step: -1, isSafe: true, isFinished: false },
      { id: 3, color, step: -1, isSafe: true, isFinished: false },
    ],
  };
}

function createTestRoom(players?: Player[]): GameRoom {
  const pList = players || [
    createTestPlayer('red'),
    createTestPlayer('green'),
    createTestPlayer('yellow'),
    createTestPlayer('blue'),
  ];
  return {
    id: 'test_room',
    code: 'TEST77',
    hostId: pList[0].id,
    maxPlayers: 4,
    status: 'playing',
    phase: 'PLAYER_TURN',
    turnIndex: 1,
    sessionId: 'test_session_1',
    players: pList,
    currentTurnColor: 'red',
    diceValue: 6,
    hasRolledDice: true,
    turnTimeRemaining: 25,
    winnerId: null,
    consecutiveSixes: 0,
  };
}

console.log('\n========================================');
console.log('RUNNING PHASE 2 CORE LUDO ENGINE TESTS');
console.log('========================================\n');

// ----------------------------------------------------
// A. BASE MOVEMENT & TOKEN RELEASE RULE
// ----------------------------------------------------
console.log('Test Suite A: Base Movement & Yard Release');
{
  const token: Token = { id: 0, color: 'red', step: -1, isSafe: true, isFinished: false };
  assert(!canTokenMove(token, 1), 'Dice 1 cannot release from yard');
  assert(!canTokenMove(token, 2), 'Dice 2 cannot release from yard');
  assert(!canTokenMove(token, 3), 'Dice 3 cannot release from yard');
  assert(!canTokenMove(token, 4), 'Dice 4 cannot release from yard');
  assert(!canTokenMove(token, 5), 'Dice 5 cannot release from yard');
  assert(canTokenMove(token, 6), 'Dice 6 can release from yard to step 0');

  const dest = calculateDestination(token, 6);
  assert(dest !== null && dest.nextStep === 0, 'Release destination is step 0');
  assert(dest !== null && dest.isSafe === true, 'Starting cell (step 0) is safe');
}

// ----------------------------------------------------
// B. TRACK MOVEMENT & 52-TILE COORDINATES
// ----------------------------------------------------
console.log('\nTest Suite B: Track Movement & Global Coordinates');
{
  assert(TRACK_COORDINATES.length === 52, 'Track has exactly 52 coordinates');
  assert(COLOR_START_INDEX.red === 0, 'Red start index is 0');
  assert(COLOR_START_INDEX.green === 13, 'Green start index is 13');
  assert(COLOR_START_INDEX.yellow === 26, 'Yellow start index is 26');
  assert(COLOR_START_INDEX.blue === 39, 'Blue start index is 39');

  const token: Token = { id: 0, color: 'red', step: 10, isSafe: false, isFinished: false };
  assert(canTokenMove(token, 4), 'Token at step 10 can move 4 steps');
  const dest = calculateDestination(token, 4);
  assert(dest !== null && dest.nextStep === 14, 'Step 10 + 4 = 14');
  assert(getGlobalTrackIndex('red', 14) === 14, 'Red global track index matches step');
  assert(getGlobalTrackIndex('green', 0) === 13, 'Green step 0 maps to global index 13');
}

// ----------------------------------------------------
// C. HOME ENTRANCE & PATH CALCULATION FOR ALL 4 COLORS
// ----------------------------------------------------
console.log('\nTest Suite C: Home Entrance for All 4 Colors');
{
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  for (const c of colors) {
    const lastTrackIdx = getGlobalTrackIndex(c, 50);
    assert(lastTrackIdx !== null, `${c.toUpperCase()} step 50 maps to valid track index (${lastTrackIdx})`);
    const homeFirstCoord = HOME_COLUMNS[c][0];
    const trackLastCoord = TRACK_COORDINATES[lastTrackIdx!];
    // Distance between last track square and first home stretch square must be exactly 1 tile
    const dRow = Math.abs(homeFirstCoord.row - trackLastCoord.row);
    const dCol = Math.abs(homeFirstCoord.col - trackLastCoord.col);
    const isAdjacent = (dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1);
    assert(isAdjacent, `${c.toUpperCase()} track end is physically adjacent to home stretch start`);
  }
}

// ----------------------------------------------------
// D. HOME STRETCH & SAFE STATUS
// ----------------------------------------------------
console.log('\nTest Suite D: Home Stretch Traversal');
{
  const token: Token = { id: 0, color: 'green', step: 51, isSafe: true, isFinished: false };
  assert(canTokenMove(token, 3), 'Token in home stretch step 51 can move 3');
  const dest = calculateDestination(token, 3);
  assert(dest !== null && dest.nextStep === 54, 'Destination in home stretch is step 54');
  assert(isSafePosition('green', 54), 'Home stretch step 54 is completely safe');
}

// ----------------------------------------------------
// E. EXACT FINISH RULE & F. OVERSHOOT REJECTION
// ----------------------------------------------------
console.log('\nTest Suite E & F: Exact Finish and Overshoot Rejection');
{
  const token55: Token = { id: 0, color: 'yellow', step: 55, isSafe: true, isFinished: false };
  assert(canTokenMove(token55, 1), 'Token at 55 can finish on exact 1');
  assert(!canTokenMove(token55, 2), 'Token at 55 REJECTS roll 2 (overshoot)');
  assert(!canTokenMove(token55, 6), 'Token at 55 REJECTS roll 6 (overshoot)');

  const dest = calculateDestination(token55, 1);
  assert(dest !== null && dest.nextStep === 56 && dest.reachedHome === true, 'Step 55 + 1 reaches home (step 56)');

  const token54: Token = { id: 1, color: 'blue', step: 54, isSafe: true, isFinished: false };
  assert(canTokenMove(token54, 2), 'Token at 54 can finish on exact 2');
  assert(!canTokenMove(token54, 3), 'Token at 54 REJECTS roll 3');
}

// ----------------------------------------------------
// G. SAFE CELLS PROTECT FROM CAPTURE
// ----------------------------------------------------
console.log('\nTest Suite G: Safe Cell Protection');
{
  assert(SAFE_TRACK_INDICES.length === 8, 'Exactly 8 safe track indices exist');
  for (const idx of [0, 8, 13, 21, 26, 34, 39, 47]) {
    assert(SAFE_TRACK_INDICES.includes(idx), `Track index ${idx} is safe`);
  }

  // Set up room: Blue token standing on Red's start square (index 0 - Safe)
  const room = createTestRoom();
  room.currentTurnColor = 'red';
  room.diceValue = 6;
  room.hasRolledDice = true;
  // Put Blue token at global index 0 (which is Blue step 13: (39+13)%52 = 0)
  room.players.find(p => p.color === 'blue')!.tokens[0] = {
    id: 0,
    color: 'blue',
    step: 13,
    isSafe: true,
    isFinished: false,
  };

  // Red releases token from base (lands on step 0, global index 0)
  const result = executeMove(room, 0);
  assert(result.success, 'Red release move succeeded');
  assert(!result.captured, 'Capture prevented on safe cell');
  const blueToken = result.updatedRoom.players.find(p => p.color === 'blue')!.tokens[0];
  assert(blueToken.step === 13, 'Blue token remained intact on safe square');
}

// ----------------------------------------------------
// H. CAPTURE / KILL RULE
// ----------------------------------------------------
console.log('\nTest Suite H: Capture on Non-Safe Cell');
{
  const room = createTestRoom();
  room.currentTurnColor = 'red';
  room.diceValue = 3;
  room.hasRolledDice = true;

  // Red token at step 2 (global index 2, not safe)
  room.players.find(p => p.color === 'red')!.tokens[0] = {
    id: 0,
    color: 'red',
    step: 2,
    isSafe: false,
    isFinished: false,
  };

  // Green token at step 41 -> global index (13 + 41) % 52 = 54 % 52 = 2 (not safe)
  // Wait, let's put green at step (52 - 13 + 5) % 52 = step 44: (13 + 44) % 52 = 5
  // Red moves from step 2 with dice 3 -> lands on step 5 (global index 5, not safe)
  room.players.find(p => p.color === 'green')!.tokens[0] = {
    id: 0,
    color: 'green',
    step: 44, // (13 + 44) % 52 = 5
    isSafe: false,
    isFinished: false,
  };

  const result = executeMove(room, 0);
  assert(result.success, 'Red attack move succeeded');
  assert(result.captured, 'Opponent was captured');
  assert(result.bonusTurn, 'Attacker awarded bonus turn on capture');

  const greenVictim = result.updatedRoom.players.find(p => p.color === 'green')!.tokens[0];
  assert(greenVictim.step === -1, 'Victim token sent back to base (-1)');
  assert(result.updatedRoom.currentTurnColor === 'red', 'Turn stays with Red after capture');
}

// ----------------------------------------------------
// I. SAME-COLOR STACKING
// ----------------------------------------------------
console.log('\nTest Suite I: Same-Color Stacking');
{
  const room = createTestRoom();
  room.currentTurnColor = 'red';
  room.diceValue = 2;
  room.hasRolledDice = true;

  // Red token 0 already at step 5
  room.players.find(p => p.color === 'red')!.tokens[0] = {
    id: 0,
    color: 'red',
    step: 5,
    isSafe: false,
    isFinished: false,
  };
  // Red token 1 at step 3, moving with dice 2 -> lands on step 5
  room.players.find(p => p.color === 'red')!.tokens[1] = {
    id: 1,
    color: 'red',
    step: 3,
    isSafe: false,
    isFinished: false,
  };

  const result = executeMove(room, 1);
  assert(result.success, 'Red token 1 moved successfully');
  assert(!result.captured, 'Same color tokens do not capture each other');
  const t0 = result.updatedRoom.players.find(p => p.color === 'red')!.tokens[0];
  const t1 = result.updatedRoom.players.find(p => p.color === 'red')!.tokens[1];
  assert(t0.step === 5 && t1.step === 5, 'Both tokens coexist on step 5 (stacking)');
}

// ----------------------------------------------------
// J. SIX RULE & K. THREE CONSECUTIVE SIXES PENALTY
// ----------------------------------------------------
console.log('\nTest Suite J & K: Six Rule and 3 Consecutive Sixes Penalty');
{
  const room = createTestRoom();
  room.consecutiveSixes = 0;

  // Roll 1: Six
  const r1 = processDiceRoll(room, 6);
  assert(r1.updatedRoom.consecutiveSixes === 1, 'Consecutive sixes count = 1');
  assert(!r1.isThreeSixesPenalty, 'Not penalized on first 6');

  // Roll 2: Six
  const r2 = processDiceRoll(r1.updatedRoom, 6);
  assert(r2.updatedRoom.consecutiveSixes === 2, 'Consecutive sixes count = 2');
  assert(!r2.isThreeSixesPenalty, 'Not penalized on second 6');

  // Roll 3: Six -> PENALTY TRIGGERED!
  const r3 = processDiceRoll(r2.updatedRoom, 6);
  assert(r3.isThreeSixesPenalty === true, 'Three sixes penalty triggered on 3rd six');
  assert(r3.updatedRoom.consecutiveSixes === 0, 'Consecutive sixes counter reset to 0');
  assert(r3.updatedRoom.hasRolledDice === false, 'hasRolledDice reset to false on forfeit');
  assert(r3.updatedRoom.currentTurnColor === 'green', 'Turn automatically passed to next player');
  assert(r3.movableTokens.length === 0, 'No movable tokens allowed on forfeited turn');
}

// ----------------------------------------------------
// L. NO LEGAL MOVE PASS
// ----------------------------------------------------
console.log('\nTest Suite L: No Legal Move');
{
  const room = createTestRoom();
  // All Red tokens in base (-1)
  const rollRes = processDiceRoll(room, 4); // Dice 4 cannot move any base token
  assert(!rollRes.hasLegalMoves, 'No legal moves detected for roll 4 with all tokens in base');
  assert(rollRes.movableTokens.length === 0, 'Movable tokens array is empty');
}

// ----------------------------------------------------
// M. MULTIPLE LEGAL TOKENS
// ----------------------------------------------------
console.log('\nTest Suite M: Multiple Legal Tokens');
{
  const room = createTestRoom();
  const redPlayer = room.players.find(p => p.color === 'red')!;
  redPlayer.tokens[0].step = 10;
  redPlayer.tokens[1].step = 20;
  redPlayer.tokens[2].step = 30;

  const movable = getMovableTokens(redPlayer, 4);
  assert(movable.length === 3, 'Returns all 3 movable tokens on track');
}

// ----------------------------------------------------
// N. WRONG PLAYER & ILLEGAL MOVE PROTECTION
// ----------------------------------------------------
console.log('\nTest Suite N: Illegal Move Protections');
{
  const room = createTestRoom();
  room.currentTurnColor = 'red';
  room.diceValue = 3;
  room.hasRolledDice = true;

  // Attempt to move without rolling
  const unrolledRoom = { ...room, hasRolledDice: false };
  const res1 = executeMove(unrolledRoom, 0);
  assert(!res1.success, 'Rejects move when dice has not been rolled');

  // Attempt to move token that cannot move (in base with dice 3)
  const res2 = executeMove(room, 0);
  assert(!res2.success, 'Rejects moving base token with dice 3');

  // Attempt to move when game is already finished
  const finishedRoom = { ...room, status: 'finished' as const };
  const res3 = executeMove(finishedRoom, 0);
  assert(!res3.success, 'Rejects move when game status is finished');
}

// ----------------------------------------------------
// O. FINISHED TOKEN IMMUNITY
// ----------------------------------------------------
console.log('\nTest Suite O: Finished Token Immunity');
{
  const finishedToken: Token = { id: 0, color: 'red', step: 56, isSafe: true, isFinished: true };
  assert(!canTokenMove(finishedToken, 1), 'Finished token cannot move on dice 1');
  assert(!canTokenMove(finishedToken, 6), 'Finished token cannot move on dice 6');
}

// ----------------------------------------------------
// P. WIN CONDITION
// ----------------------------------------------------
console.log('\nTest Suite P: Win Condition (All 4 Tokens Finished)');
{
  const room = createTestRoom();
  const redPlayer = room.players.find(p => p.color === 'red')!;
  redPlayer.tokens[0] = { id: 0, color: 'red', step: 56, isSafe: true, isFinished: true };
  redPlayer.tokens[1] = { id: 1, color: 'red', step: 56, isSafe: true, isFinished: true };
  redPlayer.tokens[2] = { id: 2, color: 'red', step: 56, isSafe: true, isFinished: true };
  // Token 3 at step 55, moving with dice 1 into finish!
  redPlayer.tokens[3] = { id: 3, color: 'red', step: 55, isSafe: true, isFinished: false };

  room.currentTurnColor = 'red';
  room.diceValue = 1;
  room.hasRolledDice = true;

  const result = executeMove(room, 3);
  assert(result.success, 'Winning move succeeded');
  assert(result.reachedHome, 'Token reached home');
  assert(result.updatedRoom.status === 'finished', 'Game status transitioned to finished');
  assert(result.updatedRoom.winnerId === redPlayer.id, 'Winner ID matches Red player');
  assert(!result.bonusTurn, 'No bonus turn awarded after winning the match');
}

// ----------------------------------------------------
// Q. TURN TRANSITION & SKIPPING FINISHED PLAYERS
// ----------------------------------------------------
console.log('\nTest Suite Q: Turn Transition Order');
{
  const players = [
    createTestPlayer('red'),
    createTestPlayer('green'),
    createTestPlayer('yellow'),
    createTestPlayer('blue'),
  ];

  // Make Green finished
  players[1].tokens.forEach(t => { t.step = 56; t.isFinished = true; });

  const nextAfterRed = getNextPlayerColor(players, 'red');
  assert(nextAfterRed === 'yellow', 'Clockwise rotation skips finished Green player and goes directly to Yellow');
  const nextAfterYellow = getNextPlayerColor(players, 'yellow');
  assert(nextAfterYellow === 'blue', 'Yellow transitions to Blue');
  const nextAfterBlue = getNextPlayerColor(players, 'blue');
  assert(nextAfterBlue === 'red', 'Blue transitions back to Red');
}

// ----------------------------------------------------
// R. BOT DECISION ENGINE CONSISTENCY
// ----------------------------------------------------
console.log('\nTest Suite R: Bot Decision Engine Heuristics');
{
  // Test 1: Release token on 6
  const tokens1: Token[] = [
    { id: 0, color: 'blue', step: -1, isSafe: true, isFinished: false },
    { id: 1, color: 'blue', step: 20, isSafe: false, isFinished: false },
  ];
  const choice1 = chooseBotMove(tokens1, 6);
  assert(choice1 !== null && choice1.id === 0, 'Bot prioritizes releasing base token on 6');

  // Test 2: Finish into home goal
  const tokens2: Token[] = [
    { id: 0, color: 'blue', step: 10, isSafe: false, isFinished: false },
    { id: 1, color: 'blue', step: 54, isSafe: true, isFinished: false }, // 54 + 2 = 56
  ];
  const choice2 = chooseBotMove(tokens2, 2);
  assert(choice2 !== null && choice2.id === 1, 'Bot prioritizes scoring into home goal');

  // Test 3: Advance furthest token
  const tokens3: Token[] = [
    { id: 0, color: 'blue', step: 12, isSafe: false, isFinished: false },
    { id: 1, color: 'blue', step: 35, isSafe: false, isFinished: false },
  ];
  const choice3 = chooseBotMove(tokens3, 3);
  assert(choice3 !== null && choice3.id === 1, 'Bot advances furthest token along track');
}

console.log('\n========================================');
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
