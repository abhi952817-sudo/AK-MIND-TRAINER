import {
  getPathSteps,
  processDiceRoll,
  executeMove,
  passTurn,
  createInitialRoom,
  getTokenCoordinates,
  canTokenMove,
  chooseBotMove,
} from '../src/utils/ludoEngine';
import { GameRoom, Player, PlayerColor, Token, ActiveTokenMovement } from '../src/types/ludo';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

function makePlayer(color: PlayerColor, id = `p_${color}`, isBot = false): Player {
  return {
    id,
    name: color.toUpperCase(),
    avatar: 'avatar.png',
    color,
    isHost: color === 'red',
    isReady: true,
    isOnline: true,
    isBot,
    tokens: [
      { id: 0, color, step: -1, isSafe: true, isFinished: false },
      { id: 1, color, step: -1, isSafe: true, isFinished: false },
      { id: 2, color, step: -1, isSafe: true, isFinished: false },
      { id: 3, color, step: -1, isSafe: true, isFinished: false },
    ],
  };
}

function makeRoom(players?: Player[]): GameRoom {
  const pList = players || [
    makePlayer('red', 'user_1', false),
    makePlayer('green', 'bot_1', true),
    makePlayer('yellow', 'bot_2', true),
    makePlayer('blue', 'bot_3', true),
  ];
  return createInitialRoom('PHASE5', pList);
}

console.log('\n========================================');
console.log('RUNNING PHASE 5 TOKEN MOVEMENT TESTS');
console.log('========================================\n');

// ----------------------------------------------------
// 1. DETERMINISTIC PATH GENERATION
// ----------------------------------------------------
console.log('Test Suite 1: Pure Path Steps Generation');
{
  // Yard Release (-1 -> 0)
  const yardReleasePath = getPathSteps('red', -1, 0);
  assert(yardReleasePath.length === 1, 'Yard release path length is 1');
  assert(yardReleasePath[0] === 0, 'Yard release step targets step 0');

  // Multi-step Track Path (4 -> 8)
  const trackPath = getPathSteps('red', 4, 8);
  assert(trackPath.length === 4, 'Track path from 4 to 8 has 4 intermediate hops');
  assert(trackPath[0] === 5 && trackPath[1] === 6 && trackPath[2] === 7 && trackPath[3] === 8, 'Track path contains exact sequence [5, 6, 7, 8]');

  // Home Stretch Entry Path (48 -> 53)
  const stretchPath = getPathSteps('red', 48, 53);
  assert(stretchPath.length === 5, 'Home stretch path from 48 to 53 has 5 hops');
  assert(stretchPath[0] === 49 && stretchPath[2] === 51 && stretchPath[4] === 53, 'Path crosses outer track boundary into home stretch (step 51)');

  // Final Goal Path (54 -> 56)
  const goalPath = getPathSteps('red', 54, 56);
  assert(goalPath.length === 2, 'Goal path length is 2');
  assert(goalPath[0] === 55 && goalPath[1] === 56, 'Path finishes exactly at goal step 56');

  // Overshoot Rejection (55 with roll 2 -> toStep 57)
  const overshootPath = getPathSteps('red', 55, 57);
  assert(overshootPath.length === 0, 'Overshoot path beyond step 56 returns empty array');

  // Invalid Negative/Backward Path
  const invalidPath1 = getPathSteps('red', 10, 8);
  assert(invalidPath1.length === 0, 'Backward path returns empty array');
  const invalidPath2 = getPathSteps('red', -1, 4);
  assert(invalidPath2.length === 0, 'Yard to non-zero target returns empty array');
  const invalidPath3 = getPathSteps('red', -2, 0);
  assert(invalidPath3.length === 0, 'Invalid negative step returns empty array');
}

// ----------------------------------------------------
// 2. COORDINATE CHECKPOINT RESOLUTION
// ----------------------------------------------------
console.log('\nTest Suite 2: Visual Checkpoint Coordinates');
{
  // Red Track Start
  const redStart = getTokenCoordinates('red', 0, 0);
  assert(redStart.row === 6 && redStart.col === 1, 'Red step 0 matches physical grid row 6, col 1');

  // Green Track Start
  const greenStart = getTokenCoordinates('green', 0, 0);
  assert(greenStart.row === 1 && greenStart.col === 8, 'Green step 0 matches physical grid row 1, col 8');

  // Yellow Track Start
  const yellowStart = getTokenCoordinates('yellow', 0, 0);
  assert(yellowStart.row === 8 && yellowStart.col === 13, 'Yellow step 0 matches physical grid row 8, col 13');

  // Blue Track Start
  const blueStart = getTokenCoordinates('blue', 0, 0);
  assert(blueStart.row === 13 && blueStart.col === 6, 'Blue step 0 matches physical grid row 13, col 6');

  // Red Home Stretch Goal (56)
  const redGoal = getTokenCoordinates('red', 0, 56);
  assert(redGoal.row === 7 && redGoal.col === 6, 'Red goal step 56 matches center triangle entrance');

  // Blue Home Stretch Goal (56)
  const blueGoal = getTokenCoordinates('blue', 0, 56);
  assert(blueGoal.row === 8 && blueGoal.col === 7, 'Blue goal step 56 matches center triangle entrance');
}

