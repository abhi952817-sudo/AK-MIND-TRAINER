// src/games/ludo/teamRules.ts
// Pure functional logic for Team / Jodi Modes in Ludo across 4, 5, 6, 8, 9, and 10 Player boards.
// Supports Solo FFA, 2-Player Pairs (Opposite seating), 3-Player Trios, and Squads (4v4 / 5v5).
// Enforces Safe Passthrough, Teammate Shield Blockers, Roll Sharing, and Team Win Conditions.

import { GameState, Player, Token, DiceValue } from './types';
import { WIN_POSITION, toTrackIndex } from './board';
import { getBoardConfig, BoardPlayerCount } from './polygonalBoardGeometry';

export type TeamMode =
  | 'individual'
  | 'jodi_2v2'
  | 'pairs_2p'
  | 'trios_3p'
  | 'squads_4v4'
  | 'squads_5v5'
  | 'jodi_4v4'
  | 'pairs_8p';

export interface TeamInfo {
  teamId: number;       // 0, 1, 2, ...
  name: string;         // e.g. "Team Alpha", "Duo 1", "Trio Alpha", "Squad Blue"
  color: string;        // Primary accent
  playerIndices: number[];
}

/**
 * Generates team allocations for any board size and mode.
 * Opposite seating auto-balance for even player boards:
 *   - 4P Pairs: (0, 2) & (1, 3)
 *   - 6P Pairs: (0, 3), (1, 4), (2, 5)
 *   - 6P Trios: (0, 2, 4) & (1, 3, 5)
 *   - 8P Pairs: (0, 4), (1, 5), (2, 6), (3, 7)
 *   - 8P Squads: (0, 2, 4, 6) vs (1, 3, 5, 7)
 *   - 9P Trios: (0, 3, 6), (1, 4, 7), (2, 5, 8)
 *   - 10P Pairs: (0, 5), (1, 6), (2, 7), (3, 8), (4, 9)
 *   - 10P Squads: (0, 2, 4, 6, 8) vs (1, 3, 5, 7, 9)
 */
export function getTeamsForMatch(playerCount: number, mode: TeamMode): TeamInfo[] {
  if (mode === 'individual') {
    return Array.from({ length: playerCount }, (_, i) => ({
      teamId: i,
      name: `Player ${i + 1}`,
      color: '#8D99AE',
      playerIndices: [i],
    }));
  }

  // 4-Player Pairs / Jodi 2v2
  if (playerCount === 4 || mode === 'jodi_2v2') {
    return [
      {
        teamId: 0,
        name: 'Team Alpha',
        color: '#3B82F6', // Blue
        playerIndices: [0, 2],
      },
      {
        teamId: 1,
        name: 'Team Beta',
        color: '#EF4444', // Red
        playerIndices: [1, 3],
      },
    ];
  }

  // 6-Player Boards
  if (playerCount === 6) {
    if (mode === 'trios_3p') {
      return [
        {
          teamId: 0,
          name: 'Trio Alpha',
          color: '#3B82F6',
          playerIndices: [0, 2, 4],
        },
        {
          teamId: 1,
          name: 'Trio Beta',
          color: '#10B981',
          playerIndices: [1, 3, 5],
        },
      ];
    }
    // Default 6P Pairs: 3 pairs of opposite players
    return [
      { teamId: 0, name: 'Pair 1 (0 & 3)', color: '#3B82F6', playerIndices: [0, 3] },
      { teamId: 1, name: 'Pair 2 (1 & 4)', color: '#10B981', playerIndices: [1, 4] },
      { teamId: 2, name: 'Pair 3 (2 & 5)', color: '#F59E0B', playerIndices: [2, 5] },
    ];
  }

  // 8-Player Boards
  if (playerCount === 8) {
    if (mode === 'squads_4v4' || mode === 'jodi_4v4') {
      return [
        {
          teamId: 0,
          name: 'Squad Alpha (Even)',
          color: '#3B82F6',
          playerIndices: [0, 2, 4, 6],
        },
        {
          teamId: 1,
          name: 'Squad Beta (Odd)',
          color: '#F59E0B',
          playerIndices: [1, 3, 5, 7],
        },
      ];
    }
    // Default 8P Pairs (opposite partners: i & i+4)
    return [
      { teamId: 0, name: 'Duo 1 (0 & 4)', color: '#3B82F6', playerIndices: [0, 4] },
      { teamId: 1, name: 'Duo 2 (1 & 5)', color: '#06B6D4', playerIndices: [1, 5] },
      { teamId: 2, name: 'Duo 3 (2 & 6)', color: '#EC4899', playerIndices: [2, 6] },
      { teamId: 3, name: 'Duo 4 (3 & 7)', color: '#8B5CF6', playerIndices: [3, 7] },
    ];
  }

  // 9-Player Boards (Trios)
  if (playerCount === 9) {
    return [
      {
        teamId: 0,
        name: 'Trio 1 (0, 3, 6)',
        color: '#3B82F6',
        playerIndices: [0, 3, 6],
      },
      {
        teamId: 1,
        name: 'Trio 2 (1, 4, 7)',
        color: '#10B981',
        playerIndices: [1, 4, 7],
      },
      {
        teamId: 2,
        name: 'Trio 3 (2, 5, 8)',
        color: '#F59E0B',
        playerIndices: [2, 5, 8],
      },
    ];
  }

  // 10-Player Boards
  if (playerCount === 10) {
    if (mode === 'squads_5v5') {
      return [
        {
          teamId: 0,
          name: 'Squad Titan (Even)',
          color: '#3B82F6',
          playerIndices: [0, 2, 4, 6, 8],
        },
        {
          teamId: 1,
          name: 'Squad Phoenix (Odd)',
          color: '#EF4444',
          playerIndices: [1, 3, 5, 7, 9],
        },
      ];
    }
    // Default 10P Pairs: 5 pairs of opposite players (i & i+5)
    return [
      { teamId: 0, name: 'Pair 1 (0 & 5)', color: '#3B82F6', playerIndices: [0, 5] },
      { teamId: 1, name: 'Pair 2 (1 & 6)', color: '#06B6D4', playerIndices: [1, 6] },
      { teamId: 2, name: 'Pair 3 (2 & 7)', color: '#10B981', playerIndices: [2, 7] },
      { teamId: 3, name: 'Pair 4 (3 & 8)', color: '#F59E0B', playerIndices: [3, 8] },
      { teamId: 4, name: 'Pair 5 (4 & 9)', color: '#8B5CF6', playerIndices: [4, 9] },
    ];
  }

  // Generic fallback for any other count
  const half = Math.floor(playerCount / 2);
  return [
    { teamId: 0, name: 'Team Alpha', color: '#3B82F6', playerIndices: Array.from({ length: half }, (_, i) => i * 2) },
    { teamId: 1, name: 'Team Beta', color: '#EF4444', playerIndices: Array.from({ length: half }, (_, i) => i * 2 + 1) },
  ];
}

