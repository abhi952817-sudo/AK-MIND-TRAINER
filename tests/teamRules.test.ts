// tests/teamRules.test.ts
// Unit tests for Team / Jodi Mode (2v2) partnership mechanics, friendly non-capture,
// safe guard blocks, post-finish move delegation, and joint team victory.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getTeamsForMatch,
  isTeammate,
  getPartnerIndex,
  hasPlayerFinishedAllTokens,
  getControllableTokensForTurn,
  checkTeamVictory,
} from '../src/games/ludo/teamRules';
import { createInitialState, applyMove } from '../src/games/ludo/engine';
import { computeMove, getLegalMoves } from '../src/games/ludo/rules';
import { Player, Token } from '../src/games/ludo/types';
import { WIN_POSITION, toTrackIndex } from '../src/games/ludo/board';

const TEST_PLAYERS: Player[] = [
  { uid: 'p0', name: 'Player 0', color: 'blue',   index: 0, isBot: false, isHost: true,  isReady: true, isOnline: true },
  { uid: 'p1', name: 'Player 1', color: 'red',    index: 1, isBot: true,  isHost: false, isReady: true, isOnline: true },
  { uid: 'p2', name: 'Player 2', color: 'green',  index: 2, isBot: true,  isHost: false, isReady: true, isOnline: true },
  { uid: 'p3', name: 'Player 3', color: 'yellow', index: 3, isBot: true,  isHost: false, isReady: true, isOnline: true },
];

describe('Team & Jodi Mode (2v2) Partnership Constitution', () => {
  it('correctly assigns 2v2 teammates across opposite corners', () => {
    const teams = getTeamsForMatch(4, 'jodi_2v2');
    assert.strictEqual(teams.length, 2);
    // Team Alpha: Player 0 & Player 2
    assert.deepStrictEqual(teams[0].playerIndices, [0, 2]);
    // Team Beta: Player 1 & Player 3
    assert.deepStrictEqual(teams[1].playerIndices, [1, 3]);

    assert.strictEqual(isTeammate(0, 2, 'jodi_2v2'), true);
    assert.strictEqual(isTeammate(1, 3, 'jodi_2v2'), true);
    assert.strictEqual(isTeammate(0, 1, 'jodi_2v2'), false);
    assert.strictEqual(isTeammate(0, 3, 'jodi_2v2'), false);

    assert.strictEqual(getPartnerIndex(0, 'jodi_2v2'), 2);
    assert.strictEqual(getPartnerIndex(2, 'jodi_2v2'), 0);
    assert.strictEqual(getPartnerIndex(1, 'jodi_2v2'), 3);
    assert.strictEqual(getPartnerIndex(3, 'jodi_2v2'), 1);
  });

  it('prevents friendly capture when landing on a teammate token', () => {
    const state = createInitialState(TEST_PLAYERS);
    const p0TrackIdx = toTrackIndex(0, 5)!;
    const p2RelativePos = (p0TrackIdx - 26 + 52) % 52;

    const modifiedTokens: Token[] = state.tokens.map((t) => {
      if (t.id === '0-0') return { ...t, position: 2 };
      if (t.id === '2-0') return { ...t, position: p2RelativePos };
      return t;
    });

    const activeState = {
      ...state,
      tokens: modifiedTokens,
      activePlayerIndex: 0,
      diceValue: 3 as const,
      phase: 'selecting' as const,
    };

    const token0 = activeState.tokens.find((t) => t.id === '0-0')!;

    // 1. In Individual Mode: teammate DOES get captured (as opponent)
    const ffaMove = computeMove(activeState, token0, 3, 'individual')!;
    assert.strictEqual(ffaMove.captures.includes('2-0'), true);

    // 2. In Jodi 2v2 Mode: teammate is IMMUNE to capture and forms guard block!
    const jodiMove = computeMove(activeState, token0, 3, 'jodi_2v2')!;
    assert.strictEqual(jodiMove.captures.length, 0);
    assert.strictEqual(jodiMove.to, 5);
  });

  it('allows finished player to control partner tokens (Partner Assistance)', () => {
    const state = createInitialState(TEST_PLAYERS);

    const finishedTokens: Token[] = state.tokens.map((t) => {
      if (t.playerIndex === 0) return { ...t, position: WIN_POSITION };
      if (t.id === '2-0') return { ...t, position: 10 };
      return t;
    });

    const activeState = {
      ...state,
      tokens: finishedTokens,
      activePlayerIndex: 0,
      diceValue: 4 as const,
      phase: 'selecting' as const,
    };

    assert.strictEqual(hasPlayerFinishedAllTokens(activeState, 0), true);

    const controllable = getControllableTokensForTurn(activeState, 'jodi_2v2');
    assert.strictEqual(controllable.length > 0, true);
    assert.strictEqual(controllable.every((t) => t.playerIndex === 2), true);

    const legalMoves = getLegalMoves(activeState, 'jodi_2v2');
    assert.strictEqual(legalMoves.some((m) => m.tokenId === '2-0'), true);

    const afterMove = applyMove(activeState, '2-0', 'jodi_2v2');
    const partnerMoved = afterMove.tokens.find((t) => t.id === '2-0')!;
    assert.strictEqual(partnerMoved.position, 14);
  });

  it('declares team victory only when all 8 tokens reach the center', () => {
    const state = createInitialState(TEST_PLAYERS);

    const partialTokens: Token[] = state.tokens.map((t) => {
      if (t.playerIndex === 0) return { ...t, position: WIN_POSITION };
      if (t.playerIndex === 2 && t.tokenIndex < 3) return { ...t, position: WIN_POSITION };
      if (t.id === '2-3') return { ...t, position: 56 };
      return t;
    });

    const partialState = { ...state, tokens: partialTokens };
    const check1 = checkTeamVictory(partialState, 'jodi_2v2');
    assert.strictEqual(check1.won, false);

    const finalTokens = partialTokens.map((t) =>
      t.id === '2-3' ? { ...t, position: WIN_POSITION } : t
    );
    const finalState = { ...state, tokens: finalTokens };
    const check2 = checkTeamVictory(finalState, 'jodi_2v2');
    assert.strictEqual(check2.won, true);
    assert.strictEqual(check2.winningTeam?.teamId, 0);
  });

  it('allows finished player to release partner token from base on a roll of 6', () => {
    const state = createInitialState(TEST_PLAYERS);

    // Player 0 finished all 4 tokens, partner Player 2 has tokens in base (-1)
    const tokens = state.tokens.map((t) => {
      if (t.playerIndex === 0) return { ...t, position: WIN_POSITION };
      return t;
    });

    const activeState = {
      ...state,
      tokens,
      activePlayerIndex: 0,
      diceValue: 6 as const,
      phase: 'selecting' as const,
    };

    const legalMoves = getLegalMoves(activeState, 'jodi_2v2');
    const exitMove = legalMoves.find((m) => m.tokenId === '2-0');
    assert.notStrictEqual(exitMove, undefined);
    assert.strictEqual(exitMove?.exitsBase, true);
    assert.strictEqual(exitMove?.to, 0);

    const afterMove = applyMove(activeState, '2-0', 'jodi_2v2');
    const partnerToken = afterMove.tokens.find((t) => t.id === '2-0')!;
    assert.strictEqual(partnerToken.position, 0);
  });
});