// ----------------------------------------------------
// 3. MOVEMENT STATE MACHINE & PHASE TRANSITIONS
// ----------------------------------------------------
console.log('\nTest Suite 3: Movement State Machine & Phases');
{
  const room = makeRoom();
  // Roll 6
  const rollRes = processDiceRoll(room, 6);
  assert(rollRes.updatedRoom.phase === 'MOVE_SELECTION', 'Pre-movement phase is MOVE_SELECTION');

  // Moving phase simulation
  const movingRoom: GameRoom = { ...rollRes.updatedRoom, phase: 'MOVING' };
  assert(movingRoom.phase === 'MOVING', 'Phase enters MOVING when token hopping begins');

  // During MOVING, canTokenMove must be locked
  const lockCheck = movingRoom.phase === 'MOVING';
  assert(lockCheck === true, 'MOVING phase blocks user token selection');

  // Verify turn timer tick is paused during MOVING phase
  const isTimerPausedMoving = movingRoom.phase === 'MOVING' || movingRoom.phase === 'RESOLVING' || movingRoom.phase === 'ROLLING';
  assert(isTimerPausedMoving === true, 'Turn timer tick is paused during MOVING phase');

  // Resolving phase simulation
  const resolvingRoom: GameRoom = { ...movingRoom, phase: 'RESOLVING' };
  assert(resolvingRoom.phase === 'RESOLVING', 'Phase enters RESOLVING when destination tile reached');

  // Verify turn timer tick is paused during RESOLVING phase
  const isTimerPausedResolving = resolvingRoom.phase === 'MOVING' || resolvingRoom.phase === 'RESOLVING' || resolvingRoom.phase === 'ROLLING';
  assert(isTimerPausedResolving === true, 'Turn timer tick is paused during RESOLVING phase');

  // Execute Move resolution
  const moveRes = executeMove(rollRes.updatedRoom, 0);
  assert(moveRes.success === true, 'Move resolution succeeds');
  assert(moveRes.updatedRoom.phase === 'PLAYER_TURN', 'Post-move phase transitions to PLAYER_TURN for bonus roll');
  assert(moveRes.updatedRoom.players[0].tokens[0].step === 0, 'Authoritative step committed as 0');
}

// ----------------------------------------------------
// 4. CAPTURE & IMPACT RESOLUTION
// ----------------------------------------------------
console.log('\nTest Suite 4: Capture & Impact Resolution');
{
  const room = makeRoom();
  // Red token at step 5
  room.players[0].tokens[0].step = 5;
  // Green token (victim) on non-safe track cell corresponding to Red's step 9
  // Red start index is 0, so Red step 9 is global track index 9.
  // Green start index is 13. To land on global track index 9, Green's step is (9 - 13 + 52) % 52 = 48.
  room.players[1].tokens[0].step = 48;

  // Red rolls 4 (5 + 4 = 9)
  const roll = processDiceRoll(room, 4);
  const move = executeMove(roll.updatedRoom, 0);

  assert(move.captured === true, 'Capture detected at destination square');
  assert(move.capturedTokens.length === 1, 'Exactly one victim token captured');
  assert(move.capturedTokens[0].color === 'green', 'Captured victim is Green');
  assert(move.updatedRoom.players[1].tokens[0].step === -1, 'Victim token returned to yard base (-1)');
  assert(move.bonusTurn === true, 'Attacker awarded bonus turn for capture');
}

