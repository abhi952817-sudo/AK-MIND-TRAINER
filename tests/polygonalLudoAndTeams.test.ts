// tests/polygonalLudoAndTeams.test.ts
// Comprehensive unit tests for Polygonal Ludo Boards (4, 5, 6, 8, 9, 10 players) and Team Partnership Modes.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPolygonalBoardGeometry,
  getBoardConfig,
  BoardPlayerCount,
} from '../src/games/ludo/polygonalBoardGeometry';
import {
  getTeamsForMatch,
  isTeammate,
  getTeammateIndices,
  getPartnerIndex,
  isOpponentBlockadeAtTrack,
  checkTeamVictory,
} from '../src/games/ludo/teamRules';
import {
  createPolygonalInitialState,
  getPolygonalLegalMoves,
  applyPolygonalMove,
  getAbsoluteTrackIndex,
} from '../src/games/ludo/polygonalEngine';

test('Polygonal Ludo Geometry: Supports all 6 board layouts (4, 5, 6, 8, 9, 10 players)', (t) => {
  const counts: BoardPlayerCount[] = [4, 5, 6, 8, 9, 10];

  for (const count of counts) {
    const config = getBoardConfig(count);
    assert.equal(config.playerCount, count);
    assert.equal(config.sectors.length, count);
    assert.ok(config.trackLength > 0);
    assert.ok(config.winPosition > config.trackLength);

    const geom = getPolygonalBoardGeometry(count, 800, 800);
    assert.equal(geom.baseSlots.length, count);
    assert.equal(geom.runwayCells.length, count);
    assert.equal(geom.trackCells.length, config.trackLength);

    // Verify all 4 token slots exist per sector and have valid coordinates
    for (let s = 0; s < count; s++) {
      assert.equal(geom.baseSlots[s].length, 4);
      for (const slot of geom.baseSlots[s]) {
        assert.ok(!Number.isNaN(slot.x));
        assert.ok(!Number.isNaN(slot.y));
        assert.ok(slot.x >= 0 && slot.x <= 800);
        assert.ok(slot.y >= 0 && slot.y <= 800);
      }
    }

    // Verify all track cells have valid coordinates
    for (const cell of geom.trackCells) {
      assert.ok(!Number.isNaN(cell.x));
      assert.ok(!Number.isNaN(cell.y));
    }
  }
});

test('Team Rules: 2-Player Pairs on 4, 6, 8, and 10 player boards (Opposite Seating)', () => {
  // 4-Player: (0, 2) & (1, 3)
  const teams4 = getTeamsForMatch(4, 'pairs_2p');
  assert.equal(teams4.length, 2);
  assert.deepEqual(teams4[0].playerIndices, [0, 2]);
  assert.deepEqual(teams4[1].playerIndices, [1, 3]);
  assert.ok(isTeammate(0, 2, 'pairs_2p', 4));
  assert.ok(!isTeammate(0, 1, 'pairs_2p', 4));

  // 6-Player: (0, 3), (1, 4), (2, 5)
  const teams6 = getTeamsForMatch(6, 'pairs_2p');
  assert.equal(teams6.length, 3);
  assert.deepEqual(teams6[0].playerIndices, [0, 3]);
  assert.deepEqual(teams6[1].playerIndices, [1, 4]);
  assert.deepEqual(teams6[2].playerIndices, [2, 5]);
  assert.ok(isTeammate(0, 3, 'pairs_2p', 6));
  assert.ok(!isTeammate(0, 1, 'pairs_2p', 6));

  // 8-Player: (0, 4), (1, 5), (2, 6), (3, 7)
  const teams8 = getTeamsForMatch(8, 'pairs_2p');
  assert.equal(teams8.length, 4);
  assert.deepEqual(teams8[0].playerIndices, [0, 4]);
  assert.deepEqual(teams8[1].playerIndices, [1, 5]);
  assert.deepEqual(teams8[2].playerIndices, [2, 6]);
  assert.deepEqual(teams8[3].playerIndices, [3, 7]);
  assert.ok(isTeammate(0, 4, 'pairs_2p', 8));

  // 10-Player: (0, 5), (1, 6), (2, 7), (3, 8), (4, 9)
  const teams10 = getTeamsForMatch(10, 'pairs_2p');
  assert.equal(teams10.length, 5);
  assert.deepEqual(teams10[0].playerIndices, [0, 5]);
  assert.deepEqual(teams10[1].playerIndices, [1, 6]);
  assert.deepEqual(teams10[4].playerIndices, [4, 9]);
  assert.ok(isTeammate(0, 5, 'pairs_2p', 10));
});