/**
 * Returns true if player1 and player2 are on the same team.
 */
export function isTeammate(
  playerIndex1: number,
  playerIndex2: number,
  teamMode: TeamMode,
  playerCount = 4
): boolean {
  if (teamMode === 'individual') return playerIndex1 === playerIndex2;
  const teams = getTeamsForMatch(playerCount, teamMode);
  const t1 = teams.find((t) => t.playerIndices.includes(playerIndex1));
  const t2 = teams.find((t) => t.playerIndices.includes(playerIndex2));
  if (!t1 || !t2) return playerIndex1 === playerIndex2;
  return t1.teamId === t2.teamId;
}

/**
 * Returns team details for a given player index or null if solo.
 */
export function getTeamForPlayer(
  playerIndex: number,
  playerCount: number,
  teamMode: TeamMode
): { teamId: number; teamName: string; teamColor: string } | null {
  if (teamMode === 'individual') return null;
  const teams = getTeamsForMatch(playerCount, teamMode);
  const team = teams.find((t) => t.playerIndices.includes(playerIndex));
  if (!team) return null;
  return { teamId: team.teamId, teamName: team.name, teamColor: team.color };
}

/**
 * Returns all teammate indices for a given player (excluding themselves).
 */
export function getTeammateIndices(
  playerIndex: number,
  teamMode: TeamMode,
  playerCount = 4
): number[] {
  if (teamMode === 'individual') return [];
  const teams = getTeamsForMatch(playerCount, teamMode);
  const team = teams.find((t) => t.playerIndices.includes(playerIndex));
  if (!team) return [];
  return team.playerIndices.filter((idx) => idx !== playerIndex);
}

/**
 * Returns the primary partner index for a given player in pair mode.
 */
export function getPartnerIndex(
  playerIndex: number,
  teamMode: TeamMode,
  playerCount = 4
): number | null {
  const teammates = getTeammateIndices(playerIndex, teamMode, playerCount);
  return teammates.length > 0 ? teammates[0] : null;
}

/**
 * Checks if a specific player has finished all 4 of their own tokens.
 */
export function hasPlayerFinishedAllTokens(
  state: GameState,
  playerIndex: number,
  winPos = WIN_POSITION
): boolean {
  const tokens = state.tokens.filter((t) => t.playerIndex === playerIndex);
  if (tokens.length === 0) return false;
  return tokens.every((t) => t.position === winPos);
}

/**
 * Partner Assistance Rule (Turn & Roll Sharing):
 * When all tokens of a team member reach the central 'HOME', their turn/dice roll
 * transfers to their active team members.
 * Returns the list of tokens this active player is authorized to move.
 */
