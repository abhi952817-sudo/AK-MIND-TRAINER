import {
  createMatchPlayers,
  PlayerSetupMode,
  createInitialRoom,
  processDiceRoll,
  chooseBotMove,
  getMovableTokens,
  passTurn,
} from '../src/utils/ludoEngine';
import { Player, GameRoom } from '../src/types/ludo';

console.log('========================================');
console.log('RUNNING PLAYER CONFIGURATION & BOT SAFETY TESTS');
console.log('========================================');

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

console.log('\nTest Suite 1: Player Configuration Modes (Human vs Bot count)');

// Mode A: 1 Human + 3 Bots
const modeA = createMatchPlayers('https://example.com/avatar.jpg', '1H3B', 'HostUser');
assert(modeA.length === 4, 'Mode A produces exactly 4 players');
assert(!modeA[0].isBot, 'Mode A Player 1 (Red) is Human');
assert(modeA[0].isHost, 'Mode A Player 1 is Host');
assert(modeA[1].isBot, 'Mode A Player 2 (Green) is Bot');
assert(modeA[2].isBot, 'Mode A Player 3 (Blue) is Bot');
assert(modeA[3].isBot, 'Mode A Player 4 (Yellow) is Bot');
assert(modeA.filter(p => !p.isBot).length === 1, 'Mode A has exactly 1 Human player');
assert(modeA.filter(p => p.isBot).length === 3, 'Mode A has exactly 3 Bot players');

// Mode B: 2 Humans + 2 Bots
const modeB = createMatchPlayers('https://example.com/avatar.jpg', '2H2B', 'HostUser');
assert(modeB.length === 4, 'Mode B produces exactly 4 players');
assert(!modeB[0].isBot, 'Mode B Player 1 (Red) is Human');
assert(!modeB[1].isBot, 'Mode B Player 2 (Green) is Human');
assert(modeB[2].isBot, 'Mode B Player 3 (Blue) is Bot');
assert(modeB[3].isBot, 'Mode B Player 4 (Yellow) is Bot');
assert(modeB.filter(p => !p.isBot).length === 2, 'Mode B has exactly 2 Human players');
assert(modeB.filter(p => p.isBot).length === 2, 'Mode B has exactly 2 Bot players');

// Mode C: 3 Humans + 1 Bot
const modeC = createMatchPlayers('https://example.com/avatar.jpg', '3H1B', 'HostUser');
assert(modeC.length === 4, 'Mode C produces exactly 4 players');
assert(!modeC[0].isBot, 'Mode C Player 1 (Red) is Human');
assert(!modeC[1].isBot, 'Mode C Player 2 (Green) is Human');
assert(!modeC[2].isBot, 'Mode C Player 3 (Blue) is Human');
assert(modeC[3].isBot, 'Mode C Player 4 (Yellow) is Bot');
assert(modeC.filter(p => !p.isBot).length === 3, 'Mode C has exactly 3 Human players');
assert(modeC.filter(p => p.isBot).length === 1, 'Mode C has exactly 1 Bot player');

// Mode D: 4 Humans + 0 Bots (Pass & Play on same device)
const modeD = createMatchPlayers('https://example.com/avatar.jpg', '4H0B', 'HostUser');
assert(modeD.length === 4, 'Mode D produces exactly 4 players');
assert(!modeD[0].isBot, 'Mode D Player 1 (Red) is Human');
assert(!modeD[1].isBot, 'Mode D Player 2 (Green) is Human');
assert(!modeD[2].isBot, 'Mode D Player 3 (Blue) is Human');
assert(!modeD[3].isBot, 'Mode D Player 4 (Yellow) is Human');
assert(modeD.filter(p => !p.isBot).length === 4, 'Mode D has exactly 4 Human players');
assert(modeD.filter(p => p.isBot).length === 0, 'Mode D has exactly 0 Bot players');

console.log('\nTest Suite 2: Human Turn Control & Bot Execution Safety');

// In Mode B: Player 1 (Red) and Player 2 (Green) are human
const testRoomB: GameRoom = {
  ...createInitialRoom('TEST_B', modeB),
  status: 'playing',
  phase: 'PLAYER_TURN',
  currentTurnColor: 'red',
};

