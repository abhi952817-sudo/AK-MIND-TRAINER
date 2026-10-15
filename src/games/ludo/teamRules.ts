// src/games/ludo/teamRules.ts
// Pure functional logic for Team / Jodi Mode in Ludo (2v2, 4v4, and custom partnerships).

import { GameState, MoveOption, Player, Token, DiceValue } from './types';
import { WIN_POSITION, toTrackIndex, isSafeTrackIndex } from './board';

export type TeamMode = 'individual' | 'jodi_2v2' | 'jodi_4v4' | 'pairs_8p';

export interface TeamInfo {
  teamId: number;       // 0 = Team Alpha, 1 = Team Beta, etc.
  name: string;         // "Team Alpha", "Team Beta"
  color: string;        // Primary accent
  playerIndices: number[];
}

/**
 * Default team assignments:
 * 4-Player 2v2:
 *   Team Alpha (0): Player 0 (Red/Blue) & Player 2 (Green/Yellow) - opposite corners
 *   Team Beta  (1): Player 1 (Green/Red) & Player 3 (Yellow/Blue) - opposite corners
 *
 * 8-Player 4v4:
 *   Team Alpha (0): Players 0, 2, 4, 6 (Even sectors)
 *   Team Beta  (1): Players 1, 3, 5, 7 (Odd sectors)
 *
 * 8-Player Pairs (4 pairs of 2):
 *   Pair 0: 0 & 4 (Opposite)
 *   Pair 1: 1 & 5
 *   Pair 2: 2 & 6
 *   Pair 3: 3 & 7
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

  if (mode === 'jodi_2v2' || playerCount === 4) {
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

  if (mode === 'jodi_4v4' && playerCount === 8) {
    return [
      {
        teamId: 0,
        name: 'Team Alpha (Even)',
        color: '#3B82F6',
        playerIndices: [0, 2, 4, 6],
      },
      {
        teamId: 1,
        name: 'Team Beta (Odd)',
        color: '#F59E0B',
        playerIndices: [1, 3, 5, 7],
      },
    ];
  }

  if (mode === 'pairs_8p' && playerCount === 8) {
    return [
      { teamId: 0, name: 'Duo 1 (0 & 4)', color: '#3B82F6', playerIndices: [0, 4] },
      { teamId: 1, name: 'Duo 2 (1 & 5)', color: '#06B6D4', playerIndices: [1, 5] },
      { teamId: 2, name: 'Duo 3 (2 & 6)', color: '#EC4899', playerIndices: [2, 6] },
      { teamId: 3, name: 'Duo 4 (3 & 7)', color: '#8B5CF6', playerIndices: [3, 7] },
    ];
  }

  // Fallback 2-teams split
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
 * Returns the primary partner index for a given player in 2v2 mode.
 */
export function getPartnerIndex(
  playerIndex: number,
  teamMode: TeamMode,
  playerCount = 4
): number | null {
  if (teamMode === 'individual') return null;
  const teams = getTeamsForMatch(playerCount, teamMode);
  const team = teams.find((t) => t.playerIndices.includes(playerIndex));
  if (!team) return null;
  const partner = team.playerIndices.find((idx) => idx !== playerIndex);
  return partner ?? null;
}

/**
 * Checks if a specific player has finished all 4 of their own tokens.
 */
export function hasPlayerFinishedAllTokens(state: GameState, playerIndex: number): boolean {
  const tokens = state.tokens.filter((t) => t.playerIndex === playerIndex);
  if (tokens.length === 0) return false;
  return tokens.every((t) => t.position === WIN_POSITION);
}

/**
 * Partner Assistance Rule (Jodi Mode):
 * When a player has already finished all 4 of their own tokens at WIN_POSITION,
 * they roll on their turn to help move their partner's remaining tokens!
 * Returns the list of tokens this active player is authorized to move.
 */
export function getControllableTokensForTurn(
  state: GameState,
  teamMode: TeamMode
): Token[] {
  const activeIdx = state.activePlayerIndex;
  const selfFinished = hasPlayerFinishedAllTokens(state, activeIdx);

  if (!selfFinished || teamMode === 'individual') {
    // Normal turn: control only own tokens
    return state.tokens.filter((t) => t.playerIndex === activeIdx);
  }

  // Self finished in team mode: can control teammate tokens!
  const partnerIdx = getPartnerIndex(activeIdx, teamMode, state.players.length);
  if (partnerIdx === null) {
    return state.tokens.filter((t) => t.playerIndex === activeIdx);
  }

  // Return partner's unfinished tokens
  return state.tokens.filter(
    (t) => t.playerIndex === partnerIdx && t.position !== WIN_POSITION
  );
}

/**
 * Team Victory Condition:
 * A team wins when ALL tokens belonging to all members of that team have reached WIN_POSITION.
 * For 2v2, this is 4 + 4 = 8 tokens.
 */
export function checkTeamVictory(
  state: GameState,
  teamMode: TeamMode
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
    if (teamTokens.length > 0 && teamTokens.every((t) => t.position === WIN_POSITION)) {
      return { won: true, winningTeam: team };
    }
  }

  return { won: false, winningTeam: null };
}

/**
 * Team Guard Block / Blockade Detection:
 * A friendly blockade is formed on a track index if 2 or more tokens of the SAME team occupy it.
 * Opponents cannot land on or pass through this cell.
 */
export function isTeamBlockadeAtTrack(
  tokens: readonly Token[],
  trackIndex: number,
  teamId: number,
  teamMode: TeamMode,
  playerCount = 4
): boolean {
  const teams = getTeamsForMatch(playerCount, teamMode);
  const team = teams.find((t) => t.teamId === teamId);
  if (!team) return false;

  let count = 0;
  for (const t of tokens) {
    if (t.position < 0 || t.position > 50) continue;
    if (!team.playerIndices.includes(t.playerIndex)) continue;

    const tIdx = toTrackIndex(t.playerIndex, t.position);
    if (tIdx === trackIndex) {
      count++;
      if (count >= 2) return true;
    }
  }
  return false;
}