export function getControllableTokensForTurn(
  state: GameState,
  teamMode: TeamMode,
  winPos = WIN_POSITION
): Token[] {
  const activeIdx = state.activePlayerIndex;
  const selfFinished = hasPlayerFinishedAllTokens(state, activeIdx, winPos);

  if (!selfFinished || teamMode === 'individual') {
    // Normal turn: control only own tokens
    return state.tokens.filter((t) => t.playerIndex === activeIdx);
  }

  // Self finished in team mode: find active teammates with unfinished tokens
  const teammates = getTeammateIndices(activeIdx, teamMode, state.players.length);
  for (const teammateIdx of teammates) {
    const unfinishedTokens = state.tokens.filter(
      (t) => t.playerIndex === teammateIdx && t.position !== winPos
    );
    if (unfinishedTokens.length > 0) {
      return unfinishedTokens;
    }
  }

  return state.tokens.filter((t) => t.playerIndex === activeIdx);
}

/**
 * Team Victory Condition:
 * A team wins only when ALL tokens of ALL members in that team reach the central 'HOME'.
 */
export function checkTeamVictory(
  state: GameState,
  teamMode: TeamMode,
  winPos = WIN_POSITION
): { won: boolean; winningTeam: TeamInfo | null } {
  if (teamMode === 'individual') {
    if (state.winner !== null) {
      return {
        won: true,
        winningTeam: {
          teamId: state.winner,
          name: `Player ${state.winner + 1}`,
          color: '#8D99AE',
          playerIndices: [state.winner],
        },
      };
    }
    return { won: false, winningTeam: null };
  }

  const teams = getTeamsForMatch(state.players.length, teamMode);
  for (const team of teams) {
    const teamTokens = state.tokens.filter((t) =>
      team.playerIndices.includes(t.playerIndex)
    );
    if (teamTokens.length > 0 && teamTokens.every((t) => t.position === winPos)) {
      return { won: true, winningTeam: team };
    }
  }

  return { won: false, winningTeam: null };
}

/**
 * Teammate Shield (Double Blocker):
 * If 2 or more tokens of the same team stand on a single tile, it forms a blocker for opponents.
 * Opponents cannot land on or jump over this tile!
 * Friendly tokens can share/pass through safely.
 */
export function isOpponentBlockadeAtTrack(
  tokens: readonly Token[],
  trackIndex: number,
  movingPlayerIndex: number,
  teamMode: TeamMode,
  playerCount = 4,
  getTrackIndexFn: (playerIdx: number, pos: number) => number | null = toTrackIndex
): boolean {
  if (teamMode === 'individual') {
    // Standard Ludo blockade (2 opponent tokens on same cell)
    let count = 0;
    for (const t of tokens) {
      if (t.position < 0 || t.position > 50) continue;
      if (t.playerIndex === movingPlayerIndex) continue;
      const tIdx = getTrackIndexFn(t.playerIndex, t.position);
      if (tIdx !== null && tIdx === trackIndex) {
        count++;
        if (count >= 2) return true;
      }
    }
    return false;
  }

  const teams = getTeamsForMatch(playerCount, teamMode);
  const myTeam = teams.find((t) => t.playerIndices.includes(movingPlayerIndex));

  // Check each opposing team
  for (const enemyTeam of teams) {
    if (myTeam && enemyTeam.teamId === myTeam.teamId) continue;

    let count = 0;
    for (const t of tokens) {
      if (t.position < 0 || t.position > 50) continue;
      if (!enemyTeam.playerIndices.includes(t.playerIndex)) continue;

      const tIdx = getTrackIndexFn(t.playerIndex, t.position);
      if (tIdx !== null && tIdx === trackIndex) {
        count++;
        if (count >= 2) return true; // Opponent Team Blocker Shield active
      }
    }
  }

  return false;
}

/**
 * Backward compatibility alias for isTeamBlockadeAtTrack
 */
export function isTeamBlockadeAtTrack(
  tokens: readonly Token[],
  trackIndex: number,
  teamId: number,
  teamMode: TeamMode,
  playerCount = 4,
  getTrackIndexFn: (playerIdx: number, pos: number) => number | null = toTrackIndex
): boolean {
  const teams = getTeamsForMatch(playerCount, teamMode);
  const team = teams.find((t) => t.teamId === teamId);
  if (!team) return false;

  let count = 0;
  for (const t of tokens) {
    if (t.position < 0 || t.position > 50) continue;
    if (!team.playerIndices.includes(t.playerIndex)) continue;

    const tIdx = getTrackIndexFn(t.playerIndex, t.position);
    if (tIdx !== null && tIdx === trackIndex) {
      count++;
      if (count >= 2) return true;
    }
  }
  return false;
}
