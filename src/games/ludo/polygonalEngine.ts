// src/games/ludo/polygonalEngine.ts
// Pure functional rules and game engine for Polygonal Ludo Boards (4, 5, 6, 8, 9, 10 players).
// Enforces Safe Passthrough, Teammate Shield Blockers, Partner Assistance Roll Sharing, and Team Victory.

import { BoardPlayerCount, getBoardConfig } from './polygonalBoardGeometry';
import {
  TeamMode,
  TeamInfo,
  getTeamsForMatch,
  isTeammate,
  getTeammateIndices,
  hasPlayerFinishedAllTokens,
  checkTeamVictory,
  isOpponentBlockadeAtTrack,
} from './teamRules';
import { Token, Player, GamePhase, TurnRecord, DiceValue } from './types';

export interface PolygonalMoveOption {
  tokenId: string;
  from: number;
  to: number;
  steps: number;
  captures: string[];
  reachesHome: boolean;
  exitsBase: boolean;
}

export interface PolygonalGameState {
  boardType: BoardPlayerCount;
  teamMode: TeamMode;
  teams: TeamInfo[];
  players: Player[];
  tokens: Token[];
  activePlayerIndex: number;
  diceValue: DiceValue | null;
  phase: GamePhase;
  consecutiveSixes: number;
  history: TurnRecord[];
  winner: number | null;
  winningTeam: TeamInfo | null;
  finishOrder: number[];
  startedAt: number;
  turnStartedAt: number;
}

export function createPolygonalInitialState(
  boardType: BoardPlayerCount,
  players: Player[],
  teamMode: TeamMode = 'individual'
): PolygonalGameState {
  const config = getBoardConfig(boardType);
  const teams = getTeamsForMatch(boardType, teamMode);

  // Initialize 4 tokens for each player
  const tokens: Token[] = [];
  for (let pIdx = 0; pIdx < boardType; pIdx++) {
    const sec = config.sectors[pIdx];
    const color = (sec?.name?.toLowerCase() ?? 'blue') as any;
    for (let tIdx = 0; tIdx < 4; tIdx++) {
      tokens.push({
        id: `${pIdx}-${tIdx}`,
        playerIndex: pIdx,
        tokenIndex: tIdx,
        color,
        position: -1, // home base
      });
    }
  }

  return {
    boardType,
    teamMode,
    teams,
    players,
    tokens,
    activePlayerIndex: 0,
    diceValue: null,
    phase: 'waiting',
    consecutiveSixes: 0,
    history: [],
    winner: null,
    winningTeam: null,
    finishOrder: [],
    startedAt: Date.now(),
    turnStartedAt: Date.now(),
  };
}

/**
 * Calculates absolute track index from a player's relative track position (0..trackLength-1).
 */
export function getAbsoluteTrackIndex(
  playerIndex: number,
  relativePos: number,
  boardType: BoardPlayerCount
): number {
  const config = getBoardConfig(boardType);
  const sec = config.sectors[playerIndex];
  const startIdx = sec?.startTrackIdx ?? 0;
  return (startIdx + relativePos) % config.trackLength;
}

/**
 * Calculates all legal moves for the current turn.
 */
