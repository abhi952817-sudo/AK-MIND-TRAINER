// tests/decagonal10P.test.ts
// Unit tests for 10-Player Decagonal Ludo Board Engine and geometry.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DECAGON_SECTORS,
  DECAGON_TRACK_LENGTH,
  DECAGON_WIN_POSITION,
  getDecagonGeometry,
  getDecagonTokenPosition,
} from '../src/games/ludo/decagonalBoard';
import {
  createDecagonInitialState,
  computeDecagonMove,
  getDecagonLegalMoves,
  applyDecagonMove,
  isDecagonSafeTrackIndex,
  DecagonPlayer,
} from '../src/games/ludo/decagonalEngine';

const TEN_PLAYERS: DecagonPlayer[] = DECAGON_SECTORS.map((sec, idx) => ({
  id: idx === 0 ? 'you' : `bot-${idx}`,
  name: idx === 0 ? 'You' : `${sec.name} Bot`,
  sectorIndex: sec.index,
  color: sec.color,
  label: sec.label,
  isBot: idx !== 0,
  isHost: idx === 0,
}));

describe('10-Player Decagonal Board System', () => {
  it('correctly initializes 10-player match with 40 tokens across 10 arms', () => {
    const state = createDecagonInitialState(TEN_PLAYERS);
    assert.strictEqual(state.players.length, 10);
    assert.strictEqual(state.tokens.length, 40);
    assert.strictEqual(state.activePlayerIndex, 0);
    assert.strictEqual(state.phase, 'waiting');

    const labels = state.players.map((p) => p.label);
    assert.deepStrictEqual(labels, ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  });

  it('validates 80-step track length and 10 apex safe spots', () => {
    assert.strictEqual(DECAGON_TRACK_LENGTH, 80);
    assert.strictEqual(DECAGON_WIN_POSITION, 85);

    for (let k = 0; k < 10; k++) {
      assert.strictEqual(isDecagonSafeTrackIndex(k * 8), true);
      assert.strictEqual(isDecagonSafeTrackIndex(k * 8 + 4), true);
    }
  });

  it('exits base on roll 6 and advances to position 0', () => {
    const state = createDecagonInitialState(TEN_PLAYERS);
    const token = state.tokens[0];

    const move4 = computeDecagonMove(state, token, 4);
    assert.strictEqual(move4, null);

    const move6 = computeDecagonMove(state, token, 6);
    assert.notStrictEqual(move6, null);
    assert.strictEqual(move6?.exitsBase, true);
    assert.strictEqual(move6?.to, 0);
  });

  it('executes move on 10-player board and cycles turn to next player', () => {
    const state = createDecagonInitialState(TEN_PLAYERS);
    const modified = state.tokens.map((t) =>
      t.id === '0-0' ? { ...t, position: 10 } : t
    );
    const selectingState = {
      ...state,
      tokens: modified,
      activePlayerIndex: 0,
      diceValue: 3,
      phase: 'selecting' as const,
    };

    const legal = getDecagonLegalMoves(selectingState);
    assert.strictEqual(legal.length > 0, true);

    const nextState = applyDecagonMove(selectingState, '0-0');
    assert.strictEqual(nextState.activePlayerIndex, 1);
  });

  it('enforces enemy blockade rejection and prevents landing or leaping over on 10P board', () => {
    const state = createDecagonInitialState(TEN_PLAYERS);
    // Player 1 forms a blockade on cell 10 (relative to Player 0)
    // Sector 0 startTrackIdx is 0. Cell 10 is global track index 10.
    // Sector 1 startTrackIdx is 8. For Player 1, cell 10 is relative pos 2 (8 + 2 = 10).
    const modified = state.tokens.map((t) => {
      if (t.id === '0-0') return { ...t, position: 7 }; // 3 steps away from cell 10
      if (t.id === '1-0') return { ...t, position: 2 }; // on cell 10
      if (t.id === '1-1') return { ...t, position: 2 }; // on cell 10 (blockade!)
      return t;
    });

    const activeState = {
      ...state,
      tokens: modified,
      activePlayerIndex: 0,
      diceValue: 3,
      phase: 'selecting' as const,
    };

    const token0 = activeState.tokens.find((t) => t.id === '0-0')!;

    // Move landing directly on blockade (7 + 3 = 10) must be rejected
    const landingMove = computeDecagonMove(activeState, token0, 3);
    assert.strictEqual(landingMove, null);

    // Move leaping over blockade (7 + 4 = 11) must also be rejected
    const leapingMove = computeDecagonMove(activeState, token0, 4);
    assert.strictEqual(leapingMove, null);

    // Move stopping before blockade (7 + 2 = 9) must be valid
    const validMove = computeDecagonMove(activeState, token0, 2);
    assert.notStrictEqual(validMove, null);
    assert.strictEqual(validMove?.to, 9);
  });

  it('forfeits turn on 3 consecutive sixes in decagonal engine', () => {
    const state = createDecagonInitialState(TEN_PLAYERS);
    const modified = state.tokens.map((t) =>
      t.id === '0-0' ? { ...t, position: 10 } : t
    );
    const forfeitState = {
      ...state,
      tokens: modified,
      activePlayerIndex: 0,
      diceValue: 6,
      consecutiveSixes: 3,
      phase: 'selecting' as const,
    };

    const legal = getDecagonLegalMoves(forfeitState);
    assert.strictEqual(legal.length, 0); // zero legal moves allowed on 3rd six
  });

  it('computes valid 2D coordinates for all 10 players and positions', () => {
    const geom = getDecagonGeometry(800, 800);
    assert.strictEqual(geom.trackCells.length, 80);
    assert.strictEqual(geom.homeRunways.length, 10);
    assert.strictEqual(geom.baseSlots.length, 10);

    for (let p = 0; p < 10; p++) {
      for (let pos = -1; pos <= DECAGON_WIN_POSITION; pos++) {
        const pt = getDecagonTokenPosition(p, 0, pos, geom);
        assert.strictEqual(Number.isFinite(pt.x), true);
        assert.strictEqual(Number.isFinite(pt.y), true);
      }
    }
  });
});