test('Team Rules: 3-Player Trios on 6 and 9 player boards', () => {
  // 6-Player Trios: (0, 2, 4) vs (1, 3, 5)
  const trios6 = getTeamsForMatch(6, 'trios_3p');
  assert.equal(trios6.length, 2);
  assert.deepEqual(trios6[0].playerIndices, [0, 2, 4]);
  assert.deepEqual(trios6[1].playerIndices, [1, 3, 5]);
  assert.ok(isTeammate(0, 4, 'trios_3p', 6));
  assert.ok(!isTeammate(0, 1, 'trios_3p', 6));

  // 9-Player Trios: (0, 3, 6), (1, 4, 7), (2, 5, 8)
  const trios9 = getTeamsForMatch(9, 'trios_3p');
  assert.equal(trios9.length, 3);
  assert.deepEqual(trios9[0].playerIndices, [0, 3, 6]);
  assert.deepEqual(trios9[1].playerIndices, [1, 4, 7]);
  assert.deepEqual(trios9[2].playerIndices, [2, 5, 8]);
  assert.ok(isTeammate(0, 6, 'trios_3p', 9));
  assert.ok(isTeammate(1, 7, 'trios_3p', 9));
  assert.ok(!isTeammate(0, 1, 'trios_3p', 9));
});

test('Team Rules: Squads (4v4 on 8P, 5v5 on 10P)', () => {
  // 8-Player 4v4 Squads: Even vs Odd
  const squads8 = getTeamsForMatch(8, 'squads_4v4');
  assert.equal(squads8.length, 2);
  assert.deepEqual(squads8[0].playerIndices, [0, 2, 4, 6]);
  assert.deepEqual(squads8[1].playerIndices, [1, 3, 5, 7]);
  assert.ok(isTeammate(0, 6, 'squads_4v4', 8));
  assert.ok(!isTeammate(0, 3, 'squads_4v4', 8));

  // 10-Player 5v5 Squads: Even vs Odd
  const squads10 = getTeamsForMatch(10, 'squads_5v5');
  assert.equal(squads10.length, 2);
  assert.deepEqual(squads10[0].playerIndices, [0, 2, 4, 6, 8]);
  assert.deepEqual(squads10[1].playerIndices, [1, 3, 5, 7, 9]);
  assert.ok(isTeammate(0, 8, 'squads_5v5', 10));
  assert.ok(!isTeammate(0, 5, 'squads_5v5', 10));
});

test('Teammate Safe Passthrough: Player cannot cut/kill friendly tokens', () => {
  const dummyPlayers = Array.from({ length: 4 }, (_, i) => ({
    uid: `p${i}`,
    name: `Player ${i}`,
    color: 'blue' as const,
    index: i,
    isBot: i !== 0,
    isHost: i === 0,
    isReady: true,
    isOnline: true,
  }));

  const state = createPolygonalInitialState(4, dummyPlayers, 'pairs_2p');
  // Place teammate (Player 2) token at position 5
  // Player 0 and Player 2 are teammates in pairs_2p
  state.tokens[0].position = 2; // Player 0 token at pos 2
  // Player 2's track pos 0 is at track 26.
  // Let's place Player 2 token on the exact same tile as Player 0 would land on with a roll of 3
  const destTrackIdx = getAbsoluteTrackIndex(0, 5, 4);
  // Find Player 2 relative pos that maps to destTrackIdx: (26 + relPos) % 52 = 5 => relPos = 31
  state.tokens[8].position = 31; // Player 2 token on same track cell
  assert.equal(getAbsoluteTrackIndex(2, 31, 4), destTrackIdx);

  state.activePlayerIndex = 0;
  state.diceValue = 3;
  state.phase = 'selecting';

  const moves = getPolygonalLegalMoves(state);
  const move = moves.find((m) => m.tokenId === state.tokens[0].id);
  assert.ok(move, 'Move should be legal');
  // Safe passthrough: captures should be empty because teammate is on dest
  assert.equal(move?.captures.length, 0, 'Friendly token must NOT be captured');
});

