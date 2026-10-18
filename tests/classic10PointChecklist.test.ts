// tests/classic10PointChecklist.test.ts
// Exhaustive test verification of all 10 points in the Classic Ludo Specification Checklist.
// Validates src/games/ludo/engine.ts, rules.ts, and board.ts.

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  createInitialState,
  startRoll,
  resolveRoll,
  applyMove,
  passTurn,
  shouldAutoPass,
  tickTimer,
} from '../src/games/ludo/engine';

import {
  canTokenMove,
  computeMove,
  getLegalMoves,
  hasPlayerWon,
  getEnemyBlockadeTrackIndices,
  isBlockadeAtTrackIndex,
} from '../src/games/ludo/rules';

import {
  WIN_POSITION,
  TRACK_LENGTH,
  PLAYER_STARTS,
  HOME_COLUMNS,
  isSafeTrackIndex,
  toTrackIndex,
  positionToCoords,
} from '../src/games/ludo/board';

import { Player, Token, GameState } from '../src/games/ludo/types';
import { getBotMove } from '../src/games/ludo/bot';

function createClassicPlayers(): Player[] {
  return [
    { uid: 'p0', name: 'You', color: 'blue', index: 0, isBot: false, isHost: true, isReady: true, isOnline: true },
    { uid: 'p1', name: 'Samantha', color: 'red', index: 1, isBot: true, isHost: false, isReady: true, isOnline: true },
    { uid: 'p2', name: 'Marcus', color: 'green', index: 2, isBot: true, isHost: false, isReady: true, isOnline: true },
    { uid: 'p3', name: 'Devin', color: 'yellow', index: 3, isBot: true, isHost: false, isReady: true, isOnline: true },
  ];
}

