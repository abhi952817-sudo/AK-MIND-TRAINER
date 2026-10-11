// tests/activeLudoEngine.test.ts
// Unit and integration test suite for the ACTIVE Ludo engine used by GameScreen.tsx.
// Tests src/games/ludo/engine.ts, src/games/ludo/rules.ts, src/games/ludo/board.ts,
// and src/games/ludo/octagonalEngine.ts.

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  createInitialState,
  startRoll,
  resolveRoll,
  applyMove,
  passTurn,
  tickTimer,
  shouldAutoPass,
  TURN_DURATION_MS,
} from '../src/games/ludo/engine';

import {
  canTokenMove,
  computeMove,
  getLegalMoves,
  grantsExtraTurn,
  hasPlayerWon,
  isBlockadeAtTrackIndex,
  getEnemyBlockadeTrackIndices,
} from '../src/games/ludo/rules';

import {
  WIN_POSITION,
  isSafeTrackIndex,
  toTrackIndex,
  positionToCoords,
  baseSlotCoords,
} from '../src/games/ludo/board';

import { Player, Token, GameState, DiceValue } from '../src/games/ludo/types';

import {
  createOctagonInitialState,
  canOctagonTokenMove,
  computeOctagonMove,
  applyOctagonMove,
  getOctagonLegalMoves,
  isOctagonSafeTrackIndex,
  getOctagonEnemyBlockades,
  OctagonPlayer,
} from '../src/games/ludo/octagonalEngine';

import {
  OCTAGON_WIN_POSITION,
  OCTAGON_TRACK_LENGTH,
} from '../src/games/ludo/octagonalBoard';

// Helper to construct test players
function create4TestPlayers(): Player[] {
  return [
    { uid: 'p0', name: 'Player 0', color: 'blue', index: 0, isBot: false, isHost: true, isReady: true, isOnline: true },
    { uid: 'p1', name: 'Player 1', color: 'red', index: 1, isBot: true, isHost: false, isReady: true, isOnline: true },
    { uid: 'p2', name: 'Player 2', color: 'green', index: 2, isBot: true, isHost: false, isReady: true, isOnline: true },
    { uid: 'p3', name: 'Player 3', color: 'yellow', index: 3, isBot: true, isHost: false, isReady: true, isOnline: true },
  ];
}

