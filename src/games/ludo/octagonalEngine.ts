// src/games/ludo/octagonalEngine.ts
// Pure functional engine and state machine for 8-Player Octagonal Ludo.

import {
  OCTAGON_SECTORS,
  OCTAGON_TRACK_LENGTH,
  OCTAGON_WIN_POSITION,
  Point2D,
  getOctagonGeometry,
  getOctagonTokenPosition,
} from './octagonalBoard';

export interface OctagonPlayer {
  id: string;
  name: string;
  sectorIndex: number; // 0..7
  color: string;
  label: string;       // "01".."08"
  isBot: boolean;
  isHost: boolean;
}

export interface OctagonToken {
  id: string;          // `${playerIndex}-${tokenIndex}`
  playerIndex: number;
  tokenIndex: number;  // 0..3
  position: number;    // -1: base, 0..63: track, 64..68: runway, 69: won
  color: string;
}

export interface OctagonMoveOption {
  tokenId: string;
  from: number;
  to: number;
  captures: string[];
  reachesHome: boolean;
  exitsBase: boolean;
  steps: number;
}

export interface OctagonGameState {
  players: OctagonPlayer[];
  tokens: OctagonToken[];
  activePlayerIndex: number;
  diceValue: number | null;
  phase: 'waiting' | 'rolling' | 'selecting' | 'ended';
  consecutiveSixes: number;
  winner: number | null;
  finishOrder: number[];
  historyCount: number;
}

/**
 * Creates initial 8-player (or custom player count) game state.
 */
