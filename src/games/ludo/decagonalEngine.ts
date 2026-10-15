// src/games/ludo/decagonalEngine.ts
// Pure functional engine and state machine for 10-Player Decagonal Ludo.

import {
  DECAGON_SECTORS,
  DECAGON_TRACK_LENGTH,
  DECAGON_WIN_POSITION,
  getDecagonGeometry,
  getDecagonTokenPosition,
} from './decagonalBoard';
import { Point2D } from './octagonalBoard';

export interface DecagonPlayer {
  id: string;
  name: string;
  sectorIndex: number; // 0..9
  color: string;
  label: string;       // "01".."10"
  isBot: boolean;
  isHost: boolean;
}

export interface DecagonToken {
  id: string;          // `${playerIndex}-${tokenIndex}`
  playerIndex: number;
  tokenIndex: number;  // 0..3
  position: number;    // -1: base, 0..79: track, 80..84: runway, 85: won
  color: string;
}

export interface DecagonMoveOption {
  tokenId: string;
  from: number;
  to: number;
  captures: string[];
  reachesHome: boolean;
  exitsBase: boolean;
  steps: number;
}

export interface DecagonGameState {
  players: DecagonPlayer[];
  tokens: DecagonToken[];
  activePlayerIndex: number;
  diceValue: number | null;
  phase: 'waiting' | 'rolling' | 'selecting' | 'ended';
  consecutiveSixes: number;
  winner: number | null;
  finishOrder: number[];
  historyCount: number;
}

export function createDecagonInitialState(players: DecagonPlayer[]): DecagonGameState {
  const tokens: DecagonToken[] = [];
  for (const p of players) {
    for (let t = 0; t < 4; t++) {
      tokens.push({
        id: `${p.sectorIndex}-${t}`,
        playerIndex: p.sectorIndex,
        tokenIndex: t,
        position: -1,
        color: p.color,
      });
    }
  }

  return {
    players,
    tokens,
    activePlayerIndex: players[0]?.sectorIndex ?? 0,
    diceValue: null,
    phase: 'waiting',
    consecutiveSixes: 0,
    winner: null,
    finishOrder: [],
    historyCount: 0,
  };
}

export function isDecagonSafeTrackIndex(trackIdx: number): boolean {
  const offset = trackIdx % 8;
  return offset === 0 || offset === 4;
}

/**
 * Returns global track indices (0..79) where an opponent of playerIndex has formed a blockade.
 * A blockade is formed when 2 or more tokens of the same opponent occupy the same cell.
 */
export function getDecagonEnemyBlockades(
  state: DecagonGameState,
  playerIndex: number
): Set<number> {
  const blockades = new Set<number>();
  const playerTrackCounts = new Map<number, Map<number, number>>();

  for (const token of state.tokens) {
    if (token.playerIndex === playerIndex) continue;
    if (token.position < 0 || token.position >= DECAGON_TRACK_LENGTH) continue;

    const sec = DECAGON_SECTORS[token.playerIndex];
    if (!sec) continue;
    const trackIdx = (sec.startTrackIdx + token.position) % DECAGON_TRACK_LENGTH;

    let trackMap = playerTrackCounts.get(token.playerIndex);
    if (!trackMap) {
      trackMap = new Map<number, number>();
      playerTrackCounts.set(token.playerIndex, trackMap);
    }

    const currentCount = (trackMap.get(trackIdx) ?? 0) + 1;
    trackMap.set(trackIdx, currentCount);
    if (currentCount >= 2) {
      blockades.add(trackIdx);
    }
  }

  return blockades;
}