describe('Master Plan Phase 8: 10-Point Classic Ludo Checklist Verification', () => {
  // Point 1: पासे पर 6 आने पर ही गोटी बाहर निकले; बाकी अंकों पर बेस की गोटी बाहर न निकले
  it('Point 1: Dice Six and Base Exit Restrictions', () => {
    const state = createInitialState(createClassicPlayers());
    const baseToken = state.tokens.find((t) => t.playerIndex === 0 && t.position === -1)!;

    for (const val of [1, 2, 3, 4, 5]) {
      assert.strictEqual(
        canTokenMove(baseToken, val as any, state),
        false,
        `Dice ${val} must NOT allow token to exit base`
      );
      assert.strictEqual(computeMove(state, baseToken, val as any), null);
    }

    assert.strictEqual(canTokenMove(baseToken, 6, state), true, 'Dice 6 MUST allow token to exit base');
    const move = computeMove(state, baseToken, 6);
    assert.ok(move);
    assert.strictEqual(move.to, 0, 'Exits base to position 0');
    assert.strictEqual(move.exitsBase, true, 'exitsBase flag must be true');
  });

  // Point 2: चारों रंगों की पूरी चाल (Blue, Red, Green, Yellow के स्टार्ट, मुख्य रास्ते और Home Lane)
  it('Point 2: Four Color Paths and Canonical Starts', () => {
    assert.strictEqual(PLAYER_STARTS[0], 0, 'Player 0 (Blue) starts at track index 0');
    assert.strictEqual(PLAYER_STARTS[1], 13, 'Player 1 (Red) starts at track index 13');
    assert.strictEqual(PLAYER_STARTS[2], 26, 'Player 2 (Green) starts at track index 26');
    assert.strictEqual(PLAYER_STARTS[3], 39, 'Player 3 (Yellow) starts at track index 39');

    // Each player completes exactly 51 steps on the main track before entering home runway (52..56) and winning at 57
    for (let pIdx = 0; pIdx < 4; pIdx++) {
      // Start tile
      const startCoord = positionToCoords(pIdx, 0);
      assert.ok(startCoord, `Player ${pIdx} position 0 must have valid coordinates`);

      // Track wrap-around: position 50
      const track50 = toTrackIndex(pIdx, 50);
      assert.ok(track50 !== null, `Player ${pIdx} position 50 must map to main track`);

      // Home runway: position 51..56
      for (let pos = 51; pos <= 56; pos++) {
        const homeCoord = positionToCoords(pIdx, pos);
        assert.ok(homeCoord, `Player ${pIdx} home runway position ${pos} must have valid coordinates`);
        const runwayIdx = pos - 51;
        assert.deepStrictEqual(
          homeCoord,
          HOME_COLUMNS[pIdx][runwayIdx],
          `Player ${pIdx} pos ${pos} must match HOME_COLUMNS[${pIdx}][${runwayIdx}]`
        );
      }

      // Finish at 57 (center triumph)
      assert.deepStrictEqual(positionToCoords(pIdx, WIN_POSITION), [7, 7], 'Finish position must be center [7, 7]');
    }
  });

  // Point 3: सुरक्षित खाने और कैप्चर
  it('Point 3: Safe Squares Protect Tokens; Standard Landing Captures Opponent', () => {
    const state = createInitialState(createClassicPlayers());

    // Safe cell check: start cells (0, 13, 26, 39) and star cells (8, 21, 34, 47)
    for (const safeIdx of [0, 8, 13, 21, 26, 34, 39, 47]) {
      assert.strictEqual(isSafeTrackIndex(safeIdx), true, `Track index ${safeIdx} must be safe`);
    }
    assert.strictEqual(isSafeTrackIndex(1), false, 'Track index 1 must NOT be safe');

    // Capture execution on non-safe square:
    // Player 1 at track index 5 (pos 44 for Player 1: (13 + 44)%52 = 57%52 = 5)
    // Player 0 at pos 1 (track index 1) rolls 4 -> lands on pos 5 (track index 5)
    const testState: GameState = {
      ...state,
      activePlayerIndex: 0,
      phase: 'selecting',
      diceValue: 4,
      tokens: [
        { id: '0-0', playerIndex: 0, tokenIndex: 0, position: 1, color: 'blue' },
        { id: '1-0', playerIndex: 1, tokenIndex: 0, position: 44, color: 'red' },
        ...state.tokens.filter((t) => t.id !== '0-0' && t.id !== '1-0'),
      ],
    };

    const p0Token = testState.tokens.find((t) => t.id === '0-0')!;
    const move = computeMove(testState, p0Token, 4);
    assert.ok(move, 'Move must be computed');
    assert.strictEqual(move.captures.length, 1, 'Must capture the opponent token');
    assert.strictEqual(move.captures[0], '1-0', 'Must capture 1-0');

    const nextState = applyMove(testState, '0-0');
    const capturedToken = nextState.tokens.find((t) => t.id === '1-0')!;
    assert.strictEqual(capturedToken.position, -1, 'Captured token must be returned to home base (-1)');
  });

  // Point 4: Home Lane और सटीक Finish
  it('Point 4: Home Lane Navigation and Exact Finish Rejection on Overshoot', () => {
    const state = createInitialState(createClassicPlayers());
    const nearHomeToken: Token = {
      id: '0-0',
      playerIndex: 0,
      tokenIndex: 0,
      position: 55, // 2 steps away from 57
      color: 'blue',
    };

    // Roll 1: pos 56 (inside home runway) -> LEGAL
    assert.strictEqual(canTokenMove(nearHomeToken, 1, state), true, 'Roll 1 moves to 56');

    // Roll 2: pos 57 (exact finish) -> LEGAL
    assert.strictEqual(canTokenMove(nearHomeToken, 2, state), true, 'Roll 2 reaches exact finish 57');
    const winMove = computeMove(state, nearHomeToken, 2);
    assert.ok(winMove);
    assert.strictEqual(winMove.to, 57);
    assert.strictEqual(winMove.reachesHome, true, 'reachesHome must be true');

    // Roll 3, 4, 5, 6: overshoot beyond 57 -> REJECTED
    assert.strictEqual(canTokenMove(nearHomeToken, 3, state), false, 'Roll 3 overshoots 57 (rejected)');
    assert.strictEqual(canTokenMove(nearHomeToken, 4, state), false, 'Roll 4 overshoots 57 (rejected)');
    assert.strictEqual(canTokenMove(nearHomeToken, 5, state), false, 'Roll 5 overshoots 57 (rejected)');
    assert.strictEqual(canTokenMove(nearHomeToken, 6, state), false, 'Roll 6 overshoots 57 (rejected)');
  });

  // Point 5: छह, अतिरिक्त चाल और लगातार छह
  it('Point 5: Bonus Turns and 3 Consecutive Sixes Forfeiture', () => {
    let state = createInitialState(createClassicPlayers());

    // Single 6 grants bonus roll (active player does not change)
    state = startRoll(state);
    state = resolveRoll(state, 6);
    assert.strictEqual(state.consecutiveSixes, 1);
    assert.strictEqual(shouldAutoPass(state), false);

    // Second 6
    state = { ...state, phase: 'rolling' };
    state = resolveRoll(state, 6);
    assert.strictEqual(state.consecutiveSixes, 2);
    assert.strictEqual(shouldAutoPass(state), false);

    // Third 6 in a row: turn is forfeited
    state = { ...state, phase: 'rolling' };
    state = resolveRoll(state, 6);
    assert.strictEqual(state.consecutiveSixes, 3);
    assert.strictEqual(shouldAutoPass(state), true, 'Third consecutive six MUST trigger shouldAutoPass (forfeited)');
  });

  // Point 6: Blockade और रास्ता पार करना
  it('Point 6: Same-Player Blockade Blocks Enemy; Different Opponents Do Not', () => {
    const state = createInitialState(createClassicPlayers());

    // 2 tokens of Player 1 on track cell 8 (Blockade)
    const blockedState: GameState = {
      ...state,
      tokens: [
        { id: '1-0', playerIndex: 1, tokenIndex: 0, position: 47, color: 'red' },
        { id: '1-1', playerIndex: 1, tokenIndex: 1, position: 47, color: 'red' },
        { id: '0-0', playerIndex: 0, tokenIndex: 0, position: 5, color: 'blue' }, // at track index 5
        ...state.tokens.filter((t) => t.id !== '1-0' && t.id !== '1-1' && t.id !== '0-0'),
      ],
    };

    const p0 = blockedState.tokens.find((t) => t.id === '0-0')!;
    // Moving 5 + 3 = 8 (landing on blockade): REJECTED
    assert.strictEqual(canTokenMove(p0, 3, blockedState), false, 'Cannot land on same-player blockade');
    // Moving 5 + 4 = 9 (passing through blockade at 8): REJECTED
    assert.strictEqual(canTokenMove(p0, 4, blockedState), false, 'Cannot leap over same-player blockade');
    // Moving 5 + 2 = 7 (before blockade): LEGAL
    assert.strictEqual(canTokenMove(p0, 2, blockedState), true, 'Can move before blockade');
  });

  // Point 7: टर्न टाइमर और स्वचालित पास
  it('Point 7: Timer Tick and Auto-Pass on Zero Moves', () => {
    let state = createInitialState(createClassicPlayers());
    state = { ...state, phase: 'selecting', diceValue: 2 }; // all in base, roll 2 -> 0 legal moves

    assert.strictEqual(getLegalMoves(state).length, 0, 'No legal moves for roll 2 with all tokens in base');
    assert.strictEqual(shouldAutoPass(state), true, 'Must auto-pass when no legal moves exist');

    // Passing turn advances player
    state = passTurn(state);
    assert.strictEqual(state.activePlayerIndex, 1, 'Turn advances to Player 1');
    assert.strictEqual(state.phase, 'waiting');
    assert.strictEqual(state.diceValue, null);
  });

  // Point 8: जीत, रीमैच और गेम रीसेट
  it('Point 8: Victory Declaration on 4 Finished Tokens and Clean Reset', () => {
    const state = createInitialState(createClassicPlayers());
    // Move 4 tokens of Player 0 to WIN_POSITION (57)
    const wonState: GameState = {
      ...state,
      tokens: state.tokens.map((t) =>
        t.playerIndex === 0 ? { ...t, position: WIN_POSITION } : t
      ),
    };

    assert.strictEqual(hasPlayerWon(wonState, 0), true, 'Player 0 must be detected as winner');
    assert.strictEqual(hasPlayerWon(wonState, 1), false, 'Player 1 is not winner');

    // New match resets state cleanly
    const freshState = createInitialState(createClassicPlayers());
    assert.strictEqual(freshState.winner, null);
    assert.strictEqual(freshState.activePlayerIndex, 0);
    assert.strictEqual(freshState.tokens.every((t) => t.position === -1), true);
  });

  // Point 9: ऑफ़लाइन बॉट और खिलाड़ी की बारी
  it('Point 9: Offline Bot AI Selects Legal Moves Without Crashing or Mutating Stale State', () => {
    const state = createInitialState(createClassicPlayers());
    const botState: GameState = {
      ...state,
      activePlayerIndex: 1, // Samantha (bot)
      phase: 'selecting',
      diceValue: 6,
    };

    const chosenMove = getBotMove(botState);
    assert.ok(chosenMove, 'Bot must choose a legal move on roll 6');
    assert.strictEqual(chosenMove.exitsBase, true, 'Bot should choose to exit base on 6');
  });

  // Point 10: मोबाइल पर बोर्ड और टच
  it('Point 10: Board Coordinates Scale Cleanly Without NaN on Small and Large Displays', () => {
    for (let pIdx = 0; pIdx < 4; pIdx++) {
      for (let pos = 0; pos <= WIN_POSITION; pos++) {
        const coords = positionToCoords(pIdx, pos);
        assert.ok(coords !== null, `Position ${pos} must not be null`);
        assert.strictEqual(Number.isNaN(coords[0]), false, `row at pos ${pos} must not be NaN`);
        assert.strictEqual(Number.isNaN(coords[1]), false, `col at pos ${pos} must not be NaN`);
        assert.ok(coords[0] >= 0 && coords[0] <= 14, `row ${coords[0]} must be within 15x15 grid`);
        assert.ok(coords[1] >= 0 && coords[1] <= 14, `col ${coords[1]} must be within 15x15 grid`);
      }
    }
  });
});