export function createOctagonInitialState(players: OctagonPlayer[]): OctagonGameState {
  const tokens: OctagonToken[] = [];
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

/**
 * Checks if a global track index (0..63) is safe from captures.
 */
export function isOctagonSafeTrackIndex(trackIdx: number): boolean {
  // Safe indices: every sector's Start (k*8) and Stop (k*8 + 4)
  const offset = trackIdx % 8;
  return offset === 0 || offset === 4;
}

/**
 * Returns a set of global track indices (0..63) where an opponent of playerIndex has formed a blockade.
 * A blockade is formed when 2 or more tokens belonging to the same player occupy the same main track cell.
 */
export function getOctagonEnemyBlockades(
  state: OctagonGameState,
  playerIndex: number
): Set<number> {
  const blockades = new Set<number>();
  const playerTrackCounts = new Map<number, Map<number, number>>();

  for (const token of state.tokens) {
    if (token.playerIndex === playerIndex) continue; // friendly token
    if (token.position < 0 || token.position >= OCTAGON_TRACK_LENGTH) continue; // shared track only

    const sec = OCTAGON_SECTORS[token.playerIndex];
    if (!sec) continue;
    const trackIdx = (sec.startTrackIdx + token.position) % OCTAGON_TRACK_LENGTH;

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

/**
 * Checks if a token can legally move with a dice value.
 * Optionally validates enemy blockades if state is provided.
 */
export function canOctagonTokenMove(
  token: OctagonToken,
  dice: number,
  state?: OctagonGameState
): boolean {
  if (token.position === OCTAGON_WIN_POSITION) return false;

  // In base: only a 6 unlocks
  if (token.position === -1) {
    if (dice !== 6) return false;
    if (state) {
      const enemyBlockades = getOctagonEnemyBlockades(state, token.playerIndex);
      const sec = OCTAGON_SECTORS[token.playerIndex];
      if (sec && enemyBlockades.has(sec.startTrackIdx)) {
        return false;
      }
    }
    return true;
  }

  // Exact roll required to reach WIN_POSITION (69)
  const target = token.position + dice;
  if (target > OCTAGON_WIN_POSITION) return false;

  // If state is provided, check intermediate steps and destination for enemy blockades
  if (state) {
    const enemyBlockades = getOctagonEnemyBlockades(state, token.playerIndex);
    if (enemyBlockades.size > 0) {
      const sec = OCTAGON_SECTORS[token.playerIndex];
      if (sec) {
        for (let s = token.position + 1; s <= target; s++) {
          if (s < OCTAGON_TRACK_LENGTH) {
            const sTrackIdx = (sec.startTrackIdx + s) % OCTAGON_TRACK_LENGTH;
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

/**
 * Computes move details for a token given a dice roll.
 */
export function computeOctagonMove(
  state: OctagonGameState,
  token: OctagonToken,
  dice: number
): OctagonMoveOption | null {
  if (!canOctagonTokenMove(token, dice, state)) return null;

  let to: number;
  let exitsBase = false;

  if (token.position === -1) {
    to = 0; // Exits to sector's Start cell
    exitsBase = true;
  } else {
    to = token.position + dice;
  }

  // Capture detection
  const captures: string[] = [];
  if (to >= 0 && to < OCTAGON_TRACK_LENGTH) {
    const sec = OCTAGON_SECTORS[token.playerIndex];
    const targetTrackIdx = (sec.startTrackIdx + to) % OCTAGON_TRACK_LENGTH;

    if (!isOctagonSafeTrackIndex(targetTrackIdx)) {
      for (const other of state.tokens) {
        if (other.playerIndex === token.playerIndex) continue;
        if (other.position < 0 || other.position >= OCTAGON_TRACK_LENGTH) continue;

        const otherSec = OCTAGON_SECTORS[other.playerIndex];
        const otherTrackIdx = (otherSec.startTrackIdx + other.position) % OCTAGON_TRACK_LENGTH;

        if (otherTrackIdx === targetTrackIdx) {
          captures.push(other.id);
        }
      }
    }
  }

  return {
    tokenId: token.id,
    from: token.position,
    to,
    captures,
    reachesHome: to === OCTAGON_WIN_POSITION,
    exitsBase,
    steps: dice,
  };
}

/**
 * Gets all legal moves for current active player.
 */
export function getOctagonLegalMoves(state: OctagonGameState): OctagonMoveOption[] {
  if (state.diceValue === null || state.phase !== 'selecting') return [];

  const moves: OctagonMoveOption[] = [];
  const currentTokens = state.tokens.filter((t) => t.playerIndex === state.activePlayerIndex);

  for (const token of currentTokens) {
    const move = computeOctagonMove(state, token, state.diceValue);
    if (move) moves.push(move);
  }

  return moves;
}

/**
 * Applies a token move and advances the game state.
 */
export function applyOctagonMove(state: OctagonGameState, tokenId: string): OctagonGameState {
  if (state.phase !== 'selecting' || state.diceValue === null) return state;

  const token = state.tokens.find((t) => t.id === tokenId);
  if (!token || token.playerIndex !== state.activePlayerIndex) return state;

  const move = computeOctagonMove(state, token, state.diceValue);
  if (!move) return state;

  // Move tokens
  const newTokens = state.tokens.map((t) => {
    if (t.id === move.tokenId) return { ...t, position: move.to };
    if (move.captures.includes(t.id)) return { ...t, position: -1 };
    return t;
  });

  // Check if active player won (all 4 tokens at 69)
  const playerTokens = newTokens.filter((t) => t.playerIndex === state.activePlayerIndex);
  const playerWon = playerTokens.every((t) => t.position === OCTAGON_WIN_POSITION);

  // Bonus extra roll on 6, capture, or home
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

  // Next player calculation
  let nextPlayer = state.activePlayerIndex;
  let nextSixes = state.consecutiveSixes;

  if (extraTurn) {
    nextPlayer = state.activePlayerIndex;
    nextSixes = state.diceValue === 6 ? state.consecutiveSixes : 0;
  } else {
    // Pass to next active player in roster
    const currentRosterIdx = state.players.findIndex((p) => p.sectorIndex === state.activePlayerIndex);
    const nextRosterIdx = (currentRosterIdx + 1) % state.players.length;
    nextPlayer = state.players[nextRosterIdx]?.sectorIndex ?? 0;
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

/**
 * Returns an array of 2D waypoints that the token will traverse for move animation and preview trail.
 */
export function getOctagonStepTrail(
  playerIndex: number,
  tokenIndex: number,
  from: number,
  to: number,
  geom: ReturnType<typeof getOctagonGeometry>
): Point2D[] {
  const points: Point2D[] = [];

  if (from === -1) {
    // Exiting base to Start cell (position 0)
    points.push(getOctagonTokenPosition(playerIndex, tokenIndex, -1, geom));
    points.push(getOctagonTokenPosition(playerIndex, tokenIndex, 0, geom));
    return points;
  }

  for (let p = from; p <= to; p++) {
    points.push(getOctagonTokenPosition(playerIndex, tokenIndex, p, geom));
  }

  return points;
}
