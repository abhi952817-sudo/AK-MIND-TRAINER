// tests/octagonal8P.test.ts
// Unit tests for Strict 8-Player Octagonal Ludo Board Engine and geometry.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  OCTAGON_SECTORS,
  OCTAGON_TRACK_LENGTH,
  OCTAGON_WIN_POSITION,
  getOctagonGeometry,
  getOctagonTokenPosition,
} from '../src/games/ludo/octagonalBoard';
import {
  createOctagonInitialState,
  computeOctagonMove,
  getOctagonLegalMoves,
  applyOctagonMove,
  isOctagonSafeTrackIndex,
  OctagonPlayer,
} from '../src/games/ludo/octagonalEngine';

const STRICT_8_PLAYERS: OctagonPlayer[] = OCTAGON_SECTORS.map((sec, idx) => ({
  id: idx === 0 ? 'you' : `bot-${idx}`,
  name: idx === 0 ? 'You' : `${sec.name} Bot`,
  sectorIndex: sec.index,
  color: sec.color,
  label: sec.label,
  isBot: idx !== 0,
  isHost: idx === 0,
}));

describe('Strict 8-Player Octagonal Board System', () => {
  it('correctly initializes strict 8-player match with 32 total tokens across 8 sectors', () => {
    const state = createOctagonInitialState(STRICT_8_PLAYERS);
    assert.strictEqual(state.players.length, 8);
    assert.strictEqual(state.tokens.length, 32);
    assert.strictEqual(state.activePlayerIndex, 0);
    assert.strictEqual(state.phase, 'waiting');
    assert.strictEqual(state.winner, null);

    const labels = state.players.map((p) => p.label);
    assert.deepStrictEqual(labels, ['01', '02', '03', '04', '05', '06', '07', '08']);
  });

  it('validates 64-step track length and 8 apex safe spots', () => {
    assert.strictEqual(OCTAGON_TRACK_LENGTH, 64);
    assert.strictEqual(OCTAGON_WIN_POSITION, 69);

    for (let k = 0; k < 8; k++) {
      assert.strictEqual(isOctagonSafeTrackIndex(k * 8), true);
      assert.strictEqual(isOctagonSafeTrackIndex(k * 8 + 4), true);
      assert.strictEqual(isOctagonSafeTrackIndex(k * 8 + 2), false);
    }
  });

  it('exits base on a roll of 6 and reaches start position 0', () => {
    const state = createOctagonInitialState(STRICT_8_PLAYERS);
    const token = state.tokens[0];

    const move5 = computeOctagonMove(state, token, 5);
    assert.strictEqual(move5, null);

    const move6 = computeOctagonMove(state, token, 6);
    assert.notStrictEqual(move6, null);
    assert.strictEqual(move6?.exitsBase, true);
    assert.strictEqual(move6?.to, 0);
  });

  it('navigates the perimeter track, enters runway, and wins at position 69', () => {
    const state = createOctagonInitialState(STRICT_8_PLAYERS);
    const modifiedTokens = state.tokens.map((t) =>
      t.id === '0-0' ? { ...t, position: 68 } : t
    );
    const activeState = {
      ...state,
      tokens: modifiedTokens,
      activePlayerIndex: 0,
      diceValue: 1,
      phase: 'selecting' as const,
    };

    const legal = getOctagonLegalMoves(activeState);
    const winMove = legal.find((m) => m.tokenId === '0-0');
    assert.notStrictEqual(winMove, undefined);
    assert.strictEqual(winMove?.to, OCTAGON_WIN_POSITION);
    assert.strictEqual(winMove?.reachesHome, true);

    const overshoot = computeOctagonMove(activeState, activeState.tokens[0], 2);
    assert.strictEqual(overshoot, null);
  });

  it('cycles clockwise across all 8 players on regular turns', () => {
    const state = createOctagonInitialState(STRICT_8_PLAYERS);
    const onTrackTokens = state.tokens.map((t) =>
      t.id === '0-0' ? { ...t, position: 10 } : t
    );
    const selectingState = {
      ...state,
      tokens: onTrackTokens,
      activePlayerIndex: 0,
      diceValue: 3,
      phase: 'selecting' as const,
    };

    const afterMove = applyOctagonMove(selectingState, '0-0');
    assert.strictEqual(afterMove.activePlayerIndex, 1);
    assert.strictEqual(afterMove.phase, 'waiting');
  });

  it('forfeits turn on 3 consecutive sixes in octagonal engine', () => {
    const state = createOctagonInitialState(STRICT_8_PLAYERS);
    const onTrackTokens = state.tokens.map((t) =>
      t.id === '0-0' ? { ...t, position: 10 } : t
    );
    const forfeitState = {
      ...state,
      tokens: onTrackTokens,
      activePlayerIndex: 0,
      diceValue: 6,
      consecutiveSixes: 3,
      phase: 'selecting' as const,
    };

    const legal = getOctagonLegalMoves(forfeitState);
    assert.strictEqual(legal.length, 0); // zero legal moves allowed on 3rd six
  });

  it('skips finished players in octagonal turn cycling', () => {
    const state = createOctagonInitialState(STRICT_8_PLAYERS);
    const onTrackTokens = state.tokens.map((t) =>
      t.id === '0-0' ? { ...t, position: 10 } : t
    );
    const stateWithFinishedP1 = {
      ...state,
      tokens: onTrackTokens,
      activePlayerIndex: 0,
      diceValue: 3,
      finishOrder: [1], // Player 1 is finished
      phase: 'selecting' as const,
    };

    const afterMove = applyOctagonMove(stateWithFinishedP1, '0-0');
    // Player 1 is skipped, advances to Player 2
    assert.strictEqual(afterMove.activePlayerIndex, 2);
  });

  it('calculates valid 2D coordinates for all track and runway positions without NaN', () => {
    const geom = getOctagonGeometry(800, 800);
    assert.strictEqual(geom.trackCells.length, 64);
    assert.strictEqual(geom.homeRunways.length, 8);

    for (let p = 0; p < 8; p++) {
      for (let pos = -1; pos <= OCTAGON_WIN_POSITION; pos++) {
        const pt = getOctagonTokenPosition(p, 0, pos, geom);
        assert.strictEqual(Number.isFinite(pt.x), true);
        assert.strictEqual(Number.isFinite(pt.y), true);
      }
    }
  });
});