describe('Active 4-Player Engine Tests (src/games/ludo)', () => {
  it('1. Initial State Initialization', () => {
    const players = create4TestPlayers();
    const state = createInitialState(players);

    assert.strictEqual(state.players.length, 4, 'Must have 4 players');
    assert.strictEqual(state.tokens.length, 16, 'Must have 16 tokens (4 per player)');
    assert.strictEqual(state.activePlayerIndex, 0, 'Active player must start at 0');
    assert.strictEqual(state.phase, 'waiting', 'Initial phase must be waiting');
    assert.strictEqual(state.diceValue, null, 'Initial dice value must be null');
    assert.strictEqual(state.consecutiveSixes, 0, 'Initial consecutive sixes must be 0');
    assert.strictEqual(state.winner, null, 'Winner must be null initially');

    // All tokens must be in home base (-1)
    for (const t of state.tokens) {
      assert.strictEqual(t.position, -1, `Token ${t.id} must be in base`);
    }
  });

  it('2. Valid Dice Rolls and Phase Transitions', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Roll start
    state = startRoll(state);
    assert.strictEqual(state.phase, 'rolling', 'Phase must transition to rolling');

    // Roll resolution (e.g. rolled a 4)
    state = resolveRoll(state, 4);
    assert.strictEqual(state.phase, 'selecting', 'Phase must transition to selecting');
    assert.strictEqual(state.diceValue, 4, 'Dice value must be 4');
    assert.strictEqual(state.consecutiveSixes, 0, 'Consecutive sixes must be 0 for non-six roll');
  });

  it('3. Token Exit From Base (Requires 6)', () => {
    const players = create4TestPlayers();
    const state = createInitialState(players);
    const token = state.tokens.find((t) => t.playerIndex === 0 && t.tokenIndex === 0)!;

    // Rolls 1 through 5 cannot unlock token from base (-1)
    for (let r = 1; r <= 5; r++) {
      assert.strictEqual(canTokenMove(token, r as DiceValue), false, `Roll of ${r} cannot exit base`);
      assert.strictEqual(computeMove(state, token, r as DiceValue), null, `Move of ${r} must be null`);
    }

    // Roll of 6 unlocks token
    assert.strictEqual(canTokenMove(token, 6), true, 'Roll of 6 must allow base exit');
    const move = computeMove(state, token, 6);
    assert.ok(move, 'Move must exist for 6');
    assert.strictEqual(move.from, -1, 'From position must be -1');
    assert.strictEqual(move.to, 0, 'To position must be 0 (start square)');
    assert.strictEqual(move.exitsBase, true, 'exitsBase flag must be true');

    // Apply move with resolved roll of 6
    const stateWithSix: GameState = {
      ...state,
      phase: 'selecting',
      diceValue: 6,
    };
    const nextState = applyMove(stateWithSix, token.id);
    const movedToken = nextState.tokens.find((t) => t.id === token.id)!;
    assert.strictEqual(movedToken.position, 0, 'Token must now be at position 0');
  });

  it('4. Invalid Token Movement Validation', () => {
    const players = create4TestPlayers();
    const state = createInitialState(players);
    const p1Token = state.tokens.find((t) => t.playerIndex === 1)!;

    // Player 0 cannot move Player 1 token
    const wrongPlayerMove = computeMove(state, p1Token, 6);
    // Even if computeMove checks token, applyMove enforces active player
    const stateWithDice = { ...state, diceValue: 6 as DiceValue, phase: 'selecting' as const };
    const invalidResult = applyMove(stateWithDice, p1Token.id);
    assert.strictEqual(invalidResult, stateWithDice, 'Must reject move for inactive player');
  });

  it('5. Exact-Number Home Entry and Overshoot Rejection', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Place Player 0 token at position 55 (2 steps from WIN_POSITION = 57)
    state = {
      ...state,
      tokens: state.tokens.map((t) =>
        t.id === '0-0' ? { ...t, position: 55 } : t
      ),
      diceValue: 2,
      phase: 'selecting',
    };
    const token = state.tokens.find((t) => t.id === '0-0')!;

    // Overshoot with 3, 4, 5, 6
    for (const roll of [3, 4, 5, 6] as DiceValue[]) {
      assert.strictEqual(canTokenMove(token, roll), false, `Overshoot with roll ${roll} must be rejected`);
      assert.strictEqual(computeMove(state, token, roll), null, `Overshoot move must be null`);
    }

    // Exact landing with 2
    assert.strictEqual(canTokenMove(token, 2), true, 'Exact roll of 2 must be accepted');
    const move = computeMove(state, token, 2)!;
    assert.strictEqual(move.to, WIN_POSITION, `Must land exactly on ${WIN_POSITION}`);
    assert.strictEqual(move.reachesHome, true, 'reachesHome must be true');

    // Finished token can never move again
    const finishedToken: Token = { ...token, position: WIN_POSITION };
    assert.strictEqual(canTokenMove(finishedToken, 1), false, 'Finished token cannot move');
  });

  it('6. Bonus Rolls (Rolling 6, Capture, Home Entry)', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Place token on track
    state = {
      ...state,
      tokens: state.tokens.map((t) =>
        t.id === '0-0' ? { ...t, position: 10 } : t
      ),
      activePlayerIndex: 0,
    };

    // A. Bonus for rolling 6
    const roll6State = { ...state, diceValue: 6 as DiceValue, phase: 'selecting' as const };
    const after6 = applyMove(roll6State, '0-0');
    assert.strictEqual(after6.activePlayerIndex, 0, 'Rolling 6 must grant extra turn (same player)');

    // B. Normal move (rolling 3, no capture)
    const normalState = { ...state, diceValue: 3 as DiceValue, phase: 'selecting' as const };
    const afterNormal = applyMove(normalState, '0-0');
    assert.strictEqual(afterNormal.activePlayerIndex, 1, 'Normal move must advance turn to Player 1');

    // C. Bonus for reaching Home (position 55 + 2 = 57)
    const homeState = {
      ...state,
      tokens: state.tokens.map((t) =>
        t.id === '0-0' ? { ...t, position: 55 } : t
      ),
      diceValue: 2 as DiceValue,
      phase: 'selecting' as const,
    };
    const afterHome = applyMove(homeState, '0-0');
    // If not all 4 tokens finished, reaching home grants bonus turn
    assert.strictEqual(afterHome.activePlayerIndex, 0, 'Reaching home must grant extra turn');
  });

  it('7. Consecutive Sixes and Three-Sixes Penalty', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // 1st six
    state = startRoll(state);
    state = resolveRoll(state, 6);
    assert.strictEqual(state.consecutiveSixes, 1, 'Must count 1st six');
    assert.strictEqual(shouldAutoPass(state), false, '1st six does not auto-pass');

    // Move token to maintain turn
    state = applyMove(state, '0-0'); // exits base
    assert.strictEqual(state.consecutiveSixes, 1, 'Consecutive sixes preserved on move');

    // 2nd six
    state = startRoll(state);
    state = resolveRoll(state, 6);
    assert.strictEqual(state.consecutiveSixes, 2, 'Must count 2nd six');
    assert.strictEqual(shouldAutoPass(state), false, '2nd six does not auto-pass');

    // Move token to maintain turn and reset phase to waiting for 3rd roll
    state = applyMove(state, '0-0');
    assert.strictEqual(state.consecutiveSixes, 2, 'Consecutive sixes preserved after 2nd move');
    assert.strictEqual(state.phase, 'waiting', 'Phase reset to waiting for 3rd roll');

    // 3rd six
    state = startRoll(state);
    state = resolveRoll(state, 6);
    assert.strictEqual(state.consecutiveSixes, 3, 'Must count 3rd six');
    assert.strictEqual(shouldAutoPass(state), true, '3rd consecutive six MUST trigger auto-pass forfeit');
  });

  it('8. Safe-Cell Protection and Non-Safe Captures', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Track Index 0 is safe start cell
    assert.strictEqual(isSafeTrackIndex(0), true, 'Track index 0 is safe');
    assert.strictEqual(isSafeTrackIndex(8), true, 'Star index 8 is safe');
    assert.strictEqual(isSafeTrackIndex(1), false, 'Track index 1 is NOT safe');

    // Player 0 token is at position 1 (global index 1)
    // Player 1 token is at position 40 (which corresponds to global index 1)
    // Place opponent token at position 1:
    state = {
      ...state,
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 0 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 40 }, // global idx 1
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0'),
      ],
      activePlayerIndex: 0,
      diceValue: 1 as DiceValue,
      phase: 'selecting',
    };

    // Player 0 moves from 0 to 1 (global index 1). Should capture Player 1 token!
    const captureMove = computeMove(state, state.tokens.find((t) => t.id === '0-0')!, 1);
    assert.ok(captureMove);
    assert.strictEqual(captureMove.captures.length, 1, 'Must capture opponent on unsafe cell');
    assert.strictEqual(captureMove.captures[0], '1-0', 'Captured token must be 1-0');

    // Execute capture
    const afterCapture = applyMove(state, '0-0');
    const capturedToken = afterCapture.tokens.find((t) => t.id === '1-0')!;
    assert.strictEqual(capturedToken.position, -1, 'Captured token must be sent back to base (-1)');
    assert.strictEqual(afterCapture.activePlayerIndex, 0, 'Capture must award bonus turn to Player 0');
  });

  it('9. Turn Advancement and Finished Player Skipping', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Initial pass advances 0 -> 1
    state = passTurn(state);
    assert.strictEqual(state.activePlayerIndex, 1, 'Must advance to Player 1');

    // Pass advances 1 -> 2
    state = passTurn(state);
    assert.strictEqual(state.activePlayerIndex, 2, 'Must advance to Player 2');

    // Pass advances 2 -> 3
    state = passTurn(state);
    assert.strictEqual(state.activePlayerIndex, 3, 'Must advance to Player 3');

    // Pass advances 3 -> 0
    state = passTurn(state);
    assert.strictEqual(state.activePlayerIndex, 0, 'Must wrap around to Player 0');

    // Simulate Player 1 finished all 4 tokens
    state = {
      ...state,
      finishOrder: [1],
      activePlayerIndex: 0,
    };
    // Passing from 0 should skip 1 and go to 2
    state = passTurn(state);
    assert.strictEqual(state.activePlayerIndex, 2, 'Must skip finished Player 1 and go to Player 2');
  });

  it('10. Timer Expiration (tickTimer)', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);
    const startTime = state.turnStartedAt;

    // Within duration (e.g. 15s elapsed): no turn pass
    state = tickTimer(state, startTime + 15_000);
    assert.strictEqual(state.activePlayerIndex, 0, 'Must remain on Player 0 before timeout');

    // Exceeded TURN_DURATION_MS (30s): auto-pass turn
    state = tickTimer(state, startTime + TURN_DURATION_MS + 100);
    assert.strictEqual(state.activePlayerIndex, 1, 'Must auto-pass to Player 1 after timeout');
    assert.strictEqual(state.phase, 'waiting', 'Phase must be waiting after auto-pass');
  });

  it('11. Restart and State Lifecycle Reset', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Mutate state with gameplay progress
    state = {
      ...state,
      activePlayerIndex: 2,
      diceValue: 5,
      phase: 'selecting',
      consecutiveSixes: 2,
      winner: 0,
      finishOrder: [0],
      tokens: state.tokens.map((t) => (t.id === '0-0' ? { ...t, position: WIN_POSITION } : t)),
    };

    // Restart with same players
    const restarted = createInitialState(state.players);
    assert.strictEqual(restarted.activePlayerIndex, 0, 'Restart must reset active player to starting player');
    assert.strictEqual(restarted.phase, 'waiting', 'Restart must reset phase to waiting');
    assert.strictEqual(restarted.diceValue, null, 'Restart must clear dice value');
    assert.strictEqual(restarted.consecutiveSixes, 0, 'Restart must reset consecutive sixes');
    assert.strictEqual(restarted.winner, null, 'Restart must clear winner');
    assert.strictEqual(restarted.finishOrder.length, 0, 'Restart must clear finish order');
    for (const token of restarted.tokens) {
      assert.strictEqual(token.position, -1, 'All tokens must return to base (-1) upon restart');
    }
  });

  it('12. Stale Asynchronous Action and Race Rejections', () => {
    const players = create4TestPlayers();
    const initialState = createInitialState(players);

    // A. Rejection of duplicate roll when already rolling
    const rollingState = startRoll(initialState);
    assert.strictEqual(rollingState.phase, 'rolling');
    const duplicateRollState = startRoll(rollingState);
    assert.strictEqual(duplicateRollState, rollingState, 'startRoll must no-op when already rolling');

    // B. Rejection of roll resolution when phase is not rolling
    const notRollingState = initialState; // phase: 'waiting'
    const staleResolve = resolveRoll(notRollingState, 6);
    assert.strictEqual(staleResolve, notRollingState, 'resolveRoll must no-op when not in rolling phase');

    // C. Rejection of move execution during rolling or waiting phase
    const prematureMove = applyMove(rollingState, '0-0');
    assert.strictEqual(prematureMove, rollingState, 'applyMove must no-op during rolling phase');

    const waitingMove = applyMove(initialState, '0-0');
    assert.strictEqual(waitingMove, initialState, 'applyMove must no-op during waiting phase');

    // D. Rejection of actions on terminated/ended game
    const endedState: GameState = { ...initialState, winner: 0, phase: 'ended' };
    const rollOnEnded = startRoll(endedState);
    assert.strictEqual(rollOnEnded, endedState, 'startRoll must no-op when game has ended');

    const timerOnEnded = tickTimer(endedState, Date.now() + 60_000);
    assert.strictEqual(timerOnEnded, endedState, 'tickTimer must no-op when game has ended');
  });

  // =================== BLOCKADE SUITE (10 Requirements) ===================
  it('13. Blockade Requirement 1: Two same-color tokens form a Blockade', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Place 2 tokens of Player 1 (Red) at relative position 0 (which is global track index 13)
    state = {
      ...state,
      tokens: [
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 0 },
        { id: '1-1', playerIndex: 1, color: 'red', tokenIndex: 1, position: 0 },
        ...state.tokens.filter((t) => t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    assert.strictEqual(isBlockadeAtTrackIndex(state.tokens, 13), true, 'Track index 13 must have a blockade');
    assert.strictEqual(isBlockadeAtTrackIndex(state.tokens, 13, 1), true, 'Track index 13 must be formed by Player 1');
    assert.strictEqual(isBlockadeAtTrackIndex(state.tokens, 13, 0), false, 'Player 0 does not own the blockade');

    // To Player 0, track index 13 is an enemy blockade
    const enemyBlockades = getEnemyBlockadeTrackIndices(state, 0);
    assert.strictEqual(enemyBlockades.has(13), true, 'Track index 13 must be in enemy blockades for Player 0');
  });

  it('14. Blockade Requirement 2: An opposing token cannot land on a Blockade', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Player 0 at position 10 (global track index 10).
    // Player 1 has blockade at global track index 13 (which is Player 0 relative position 13).
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 3 as DiceValue, // 10 + 3 = 13 (landing on blockade)
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 10 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 0 }, // track 13
        { id: '1-1', playerIndex: 1, color: 'red', tokenIndex: 1, position: 0 }, // track 13
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    const token0 = state.tokens.find((t) => t.id === '0-0')!;
    assert.strictEqual(canTokenMove(token0, 3, state), false, 'Opposing token cannot land on enemy blockade');
    assert.strictEqual(computeMove(state, token0, 3), null, 'computeMove must return null when landing on blockade');
  });

  it('15. Blockade Requirement 3: An opposing token cannot cross a Blockade', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Player 0 at position 10 (global track index 10).
    // Enemy blockade at global track index 13 (Player 0 relative position 13).
    // Roll of 5 attempts to move from 10 to 15, crossing 13.
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 5 as DiceValue, // 10 + 5 = 15 (crosses 13)
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 10 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 0 }, // track 13
        { id: '1-1', playerIndex: 1, color: 'red', tokenIndex: 1, position: 0 }, // track 13
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    const token0 = state.tokens.find((t) => t.id === '0-0')!;
    assert.strictEqual(canTokenMove(token0, 5, state), false, 'Opposing token cannot cross enemy blockade');
    assert.strictEqual(computeMove(state, token0, 5), null, 'computeMove must return null when crossing blockade');
  });

  it('16. Blockade Requirement 4: A move before a Blockade remains legal', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Player 0 at position 10. Enemy blockade at position 13.
    // Roll of 2 moves to position 12 (before the blockade).
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 2 as DiceValue,
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 10 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 0 }, // track 13
        { id: '1-1', playerIndex: 1, color: 'red', tokenIndex: 1, position: 0 }, // track 13
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    const token0 = state.tokens.find((t) => t.id === '0-0')!;
    assert.strictEqual(canTokenMove(token0, 2, state), true, 'Move before blockade must be legal');
    const move = computeMove(state, token0, 2);
    assert.ok(move, 'Move option must be computed');
    assert.strictEqual(move.to, 12, 'Destination must be 12');
  });

  it('17. Blockade Requirement 5: A move that crosses no Blockade remains legal', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Player 0 at position 15. Enemy blockade is BEHIND at track index 13.
    // Roll of 4 moves to position 19.
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 4 as DiceValue,
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 15 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 0 }, // track 13
        { id: '1-1', playerIndex: 1, color: 'red', tokenIndex: 1, position: 0 }, // track 13
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    const token0 = state.tokens.find((t) => t.id === '0-0')!;
    assert.strictEqual(canTokenMove(token0, 4, state), true, 'Move with no blockade in path must be legal');
    const move = computeMove(state, token0, 4);
    assert.ok(move);
    assert.strictEqual(move.to, 19);
  });

  it('18. Blockade Requirement 6: Base tokens do not create false Blockades', () => {
    const players = create4TestPlayers();
    const state = createInitialState(players);

    // All players have 4 tokens at position -1 (base)
    const enemyBlockades = getEnemyBlockadeTrackIndices(state, 0);
    assert.strictEqual(enemyBlockades.size, 0, 'Tokens in base must NEVER create track blockades');
  });

  it('19. Blockade Requirement 7: Home-runway tokens do not create false shared-track Blockades', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Player 1 has 2 tokens in home runway at position 53
    state = {
      ...state,
      tokens: [
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 53 },
        { id: '1-1', playerIndex: 1, color: 'red', tokenIndex: 1, position: 53 },
        ...state.tokens.filter((t) => t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    const enemyBlockades = getEnemyBlockadeTrackIndices(state, 0);
    assert.strictEqual(enemyBlockades.size, 0, 'Home runway tokens must never create shared-track blockades');
  });

  it('20. Blockade Requirement 8: Existing safe-cell and single-token capture behavior remains correct', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Case A: Enemy has single token on unsafe cell (e.g. track 10). Landing captures it!
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 2 as DiceValue,
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 8 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 49 }, // track 10 for red
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0'),
      ],
    };
    const captureMove = computeMove(state, state.tokens.find((t) => t.id === '0-0')!, 2);
    assert.ok(captureMove);
    assert.strictEqual(captureMove.captures.length, 1, 'Single enemy token on unsafe cell is captured');

    // Case B: Enemy has single token on safe star cell (e.g. track 8). Landing does NOT capture, but is legal!
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 2 as DiceValue,
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 6 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 47 }, // track 8
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0'),
      ],
    };
    const safeMove = computeMove(state, state.tokens.find((t) => t.id === '0-0')!, 2);
    assert.ok(safeMove);
    assert.strictEqual(safeMove.captures.length, 0, 'Single enemy on safe cell is NOT captured, move legal');
  });

  it('21. Blockade Requirement 9: Exact-number home entry still works with Blockade logic', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Place token at position 55 (2 away from WIN_POSITION = 57)
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 55 },
        ...state.tokens.filter((t) => t.id !== '0-0'),
      ],
    };
    const token = state.tokens.find((t) => t.id === '0-0')!;

    // Exact roll of 2 reaches WIN_POSITION
    assert.strictEqual(canTokenMove(token, 2, state), true, 'Exact roll 2 reaches home');
    const move = computeMove(state, token, 2)!;
    assert.strictEqual(move.to, WIN_POSITION);
    assert.strictEqual(move.reachesHome, true);

    // Overshoot of 3 rejected
    assert.strictEqual(canTokenMove(token, 3, state), false, 'Overshoot 3 rejected');
    assert.strictEqual(computeMove(state, token, 3), null);
  });

  it('22. Blockade Requirement 10: Invalid moves do not modify the game state', () => {
    const players = create4TestPlayers();
    let state = createInitialState(players);

    // Player 0 token at position 10. Enemy blockade at position 13. Roll 3 (lands on blockade).
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 3 as DiceValue,
      tokens: [
        { id: '0-0', playerIndex: 0, color: 'blue', tokenIndex: 0, position: 10 },
        { id: '1-0', playerIndex: 1, color: 'red', tokenIndex: 0, position: 0 }, // track 13
        { id: '1-1', playerIndex: 1, color: 'red', tokenIndex: 1, position: 0 }, // track 13
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    const nextState = applyMove(state, '0-0');
    assert.strictEqual(nextState, state, 'State must remain completely unchanged on blocked move attempt');
  });
});