export function getPolygonalLegalMoves(state: PolygonalGameState): PolygonalMoveOption[] {
  if (state.diceValue === null || state.phase !== 'selecting' || state.winner !== null) {
    return [];
  }

  const { boardType, teamMode, activePlayerIndex, diceValue, tokens } = state;
  const config = getBoardConfig(boardType);
  const activeFinished = hasPlayerFinishedAllTokens(state, activePlayerIndex, config.winPosition);

  // Determine authorized tokens: own tokens, or partner's tokens if active player finished all their tokens
  let eligibleTokens: Token[] = [];
  if (activeFinished && teamMode !== 'individual') {
    // Partner assistance / roll sharing
    const teammates = getTeammateIndices(activePlayerIndex, teamMode, boardType);
    for (const tm of teammates) {
      const unfinished = tokens.filter(
        (t) => t.playerIndex === tm && t.position !== config.winPosition
      );
      if (unfinished.length > 0) {
        eligibleTokens = unfinished;
        break;
      }
    }
  } else {
    eligibleTokens = tokens.filter(
      (t) => t.playerIndex === activePlayerIndex && t.position !== config.winPosition
    );
  }

  const legalMoves: PolygonalMoveOption[] = [];

  for (const token of eligibleTokens) {
    // 1. Token in base (-1)
    if (token.position === -1) {
      if (diceValue === 6) {
        // Can exit to position 0
        const trackIdx = getAbsoluteTrackIndex(token.playerIndex, 0, boardType);
        // Check if an enemy blockade exists on start cell
        const isBlocked = isOpponentBlockadeAtTrack(
          tokens,
          trackIdx,
          token.playerIndex,
          teamMode,
          boardType,
          (pIdx, pos) => getAbsoluteTrackIndex(pIdx, pos, boardType)
        );

        if (!isBlocked) {
          // Check for captures on start cell
          const captures = tokens
            .filter((t) => {
              if (t.position < 0 || t.position >= config.trackLength) return false;
              if (isTeammate(token.playerIndex, t.playerIndex, teamMode, boardType)) return false;
              return getAbsoluteTrackIndex(t.playerIndex, t.position, boardType) === trackIdx;
            })
            .map((t) => t.id);

          legalMoves.push({
            tokenId: token.id,
            from: -1,
            to: 0,
            steps: 1,
            captures,
            reachesHome: false,
            exitsBase: true,
          });
        }
      }
      continue;
    }

    // 2. Token on track or runway
    const nextPos = token.position + diceValue;

    // Cannot overshoot central HOME
    if (nextPos > config.winPosition) {
      continue;
    }

    // Check intermediate steps for Enemy Blockades (Teammate Shield)
    let pathBlocked = false;
    for (let step = 1; step <= diceValue; step++) {
      const intermediatePos = token.position + step;
      if (intermediatePos >= 0 && intermediatePos < config.trackLength) {
        const intermediateTrackIdx = getAbsoluteTrackIndex(
          token.playerIndex,
          intermediatePos,
          boardType
        );
        if (
          isOpponentBlockadeAtTrack(
            tokens,
            intermediateTrackIdx,
            token.playerIndex,
            teamMode,
            boardType,
            (pIdx, pos) => getAbsoluteTrackIndex(pIdx, pos, boardType)
          )
        ) {
          pathBlocked = true;
          break;
        }
      }
    }

    if (pathBlocked) continue;

    // Check landing destination
    const reachesHome = nextPos === config.winPosition;
    let captures: string[] = [];

    if (nextPos >= 0 && nextPos < config.trackLength) {
      const destTrackIdx = getAbsoluteTrackIndex(token.playerIndex, nextPos, boardType);
      const isSafeCell = config.sectors.some((s) => s.safeTrackIdx === destTrackIdx);

      // Can only capture opponents on non-safe tiles (and teammates are never captured)
      if (!isSafeCell) {
        captures = tokens
          .filter((t) => {
            if (t.position < 0 || t.position >= config.trackLength) return false;
            if (isTeammate(token.playerIndex, t.playerIndex, teamMode, boardType)) return false;
            return getAbsoluteTrackIndex(t.playerIndex, t.position, boardType) === destTrackIdx;
          })
          .map((t) => t.id);
      }
    }

    legalMoves.push({
      tokenId: token.id,
      from: token.position,
      to: nextPos,
      steps: diceValue,
      captures,
      reachesHome,
      exitsBase: false,
    });
  }

  return legalMoves;
}

/**
 * Applies a move option and returns updated state.
 */
export function applyPolygonalMove(
  state: PolygonalGameState,
  move: PolygonalMoveOption
): PolygonalGameState {
  const { boardType, teamMode, tokens, activePlayerIndex, diceValue } = state;
  const config = getBoardConfig(boardType);

  // 1. Move target token and capture any opponent tokens
  const nextTokens = tokens.map((t) => {
    if (t.id === move.tokenId) {
      return { ...t, position: move.to };
    }
    if (move.captures.includes(t.id)) {
      return { ...t, position: -1 }; // Reset captured opponent to base
    }
    return t;
  });

  // 2. Check for victory
  const victoryCheck = checkTeamVictory(
    { ...state, tokens: nextTokens },
    teamMode,
    config.winPosition
  );

  if (victoryCheck.won) {
    return {
      ...state,
      tokens: nextTokens,
      phase: 'ended',
      winner: victoryCheck.winningTeam?.teamId ?? activePlayerIndex,
      winningTeam: victoryCheck.winningTeam,
    };
  }

  // 3. Determine if player gets an extra turn:
  //    - Rolled a 6 (and not forfeited via 3 sixes)
  //    - Captured an opponent token
  //    - Reached central HOME
  const earnedBonusTurn = diceValue === 6 || move.captures.length > 0 || move.reachesHome;

  if (earnedBonusTurn) {
    return {
      ...state,
      tokens: nextTokens,
      diceValue: null,
      phase: 'waiting',
    };
  }

  // 4. Advance turn to next active player
  let nextPlayerIdx = (activePlayerIndex + 1) % boardType;
  let attempts = 0;

  while (attempts < boardType) {
    // In individual mode, skip players who finished all 4 tokens
    if (teamMode === 'individual') {
      const isFinished = hasPlayerFinishedAllTokens(
        { ...state, tokens: nextTokens },
        nextPlayerIdx,
        config.winPosition
      );
      if (!isFinished) break;
    } else {
      // In team mode, player still plays if their team has unfinished tokens
      const teammates = getTeammateIndices(nextPlayerIdx, teamMode, boardType);
      const teamTokens = nextTokens.filter((t) =>
        [nextPlayerIdx, ...teammates].includes(t.playerIndex)
      );
      const teamHasUnfinished = teamTokens.some((t) => t.position !== config.winPosition);
      if (teamHasUnfinished) break;
    }

    nextPlayerIdx = (nextPlayerIdx + 1) % boardType;
    attempts++;
  }

  return {
    ...state,
    tokens: nextTokens,
    activePlayerIndex: nextPlayerIdx,
    diceValue: null,
    consecutiveSixes: 0,
    phase: 'waiting',
  };
}