test('Teammate Shield Blocker: 2 enemy tokens on a single tile block opponents from landing or leaping over', () => {
  const dummyPlayers = Array.from({ length: 4 }, (_, i) => ({
    uid: `p${i}`,
    name: `Player ${i}`,
    color: 'blue' as const,
    index: i,
    isBot: i !== 0,
    isHost: i === 0,
    isReady: true,
    isOnline: true,
  }));

  const state = createPolygonalInitialState(4, dummyPlayers, 'pairs_2p');
  // Enemy team (Team Beta) has Player 1 and Player 3.
  // Place 2 tokens of Player 1 on track cell 4 (relative pos 4 for Player 0)
  // Player 1 startTrack is 13. To place on cell 4: relPos = 43 (since (13 + 43) % 52 = 4)
  state.tokens[4].position = 43; // Player 1 token 0 on track cell 4
  state.tokens[5].position = 43; // Player 1 token 1 on track cell 4 (forms a 2-token Team Blocker)

  // Verify blockade detection function
  assert.ok(
    isOpponentBlockadeAtTrack(state.tokens, 4, 0, 'pairs_2p', 4, (p, pos) =>
      getAbsoluteTrackIndex(p, pos, 4)
    )
  );

  // Player 0 token is at relative position 2 (track cell 2)
  state.tokens[0].position = 2;
  state.activePlayerIndex = 0;
  state.phase = 'selecting';

  // 1. Roll 2: lands exactly on the blocker (relative pos 4) -> should be blocked!
  state.diceValue = 2;
  let moves = getPolygonalLegalMoves(state);
  assert.ok(!moves.some((m) => m.tokenId === state.tokens[0].id), 'Cannot land on enemy blocker');

  // 2. Roll 4: tries to leap over the blocker (from pos 2 to pos 6) -> should be blocked!
  state.diceValue = 4;
  moves = getPolygonalLegalMoves(state);
  assert.ok(!moves.some((m) => m.tokenId === state.tokens[0].id), 'Cannot leap over enemy blocker');
});

test('Turn & Roll Sharing: When player finished all tokens, roll transfers to active teammate', () => {
  const dummyPlayers = Array.from({ length: 4 }, (_, i) => ({
    uid: `p${i}`,
    name: `Player ${i}`,
    color: 'blue' as const,
    index: i,
    isBot: i !== 0,
    isHost: i === 0,
    isReady: true,
    isOnline: true,
  }));

  const state = createPolygonalInitialState(4, dummyPlayers, 'pairs_2p');
  const config = getBoardConfig(4);

  // Player 0 has finished all 4 tokens at winPosition (57)
  for (let t = 0; t < 4; t++) {
    state.tokens[t].position = config.winPosition;
  }

  // Teammate (Player 2) has unfinished tokens at base (-1)
  state.activePlayerIndex = 0;
  state.diceValue = 6;
  state.phase = 'selecting';

  const moves = getPolygonalLegalMoves(state);
  // Legal moves should be available for Player 2's tokens!
  assert.ok(moves.length > 0, 'Roll should share to teammate tokens');
  assert.ok(moves.every((m) => m.tokenId.startsWith('2-')), 'Tokens controlled must belong to Player 2');
});

test('Winning Condition: Team only wins when ALL tokens of ALL members reach HOME', () => {
  const dummyPlayers = Array.from({ length: 4 }, (_, i) => ({
    uid: `p${i}`,
    name: `Player ${i}`,
    color: 'blue' as const,
    index: i,
    isBot: i !== 0,
    isHost: i === 0,
    isReady: true,
    isOnline: true,
  }));

  const state = createPolygonalInitialState(4, dummyPlayers, 'pairs_2p');
  const config = getBoardConfig(4);

  // Only Player 0 finishes all 4 tokens (4 / 8 tokens home)
  for (let t = 0; t < 4; t++) {
    state.tokens[t].position = config.winPosition;
  }

  let victory = checkTeamVictory(state, 'pairs_2p', config.winPosition);
  assert.equal(victory.won, false, 'Team must NOT win when only 1 member is finished');

  // Now Player 2 (teammate) also finishes all 4 tokens (8 / 8 tokens home)
  for (let t = 8; t < 12; t++) {
    state.tokens[t].position = config.winPosition;
  }

  victory = checkTeamVictory(state, 'pairs_2p', config.winPosition);
  assert.equal(victory.won, true, 'Team wins when ALL tokens of ALL team members reach HOME');
  assert.equal(victory.winningTeam?.teamId, 0);
  assert.equal(victory.winningTeam?.name, 'Team Alpha');
});