describe('Active 8-Player Octagonal Engine Tests (src/games/ludo/octagonalEngine)', () => {
  function create8OctagonPlayers(): OctagonPlayer[] {
    const colors = ['#0055D4', '#00D4FF', '#E600AA', '#6F00FF', '#FFD700', '#FF7700', '#EE1122', '#00AA33'];
    return colors.map((col, idx) => ({
      id: `oct-p${idx}`,
      name: `Player ${idx + 1}`,
      sectorIndex: idx,
      color: col,
      label: `0${idx + 1}`,
      isBot: idx !== 0,
      isHost: idx === 0,
    }));
  }

  it('1. Octagonal State Initialization', () => {
    const players = create8OctagonPlayers();
    const state = createOctagonInitialState(players);

    assert.strictEqual(state.players.length, 8, 'Must have 8 players');
    assert.strictEqual(state.tokens.length, 32, 'Must have 32 tokens (4 per player)');
    assert.strictEqual(state.activePlayerIndex, 0, 'Active sector must start at 0');
    assert.strictEqual(state.phase, 'waiting', 'Initial phase waiting');

    for (const t of state.tokens) {
      assert.strictEqual(t.position, -1, 'All octagonal tokens start in base (-1)');
    }
  });

  it('2. Octagonal Base Exit and Exact Home Entry', () => {
    const players = create8OctagonPlayers();
    const state = createOctagonInitialState(players);
    const token = state.tokens.find((t) => t.playerIndex === 0 && t.tokenIndex === 0)!;

    // Unlocking on 6
    assert.strictEqual(canOctagonTokenMove(token, 1), false, 'Roll 1 cannot unlock');
    assert.strictEqual(canOctagonTokenMove(token, 6), true, 'Roll 6 unlocks octagonal token');

    const move = computeOctagonMove(state, token, 6)!;
    assert.strictEqual(move.to, 0, 'Unlocks to position 0');
    assert.strictEqual(move.exitsBase, true);

    // Exact home finish at OCTAGON_WIN_POSITION (69)
    const nearHomeToken = { ...token, position: OCTAGON_WIN_POSITION - 2 }; // position 67
    assert.strictEqual(canOctagonTokenMove(nearHomeToken, 2), true, 'Exact roll 2 reaches home 69');
    assert.strictEqual(canOctagonTokenMove(nearHomeToken, 3), false, 'Overshoot 3 rejected');
    assert.strictEqual(canOctagonTokenMove(nearHomeToken, 6), false, 'Overshoot 6 rejected');
  });

  it('3. Octagonal Safe Track Cells (Start and Stop)', () => {
    // In octagonal board: sectors are 0..7, each sector has Start at idx 0 and Stop at idx 4
    for (let s = 0; s < 8; s++) {
      const startIdx = s * 8;
      const stopIdx = s * 8 + 4;
      assert.strictEqual(isOctagonSafeTrackIndex(startIdx), true, `Sector ${s} Start (${startIdx}) must be safe`);
      assert.strictEqual(isOctagonSafeTrackIndex(stopIdx), true, `Sector ${s} Stop (${stopIdx}) must be safe`);
      assert.strictEqual(isOctagonSafeTrackIndex(startIdx + 1), false, `Track index ${startIdx + 1} must NOT be safe`);
    }
  });

  it('4. Octagonal Blockade Formation and Enemy Rejection (Land and Cross)', () => {
    const players = create8OctagonPlayers();
    let state = createOctagonInitialState(players);

    // Sector 1 (Cyan) has startTrackIdx = 8.
    // Place 2 tokens of Player 1 at position 0 (track index 8) -> forms an Octagonal Blockade!
    state = {
      ...state,
      tokens: [
        { id: '1-0', playerIndex: 1, tokenIndex: 0, position: 0, color: '#00D4FF' },
        { id: '1-1', playerIndex: 1, tokenIndex: 1, position: 0, color: '#00D4FF' },
        ...state.tokens.filter((t) => t.id !== '1-0' && t.id !== '1-1'),
      ],
    };

    const enemyBlockades = getOctagonEnemyBlockades(state, 0);
    assert.strictEqual(enemyBlockades.has(8), true, 'Track index 8 must be an enemy blockade for Player 0');

    // Player 0 starts at track index 0.
    // Place Player 0 token at position 5 (track index 5).
    state = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      tokens: [
        { id: '0-0', playerIndex: 0, tokenIndex: 0, position: 5, color: '#0055D4' },
        ...state.tokens.filter((t) => t.id !== '0-0'),
      ],
    };
    const p0Token = state.tokens.find((t) => t.id === '0-0')!;

    // A. Move landing on Blockade (5 + 3 = 8): must be rejected!
    assert.strictEqual(canOctagonTokenMove(p0Token, 3, state), false, 'Cannot land on octagonal enemy blockade');
    assert.strictEqual(computeOctagonMove(state, p0Token, 3), null);

    // B. Move crossing Blockade (5 + 5 = 10, passes through 8): must be rejected!
    assert.strictEqual(canOctagonTokenMove(p0Token, 5, state), false, 'Cannot cross octagonal enemy blockade');
    assert.strictEqual(computeOctagonMove(state, p0Token, 5), null);

    // C. Move before Blockade (5 + 2 = 7): must be legal!
    assert.strictEqual(canOctagonTokenMove(p0Token, 2, state), true, 'Move before blockade is legal');
    const legalMove = computeOctagonMove(state, p0Token, 2);
    assert.ok(legalMove);
    assert.strictEqual(legalMove.to, 7);

    // D. Base and Runway tokens must not form track blockades
    const baseBlockades = getOctagonEnemyBlockades(createOctagonInitialState(players), 0);
    assert.strictEqual(baseBlockades.size, 0, 'Base tokens must not form octagonal track blockades');
  });
});
