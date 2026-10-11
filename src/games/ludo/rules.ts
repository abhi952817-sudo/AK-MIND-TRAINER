// src/games/ludo/rules.ts
// Pure rule evaluation. No state mutation, no side effects.

import {
  DiceValue,
  GameState,
  MoveOption,
  Token,
} from './types';
import {
  PLAYER_STARTS,
  TRACK_LENGTH,
  WIN_POSITION,
  isSafeTrackIndex,
  toTrackIndex,
} from './board';

/**
 * Returns a set of global track indices (0..51) where an opponent of playerIndex has formed a blockade.
 * A blockade is formed when 2 or more tokens belonging to the same player occupy the same main track cell.
 */
export function getEnemyBlockadeTrackIndices(
  state: GameState,
  playerIndex: number
): Set<number> {
  const blockades = new Set<number>();
  const playerTrackCounts = new Map<number, Map<number, number>>();

  for (const token of state.tokens) {
    if (token.playerIndex === playerIndex) continue; // friendly token, not enemy
    if (token.position < 0 || token.position > 50) continue; // must be on shared main track

    const trackIdx = toTrackIndex(token.playerIndex, token.position);
    if (trackIdx === null) continue;

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
 * Checks whether a specific global track index has a blockade formed by any player,
 * or by a specific player if playerIndex is provided.
 */
export function isBlockadeAtTrackIndex(
  tokens: readonly Token[],
  trackIndex: number,
  playerIndex?: number
): boolean {
  let count = 0;
  for (const t of tokens) {
    if (t.position < 0 || t.position > 50) continue;
    if (playerIndex !== undefined && t.playerIndex !== playerIndex) continue;
    const tIdx = toTrackIndex(t.playerIndex, t.position);
    if (tIdx === trackIndex) {
      count++;
      if (count >= 2) return true;
    }
  }
  return false;
}

/**
 * Can this token move with the given dice value?
 * Optionally verifies enemy blockades if state is provided.
 */
export function canTokenMove(
  token: Token,
  dice: DiceValue,
  state?: GameState
): boolean {
  // Already won — can't move
  if (token.position === WIN_POSITION) return false;

  // In base — only a 6 unlocks
  if (token.position === -1) {
    if (dice !== 6) return false;
    if (state) {
      const enemyBlockades = getEnemyBlockadeTrackIndices(state, token.playerIndex);
      const startTrackIdx = toTrackIndex(token.playerIndex, 0);
      if (startTrackIdx !== null && enemyBlockades.has(startTrackIdx)) {
        return false;
      }
    }
    return true;
  }

  // On track or home column — must not overshoot
  const target = token.position + dice;
  if (target > WIN_POSITION) return false;

  // If state is provided, check intermediate steps and destination for enemy blockades
  if (state) {
    const enemyBlockades = getEnemyBlockadeTrackIndices(state, token.playerIndex);
    if (enemyBlockades.size > 0) {
      for (let s = token.position + 1; s <= target; s++) {
        if (s <= 50) {
          const sTrackIdx = toTrackIndex(token.playerIndex, s);
          if (sTrackIdx !== null && enemyBlockades.has(sTrackIdx)) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

/**
 * All tokens belonging to the currently active player that can move.
 */
export function getMovableTokens(state: GameState): Token[] {
  if (state.diceValue === null) return [];
  return state.tokens.filter(
    (t) =>
      t.playerIndex === state.activePlayerIndex &&
      canTokenMove(t, state.diceValue as DiceValue, state)
  );
}

/**
 * Compute where a token would move and what would happen.
 * Returns null if the move is illegal.
 */
export function computeMove(
  state: GameState,
  token: Token,
  dice: DiceValue
): MoveOption | null {
  if (!canTokenMove(token, dice, state)) return null;

  const from = token.position;
  let to: number;
  let exitsBase = false;

  if (from === -1) {
    to = 0;
    exitsBase = true;
  } else {
    to = from + dice;
  }

  // -------- Capture detection --------
  const captures: string[] = [];

  if (to >= 0 && to <= 50) {
    // On main track — check for opponents on the same track index
    const myTrackIdx = toTrackIndex(token.playerIndex, to);
    if (myTrackIdx !== null && !isSafeTrackIndex(myTrackIdx)) {
      for (const other of state.tokens) {
        if (other.playerIndex === token.playerIndex) continue;
        if (other.position < 0 || other.position > 50) continue;

        const otherTrackIdx = toTrackIndex(other.playerIndex, other.position);
        if (otherTrackIdx === myTrackIdx) {
          captures.push(other.id);
        }
      }
    }
  }

  const reachesHome = to === WIN_POSITION;
  const entersHomeColumn = from <= 50 && to > 50;

  return {
    tokenId: token.id,
    from,
    to,
    captures,
    reachesHome,
    entersHomeColumn,
    exitsBase,
  };
}

export const calculateMove = computeMove;

/**
 * All legal moves for the active player with the current dice value.
 */
export function getLegalMoves(state: GameState): MoveOption[] {
  if (state.diceValue === null) return [];
  const dice = state.diceValue;
  const moves: MoveOption[] = [];
  for (const token of getMovableTokens(state)) {
    const move = computeMove(state, token, dice);
    if (move) moves.push(move);
  }
  return moves;
}

/**
 * Apply a move to the state. Returns new state (immutable).
 */
export function applyMove(state: GameState, move: MoveOption): GameState {
  const newTokens = state.tokens.map((t) => {
    if (t.id === move.tokenId) {
      return { ...t, position: move.to };
    }
    if (move.captures.includes(t.id)) {
      return { ...t, position: -1 }; // send home
    }
    return t;
  });

  return {
    ...state,
    tokens: newTokens,
  };
}

/**
 * Does the given move grant an extra turn to the player?
 * Rules:
 *  - Rolled a 6
 *  - Captured any opponent token
 *  - Reached the center (finished a token)
 */
export function grantsExtraTurn(
  move: MoveOption,
  dice: DiceValue
): boolean {
  if (dice === 6) return true;
  if (move.captures.length > 0) return true;
  if (move.reachesHome) return true;
  return false;
}

/**
 * Does the given player have all 4 tokens at WIN_POSITION?
 */
export function hasPlayerWon(state: GameState, playerIndex: number): boolean {
  const playerTokens = state.tokens.filter((t) => t.playerIndex === playerIndex);
  if (playerTokens.length !== 4) return false;
  return playerTokens.every((t) => t.position === WIN_POSITION);
}

/**
 * Return player indices (in finish order) that have won.
 */
export function getFinishedPlayers(state: GameState): number[] {
  return state.players
    .map((p) => p.index)
    .filter((idx) => hasPlayerWon(state, idx));
}

/**
 * Total tokens currently in a player's base.
 */
export function tokensInBase(state: GameState, playerIndex: number): number {
  return state.tokens.filter(
    (t) => t.playerIndex === playerIndex && t.position === -1
  ).length;
}

/**
 * Total tokens currently on the main track (including home column).
 */
export function tokensOnTrack(state: GameState, playerIndex: number): number {
  return state.tokens.filter(
    (t) =>
      t.playerIndex === playerIndex &&
      t.position >= 0 &&
      t.position <= 56
  ).length;
}

/**
 * Total tokens that have finished for the given player.
 */
export function tokensFinished(state: GameState, playerIndex: number): number {
  return state.tokens.filter(
    (t) => t.playerIndex === playerIndex && t.position === WIN_POSITION
  ).length;
}