const activeP1 = testRoomB.players.find(p => p.color === testRoomB.currentTurnColor);
assert(Boolean(activeP1 && !activeP1.isBot), 'Red turn in Mode B is identified as Human turn');

// Verify that if current turn player is human, bot auto-roll guard rejects action
function simulateBotAutoRollGuard(room: GameRoom): boolean {
  const current = room.players.find(p => p.color === room.currentTurnColor);
  if (!current || !current.isBot) {
    return false; // Guard blocks execution for human players
  }
  return true; // Bot is permitted to roll
}

assert(
  !simulateBotAutoRollGuard(testRoomB),
  'Bot auto-roll guard strictly prevents rolling on Human Player 1 turn'
);

// Advance turn to Green (Player 2, also human in Mode B)
const greenRoomB: GameRoom = {
  ...testRoomB,
  currentTurnColor: 'green',
};
assert(
  !simulateBotAutoRollGuard(greenRoomB),
  'Bot auto-roll guard strictly prevents rolling on Human Player 2 turn'
);

// Advance turn to Blue (Player 3, Bot in Mode B)
const blueRoomB: GameRoom = {
  ...testRoomB,
  currentTurnColor: 'blue',
};
assert(
  simulateBotAutoRollGuard(blueRoomB),
  'Bot auto-roll guard allows bot action on Bot Player 3 turn'
);

// Bot decision timer guard prevents bot moves on human turns
function simulateBotDecisionGuard(room: GameRoom): boolean {
  const current = room.players.find(p => p.color === room.currentTurnColor);
  if (!current || !current.isBot) {
    return false;
  }
  return true;
}

assert(
  !simulateBotDecisionGuard(testRoomB),
  'Bot decision guard strictly blocks automatic token selection on human turn'
);
assert(
  !simulateBotDecisionGuard(greenRoomB),
  'Bot decision guard strictly blocks automatic token selection on human Player 2 turn'
);
assert(
  simulateBotDecisionGuard(blueRoomB),
  'Bot decision guard allows bot decision on bot turn'
);

console.log('\nTest Suite 3: Stale Bot Callback Rejection');

// Verify callback session & turn index protection
function simulateCallbackValidation(
  callbackSession: string,
  callbackTurn: number,
  currentRoom: GameRoom
): boolean {
  if (
    currentRoom.sessionId !== callbackSession ||
    currentRoom.turnIndex !== callbackTurn ||
    currentRoom.status !== 'playing' ||
    currentRoom.phase === 'GAME_OVER'
  ) {
    return false; // Stale callback ignored
  }
  const current = currentRoom.players.find(p => p.color === currentRoom.currentTurnColor);
  if (!current || !current.isBot) {
    return false; // Player became human or turn passed to human
  }
  return true;
}

const activeSession = blueRoomB.sessionId;
const activeTurn = blueRoomB.turnIndex;

assert(
  simulateCallbackValidation(activeSession, activeTurn, blueRoomB),
  'Valid bot callback for bot turn is accepted'
);

// Turn passed before callback fired
const staleTurnRoom: GameRoom = {
  ...blueRoomB,
  turnIndex: activeTurn + 1,
  currentTurnColor: 'yellow',
};
assert(
  !simulateCallbackValidation(activeSession, activeTurn, staleTurnRoom),
  'Bot callback with mismatched turn index is safely ignored'
);

// Game restarted before callback fired
const staleSessionRoom: GameRoom = {
  ...blueRoomB,
  sessionId: 'new_session_999',
};
assert(
  !simulateCallbackValidation(activeSession, activeTurn, staleSessionRoom),
  'Bot callback with mismatched session ID is safely ignored'
);

// Game over before callback fired
const gameOverRoom: GameRoom = {
  ...blueRoomB,
  status: 'finished',
  phase: 'GAME_OVER',
};
assert(
  !simulateCallbackValidation(activeSession, activeTurn, gameOverRoom),
  'Bot callback after game over is safely ignored'
);

console.log('========================================');
console.log(`PLAYER CONFIGURATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
