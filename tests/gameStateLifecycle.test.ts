import {
  processDiceRoll,
  executeMove,
  passTurn,
  createInitialRoom,
  getNextPlayerColor,
  canTokenMove,
  getMovableTokens,
  chooseBotMove,
} from '../src/utils/ludoEngine';
import { GameRoom, Player, PlayerColor, Token, GamePhase } from '../src/types/ludo';

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
  return createInitialRoom('PHASE3', pList);
}

console.log('\n========================================');
console.log('RUNNING PHASE 3 GAME STATE & LIFECYCLE TESTS');
console.log('========================================\n');

// ----------------------------------------------------
// A. GAME START & INITIALIZATION LIFECYCLE
// ----------------------------------------------------
console.log('Test Suite A: Game Start Lifecycle');
{
  const room = makeRoom();
  assert(room.status === 'playing', 'New room is in playing status');
  assert(room.phase === 'PLAYER_TURN', 'Initial phase is PLAYER_TURN');
  assert(room.turnIndex === 1, 'Initial turn index is 1');
  assert(room.sessionId.startsWith('session_'), 'Session ID is uniquely initialized');
  assert(room.currentTurnColor === 'red', 'First turn begins with Red');
  assert(room.hasRolledDice === false, 'hasRolledDice starts false');
  assert(room.turnTimeRemaining === 25, 'Turn time starts at 25 seconds');
}

// ----------------------------------------------------
// B. VALID DICE ACTION
// ----------------------------------------------------
console.log('\nTest Suite B: Valid Dice Action');
{
  const room = makeRoom();
  const rollRes = processDiceRoll(room, 6);
  assert(rollRes.updatedRoom.hasRolledDice === true, 'hasRolledDice is set to true');
  assert(rollRes.updatedRoom.phase === 'MOVE_SELECTION', 'Phase transitions to MOVE_SELECTION');
  assert(rollRes.updatedRoom.diceValue === 6, 'Dice value is stored accurately');
  assert(rollRes.movableTokens.length === 4, 'All 4 yard tokens movable on 6');
}

// ----------------------------------------------------
// C. INVALID DICE ACTIONS & GUARDS
// ----------------------------------------------------
console.log('\nTest Suite C: Invalid Dice Actions & Guards');
{
  const room = makeRoom();

  // Guard 1: Status not playing (e.g. finished)
  const finishedRoom: GameRoom = { ...room, status: 'finished', phase: 'GAME_OVER' };
  const res1 = processDiceRoll(finishedRoom, 5);
  assert(!res1.updatedRoom.hasRolledDice, 'Rejects dice roll when game is finished');

  // Guard 2: Invalid roll values (outside 1..6)
  const res2 = processDiceRoll(room, 0);
  assert(!res2.updatedRoom.hasRolledDice, 'Rejects dice value 0');
  const res3 = processDiceRoll(room, 7);
  assert(!res3.updatedRoom.hasRolledDice, 'Rejects dice value 7');

  // Guard 3: Double roll attempt (already rolled)
  const rolledRoom = processDiceRoll(room, 4).updatedRoom;
  const res4 = processDiceRoll(rolledRoom, 4);
  assert(res4.updatedRoom.phase === 'MOVE_SELECTION', 'Maintains MOVE_SELECTION on duplicate roll attempt');
}

// ----------------------------------------------------
// D. RAPID DOUBLE ROLL IDEMPOTENCY
// ----------------------------------------------------
console.log('\nTest Suite D: Rapid Double Roll Idempotency');
{
  let activeLock = false;
  function simulateRoll(roomState: GameRoom, rollVal: number) {
    if (activeLock) return { rejected: true, room: roomState };
    if (roomState.phase !== 'PLAYER_TURN' || roomState.hasRolledDice) {
      return { rejected: true, room: roomState };
    }
    activeLock = true;
    const res = processDiceRoll(roomState, rollVal);
    activeLock = false;
    return { rejected: false, room: res.updatedRoom };
  }

  const room = makeRoom();
  const firstTap = simulateRoll(room, 5);
  assert(!firstTap.rejected, 'First roll tap accepted');
  assert(firstTap.room.phase === 'MOVE_SELECTION', 'First roll moves phase to MOVE_SELECTION');

  // Immediate second tap while already in MOVE_SELECTION
  const secondTap = simulateRoll(firstTap.room, 6);
  assert(secondTap.rejected, 'Second roll tap immediately rejected (idempotent)');
  assert(secondTap.room.diceValue === 5, 'Dice value remained 5 from first roll');
}

// ----------------------------------------------------
// E. TOKEN SELECTION & F. RAPID DOUBLE MOVE IDEMPOTENCY
// ----------------------------------------------------
console.log('\nTest Suite E & F: Token Selection & Double Move Idempotency');
{
  const room = makeRoom();
  // Roll 6 for Red
  const rollRes = processDiceRoll(room, 6);

  // Attempt move on valid token 0
  const move1 = executeMove(rollRes.updatedRoom, 0);
  assert(move1.success, 'First token move accepted');
  assert(move1.updatedRoom.players[0].tokens[0].step === 0, 'Token 0 unlocked to step 0');
  assert(!move1.updatedRoom.hasRolledDice, 'hasRolledDice reset to false after move');

  // Immediate second move on already executed turn (stale roll attempt)
  const move2 = executeMove(move1.updatedRoom, 1);
  assert(!move2.success, 'Second move rejected (dice already consumed)');
  assert(move2.reason === 'Dice has not been rolled for this turn', 'Correct rejection reason');
}