export function canDecagonTokenMove(
  token: DecagonToken,
  dice: number,
  state?: DecagonGameState
): boolean {
  if (token.position === DECAGON_WIN_POSITION) return false;

  // In base: only a 6 unlocks
  if (token.position === -1) {
    if (dice !== 6) return false;
    if (state) {
      const enemyBlockades = getDecagonEnemyBlockades(state, token.playerIndex);
      const sec = DECAGON_SECTORS[token.playerIndex];
      if (sec && enemyBlockades.has(sec.startTrackIdx)) {
        return false;
      }
    }
    return true;
  }

  const target = token.position + dice;
  if (target > DECAGON_WIN_POSITION) return false;

  // Check intermediate steps and landing spot for enemy blockades
  if (state) {
    const enemyBlockades = getDecagonEnemyBlockades(state, token.playerIndex);
    if (enemyBlockades.size > 0) {
      const sec = DECAGON_SECTORS[token.playerIndex];
      if (sec) {
        for (let s = token.position + 1; s <= target; s++) {
          if (s < DECAGON_TRACK_LENGTH) {
            const sTrackIdx = (sec.startTrackIdx + s) % DECAGON_TRACK_LENGTH;
            if (enemyBlockades.has(sTrackIdx)) {
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}

export function computeDecagonMove(
  state: DecagonGameState,
  token: DecagonToken,
  dice: number
): DecagonMoveOption | null {
  if (!canDecagonTokenMove(token, dice, state)) return null;

  let to: number;
  let exitsBase = false;

  if (token.position === -1) {
    to = 0;
    exitsBase = true;
  } else {
    to = token.position + dice;
  }

  const captures: string[] = [];
  if (to >= 0 && to < DECAGON_TRACK_LENGTH) {
    const sec = DECAGON_SECTORS[token.playerIndex];
    if (sec) {
      const targetTrackIdx = (sec.startTrackIdx + to) % DECAGON_TRACK_LENGTH;
      if (!isDecagonSafeTrackIndex(targetTrackIdx)) {
        for (const other of state.tokens) {
          if (other.playerIndex === token.playerIndex) continue;
          if (other.position < 0 || other.position >= DECAGON_TRACK_LENGTH) continue;

          const otherSec = DECAGON_SECTORS[other.playerIndex];
          if (!otherSec) continue;
          const otherTrackIdx = (otherSec.startTrackIdx + other.position) % DECAGON_TRACK_LENGTH;

          if (otherTrackIdx === targetTrackIdx) {
            captures.push(other.id);
          }
        }
      }
    }
  }

  return {
    tokenId: token.id,
    from: token.position,
    to,
    captures,
    reachesHome: to === DECAGON_WIN_POSITION,
    exitsBase,
    steps: dice,
  };
}

export function getDecagonLegalMoves(state: DecagonGameState): DecagonMoveOption[] {
  if (state.diceValue === null || state.phase !== 'selecting') return [];

  // Consecutive three sixes penalty: zero legal moves allowed
  if (state.consecutiveSixes >= 3 && state.diceValue === 6) {
    return [];
  }

  const moves: DecagonMoveOption[] = [];
  const currentTokens = state.tokens.filter((t) => t.playerIndex === state.activePlayerIndex);

  for (const token of currentTokens) {
    const move = computeDecagonMove(state, token, state.diceValue);
    if (move) moves.push(move);
  }

  return moves;
}

export function findNextActiveDecagonPlayer(
  players: DecagonPlayer[],
  currentSectorIdx: number,
  finishOrder: number[]
): number {
  const n = players.length;
  if (n === 0) return currentSectorIdx;

  const currentIdx = players.findIndex((p) => p.sectorIndex === currentSectorIdx);
  let nextIdx = (currentIdx + 1) % n;
  let guard = 0;

  while (guard < n) {
    const sector = players[nextIdx]?.sectorIndex;
    if (sector !== undefined && !finishOrder.includes(sector)) {
      return sector;
    }
    nextIdx = (nextIdx + 1) % n;
    guard++;
  }

  return currentSectorIdx;
}

export function applyDecagonMove(state: DecagonGameState, tokenId: string): DecagonGameState {
  if (state.phase !== 'selecting' || state.diceValue === null) return state;

  const token = state.tokens.find((t) => t.id === tokenId);
  if (!token || token.playerIndex !== state.activePlayerIndex) return state;

  const move = computeDecagonMove(state, token, state.diceValue);
  if (!move) return state;

  const newTokens = state.tokens.map((t) => {
    if (t.id === move.tokenId) return { ...t, position: move.to };
    if (move.captures.includes(t.id)) return { ...t, position: -1 };
    return t;
  });

  const playerTokens = newTokens.filter((t) => t.playerIndex === state.activePlayerIndex);
  const playerWon = playerTokens.every((t) => t.position === DECAGON_WIN_POSITION);

  const extraTurn =
    !playerWon &&
    (state.diceValue === 6 || move.captures.length > 0 || move.reachesHome);

  let nextPhase: 'waiting' | 'ended' = 'waiting';
  let winner = state.winner;
  const finishOrder = [...state.finishOrder];

  if (playerWon) {
    if (!finishOrder.includes(state.activePlayerIndex)) {
      finishOrder.push(state.activePlayerIndex);
    }
    winner = winner ?? state.activePlayerIndex;
    nextPhase = 'ended';
  }

  let nextPlayer = state.activePlayerIndex;
  let nextSixes = state.consecutiveSixes;

  if (extraTurn) {
    nextPlayer = state.activePlayerIndex;
    nextSixes = state.diceValue === 6 ? state.consecutiveSixes : 0;
  } else {
    nextPlayer = findNextActiveDecagonPlayer(state.players, state.activePlayerIndex, finishOrder);
    nextSixes = 0;
  }

  return {
    ...state,
    tokens: newTokens,
    activePlayerIndex: nextPlayer,
    diceValue: null,
    phase: nextPhase,
    consecutiveSixes: nextSixes,
    winner,
    finishOrder,
    historyCount: state.historyCount + 1,
  };
}

export function getDecagonStepTrail(
  playerIndex: number,
  tokenIndex: number,
  from: number,
  to: number,
  geom: ReturnType<typeof getDecagonGeometry>
): Point2D[] {
  const points: Point2D[] = [];
  if (from === -1) {
    points.push(getDecagonTokenPosition(playerIndex, tokenIndex, -1, geom));
    points.push(getDecagonTokenPosition(playerIndex, tokenIndex, 0, geom));
    return points;
  }
  for (let p = from; p <= to; p++) {
    points.push(getDecagonTokenPosition(playerIndex, tokenIndex, p, geom));
  }
  return points;
}