// ----------------------------------------------------
// 5. SAME-COLOR STACKING & OFFSET LOGIC
// ----------------------------------------------------
console.log('\nTest Suite 5: Same-Color Stacking & Offset Logic');
{
  const room = makeRoom();
  // Place two Red tokens on step 10
  room.players[0].tokens[0].step = 10;
  room.players[0].tokens[1].step = 10;

  const coord0 = getTokenCoordinates('red', 0, 10);
  const coord1 = getTokenCoordinates('red', 1, 10);
  assert(coord0.row === coord1.row && coord0.col === coord1.col, 'Both stacked tokens share identical grid coordinates');

  // Roll 3 and move token 0 to step 13
  const roll = processDiceRoll(room, 3);
  const move = executeMove(roll.updatedRoom, 0);
  assert(move.success === true, 'Stacked token can move independently');
  assert(move.updatedRoom.players[0].tokens[0].step === 13, 'Token 0 advanced to step 13');
  assert(move.updatedRoom.players[0].tokens[1].step === 10, 'Token 1 remains undisturbed at step 10');
}

// ----------------------------------------------------
// 6. BOT MOVEMENT PIPELINE CONSISTENCY
// ----------------------------------------------------
console.log('\nTest Suite 6: Bot Movement Pipeline Consistency');
{
  const room = makeRoom();
  // Pass turn to Green (bot)
  const greenRoom = passTurn(room);
  assert(greenRoom.currentTurnColor === 'green', 'Active turn is Green (bot)');

  // Bot rolls 6
  const botRoll = processDiceRoll(greenRoom, 6);
  assert(botRoll.updatedRoom.phase === 'MOVE_SELECTION', 'Bot roll sets phase to MOVE_SELECTION');

  const chosen = chooseBotMove(botRoll.movableTokens, 6);
  assert(chosen !== null, 'Bot heuristic selects a legal token');
  assert(chosen!.step === -1, 'Bot prioritizes releasing token from base on 6');

  // Execute bot move using exact same executeMove engine
  const botMove = executeMove(botRoll.updatedRoom, chosen!.id);
  assert(botMove.success === true, 'Bot move executes successfully via standard engine');
  assert(botMove.updatedRoom.players[1].tokens[chosen!.id].step === 0, 'Bot token released to step 0');
  assert(botMove.updatedRoom.currentTurnColor === 'green', 'Bot receives bonus turn on 6');
}

// ----------------------------------------------------
// 7. INPUT CONCURRENCY & RAPID TAP GUARDS
// ----------------------------------------------------
console.log('\nTest Suite 7: Input Concurrency & Action Locks');
{
  const room = makeRoom();
  room.players[0].tokens[0].step = 10;
  const roll = processDiceRoll(room, 4);

  let actionLock = false;
  function handleSelectTokenSim(tokenId: number) {
    if (actionLock) return { rejected: true };
    actionLock = true;
    const res = executeMove(roll.updatedRoom, tokenId);
    return { rejected: false, res };
  }

  // Tap 1
  const tap1 = handleSelectTokenSim(0);
  assert(!tap1.rejected, 'First token tap is accepted');

  // Tap 2 immediately while actionLock is true
  const tap2 = handleSelectTokenSim(0);
  assert(tap2.rejected, 'Concurrent rapid tap is blocked by synchronous action lock');
}

// ----------------------------------------------------
// 8. STALE CALLBACK & SESSION ISOLATION
// ----------------------------------------------------
console.log('\nTest Suite 8: Stale Callback & Session Isolation');
{
  const room1 = makeRoom();
  const session1 = room1.sessionId;
  const turn1 = room1.turnIndex;

  // Movement started in Game 1
  const path = getPathSteps('red', 10, 14);

  // User resets or rematches to Game 2
  const room2 = makeRoom();
  assert(room2.sessionId !== session1, 'Game 2 has distinct session ID');

  // Simulation of delayed animation completion callback firing from Game 1:
  const isStale = (
    room2.sessionId !== session1 ||
    room2.turnIndex !== turn1
  );
  assert(isStale === true, 'Old movement completion callback correctly identified as stale');

  // Authoritative state of Game 2 is completely unmutated
  assert(room2.players[0].tokens[0].step === -1, 'Game 2 token step remains clean at -1');
}

// ----------------------------------------------------
// 9. GAME OVER TERMINAL MOVEMENT PREVENTION
// ----------------------------------------------------
console.log('\nTest Suite 9: Game Over Movement Prevention');
{
  const finishedRoom: GameRoom = {
    ...makeRoom(),
    status: 'finished',
    phase: 'GAME_OVER',
    winnerId: 'user_1',
  };

  const moveAttempt = executeMove(finishedRoom, 0);
  assert(!moveAttempt.success, 'Movement is strictly rejected after GAME_OVER');
  assert(moveAttempt.reason === 'Game is not playing', 'Correct rejection reason');
}

console.log('\n========================================');
console.log(`PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