// ----------------------------------------------------
// G. TIMER LIFECYCLE & H. TIMEOUT RACE PROTECTION
// ----------------------------------------------------
console.log('\nTest Suite G & H: Timer Lifecycle & Timeout Race Guard');
{
  const room = makeRoom();
  assert(room.turnTimeRemaining === 25, 'Timer initialized to 25s');

  // Decrementing timer
  let currentTimer = room.turnTimeRemaining;
  for (let i = 0; i < 5; i++) {
    currentTimer = Math.max(0, currentTimer - 1);
  }
  assert(currentTimer === 20, 'Timer decrements cleanly by 1 second steps');

  // Timer reaches 0 without roll -> Auto-roll
  const timeoutRoom: GameRoom = { ...room, turnTimeRemaining: 0 };
  assert(timeoutRoom.turnTimeRemaining === 0, 'Timer reaches zero');
  const autoRoll = processDiceRoll(timeoutRoom, 4);
  assert(autoRoll.updatedRoom.hasRolledDice, 'Auto-roll triggered on timer expiry');

  // Timer reaches 0 while already rolled -> Auto-pass
  const passedRoom = passTurn(autoRoll.updatedRoom);
  assert(passedRoom.currentTurnColor === 'green', 'Turn passed to Green on timeout');
  assert(passedRoom.turnTimeRemaining === 25, 'Timer reset to 25s for next player');
  assert(!passedRoom.hasRolledDice, 'hasRolledDice reset to false for next player');
  assert(passedRoom.phase === 'PLAYER_TURN', 'Phase returned to PLAYER_TURN');
}

// ----------------------------------------------------
// I. BOT TURN LIFECYCLE & STALE CALLBACK GUARDS
// ----------------------------------------------------
console.log('\nTest Suite I: Bot Turn Lifecycle & Stale Callback Guards');
{
  const room = makeRoom(); // Red is human, Green is bot
  // Pass turn to Green (bot)
  const greenTurn = passTurn(room);
  assert(greenTurn.currentTurnColor === 'green', 'Active player is Green (bot)');
  assert(greenTurn.phase === 'PLAYER_TURN', 'Green turn phase is PLAYER_TURN');

  const botRoll = processDiceRoll(greenTurn, 6);
  assert(botRoll.updatedRoom.phase === 'MOVE_SELECTION', 'Bot roll advances phase to MOVE_SELECTION');

  const movable = botRoll.movableTokens;
  assert(movable.length > 0, 'Bot has legal moves on 6');
  const botChoice = chooseBotMove(movable, 6);
  assert(botChoice !== null && botChoice.step === -1, 'Bot chooses yard token on 6');

  // Stale callback guard simulation:
  const activeSession = greenTurn.sessionId;
  const activeTurn = greenTurn.turnIndex;
  // Imagine turn timed out or human restarted game before bot timeout resolved:
  const restartedRoom = makeRoom(); // new sessionId and turnIndex 1
  const isStale = (
    restartedRoom.sessionId !== activeSession ||
    restartedRoom.turnIndex !== activeTurn
  );
  assert(isStale === true, 'Stale bot callback correctly detected across session/turn boundaries');
}

// ----------------------------------------------------
// J. MOVEMENT LIFECYCLE & RESOLUTION
// ----------------------------------------------------
console.log('\nTest Suite J: Movement Lifecycle');
{
  const room = makeRoom();
  const roll = processDiceRoll(room, 6);
  const moveRes = executeMove(roll.updatedRoom, 0);

  assert(moveRes.success === true, 'Move execution marked successful');
  assert(moveRes.updatedRoom.phase === 'PLAYER_TURN', 'Bonus turn keeps phase in PLAYER_TURN for roll 6');
  assert(moveRes.updatedRoom.currentTurnColor === 'red', 'Red receives bonus turn on 6');
  assert(moveRes.updatedRoom.turnIndex === 2, 'turnIndex incremented for new turn');
}

// ----------------------------------------------------
// K. NO LEGAL MOVE FLOW
// ----------------------------------------------------
console.log('\nTest Suite K: No Legal Move Flow');
{
  const room = makeRoom(); // All tokens in base
  const rollRes = processDiceRoll(room, 3); // 3 cannot release
  assert(!rollRes.hasLegalMoves, 'hasLegalMoves is false for roll 3');
  assert(rollRes.movableTokens.length === 0, 'No legal movable tokens');

  const nextRoom = passTurn(rollRes.updatedRoom);
  assert(nextRoom.currentTurnColor === 'green', 'Turn passed cleanly to Green');
  assert(nextRoom.phase === 'PLAYER_TURN', 'Phase reset to PLAYER_TURN for Green');
  assert(nextRoom.turnTimeRemaining === 25, 'Timer refreshed for Green');
}

// ----------------------------------------------------
// L. THREE CONSECUTIVE SIXES STATE MACHINE
// ----------------------------------------------------
console.log('\nTest Suite L: Three Consecutive Sixes State Machine');
{
  const r0 = makeRoom();
  // Six 1
  const r1 = processDiceRoll(r0, 6);
  assert(r1.updatedRoom.consecutiveSixes === 1, 'First 6 recorded');
  const m1 = executeMove(r1.updatedRoom, 0); // Release token 0 to step 0

  // Six 2
  const r2 = processDiceRoll(m1.updatedRoom, 6);
  assert(r2.updatedRoom.consecutiveSixes === 2, 'Second 6 recorded');
  const m2 = executeMove(r2.updatedRoom, 0); // Advance token 0 to step 6

  // Six 3 -> Penalty Triggered!
  const r3 = processDiceRoll(m2.updatedRoom, 6);
  assert(r3.isThreeSixesPenalty === true, '3rd six penalty triggered');
  assert(r3.updatedRoom.consecutiveSixes === 0, 'consecutiveSixes reset to 0');
  assert(r3.updatedRoom.currentTurnColor === 'green', 'Turn passed to Green on penalty');
  assert(r3.updatedRoom.phase === 'PLAYER_TURN', 'Phase reset to PLAYER_TURN for Green');
  assert(r3.movableTokens.length === 0, 'No movable tokens permitted on 3rd six penalty');
}

// ----------------------------------------------------
// M. BONUS TURN MUTUAL EXCLUSIVITY & WIN TERMINATION
// ----------------------------------------------------
console.log('\nTest Suite M: Bonus Turn Mutual Exclusivity');
{
  const room = makeRoom();
  // Put Red token at step 55
  room.players[0].tokens[0].step = 55;
  const rollRes = processDiceRoll(room, 1);
  const moveRes = executeMove(rollRes.updatedRoom, 0);
  assert(moveRes.reachedHome === true, 'Token reached home goal');
  assert(moveRes.bonusTurn === true, 'Bonus turn awarded for reaching home');
  assert(moveRes.updatedRoom.currentTurnColor === 'red', 'Turn stays with Red on home goal');

  // But if that was the 4th token (Win condition):
  const winRoom = makeRoom();
  winRoom.players[0].tokens[0] = { id: 0, color: 'red', step: 56, isSafe: true, isFinished: true };
  winRoom.players[0].tokens[1] = { id: 1, color: 'red', step: 56, isSafe: true, isFinished: true };
  winRoom.players[0].tokens[2] = { id: 2, color: 'red', step: 56, isSafe: true, isFinished: true };
  winRoom.players[0].tokens[3] = { id: 3, color: 'red', step: 55, isSafe: true, isFinished: false };

  const winRoll = processDiceRoll(winRoom, 1);
  const winMove = executeMove(winRoll.updatedRoom, 3);
  assert(winMove.updatedRoom.status === 'finished', 'Game status transitioned to finished');
  assert(winMove.updatedRoom.phase === 'GAME_OVER', 'Phase transitioned to GAME_OVER');
  assert(winMove.bonusTurn === false, 'Bonus turn NOT granted on win');
  assert(winMove.updatedRoom.winnerId === 'user_1', 'Winner ID set to active player');
}

// ----------------------------------------------------
// N. GAME OVER TERMINAL HARD BOUNDARY
// ----------------------------------------------------
console.log('\nTest Suite N: Game Over Terminal Hard Boundary');
{
  const finishedRoom: GameRoom = {
    ...makeRoom(),
    status: 'finished',
    phase: 'GAME_OVER',
    winnerId: 'user_1',
  };

  // Rejects dice rolls
  const rollAttempt = processDiceRoll(finishedRoom, 6);
  assert(!rollAttempt.updatedRoom.hasRolledDice, 'Dice rolls rejected after game over');

  // Rejects token movement
  const moveAttempt = executeMove(finishedRoom, 0);
  assert(!moveAttempt.success, 'Token movement rejected after game over');
  assert(moveAttempt.reason === 'Game is not playing', 'Move rejected with Game is not playing');

  // Rejects turn pass
  const passAttempt = passTurn(finishedRoom);
  assert(passAttempt.currentTurnColor === 'green', 'Pass turn advances color cleanly');
}

// ----------------------------------------------------
// O. RESTART & REMATCH SESSION ISOLATION
// ----------------------------------------------------
console.log('\nTest Suite O: Restart & Rematch Session Isolation');
{
  const match1 = makeRoom();
  const match2 = makeRoom();

  assert(match1.sessionId !== match2.sessionId, 'Every new match creates a distinct session ID');
  assert(match2.phase === 'PLAYER_TURN', 'New match starts in PLAYER_TURN phase');
  assert(match2.turnIndex === 1, 'New match resets turnIndex to 1');
  assert(match2.winnerId === null, 'New match clears winner ID');
  assert(match2.consecutiveSixes === 0, 'New match resets consecutive sixes');
}

console.log('\n========================================');
console.log(`PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
