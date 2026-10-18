// src/games/ludo/engine.ts
// State machine for Ludo. Pure functions — every action returns a new state.

import {
  DiceValue,
  GamePhase,
  GameState,
  MoveOption,
  Player,
  Token,
  TurnRecord,
} from './types';
import {
  WIN_POSITION,
  isSafeTrackIndex,
  toTrackIndex,
} from './board';
import {
  computeMove,
  getLegalMoves,
  grantsExtraTurn,
  hasPlayerWon,
} from './rules';
import {
  TeamMode,
  getControllableTokensForTurn,
  checkTeamVictory,
  getPartnerIndex,
} from './teamRules';

export const TURN_DURATION_MS = 30_000; // 30 seconds per turn
export const DICE_ROLL_MS = 700;       // dice animation duration (snappy & responsive)

/**
 * Create a fresh game state.
 *
 * @param players   Array of players (must have unique index 0..3)
 */
export function createInitialState(players: Player[]): GameState {
  const tokens: Token[] = [];
  for (const p of players) {
    for (let i = 0; i < 4; i++) {
      tokens.push({
        id: `${p.index}-${i}`,
        playerIndex: p.index,
        color: p.color,
        tokenIndex: i,
        position: -1,
      });
    }
  }

  const startingPlayer = players[0]?.index ?? 0;

  return {
    players,
    tokens,
    activePlayerIndex: startingPlayer,
    diceValue: null,
    phase: 'waiting',
    consecutiveSixes: 0,
    history: [],
    winner: null,
    finishOrder: [],
    startedAt: Date.now(),
    turnStartedAt: Date.now(),
  };
}

/**
 * Transition phase to 'rolling'. UI should play dice animation now.
 * Does NOT set a dice value — that comes from resolveRoll().
 */
export function startRoll(state: GameState): GameState {
  if (state.phase !== 'waiting') return state;
  if (state.winner !== null) return state;
  return { ...state, phase: 'rolling' };
}

/**
 * Dice animation finished — apply the rolled value.
 *
 * Handles the "three consecutive sixes" rule:
 *   3rd six in a row → forfeit the turn (no move allowed).
 */
export function resolveRoll(state: GameState, value: DiceValue): GameState {
  if (state.phase !== 'rolling') return state;

  let sixes = state.consecutiveSixes;
  if (value === 6) sixes++;
  else sixes = 0;

  return {
    ...state,
    diceValue: value,
    consecutiveSixes: sixes,
    phase: 'selecting',
  };
}

/**
 * Should the current turn auto-pass (no legal move, or forfeited)?
 * UI should call this after resolveRoll and auto-pass with a short delay.
 */
export function shouldAutoPass(state: GameState, teamMode: TeamMode = 'individual'): boolean {
  if (state.phase !== 'selecting') return false;
  if (state.diceValue === null) return false;

  // Three consecutive sixes → forfeit
  if (state.consecutiveSixes === 3 && state.diceValue === 6) return true;

  // No legal moves with this dice value → pass
  return getLegalMoves(state, teamMode).length === 0;
}

/**
 * Apply a token move.
 * Supports Team / Jodi mode where a completed player can move partner's tokens.
 *
 * @param tokenId   Must be the id of a controllable token that has a legal move.
 * @param teamMode  'individual' or 'jodi_2v2'
 * @returns         New state, or the SAME state if the move is illegal.
 */
export function applyMove(
  state: GameState,
  tokenId: string,
  teamMode: TeamMode = 'individual'
): GameState {
  if (state.phase !== 'selecting') return state;
  const dice = state.diceValue;
  if (dice === null) return state;

  const token = state.tokens.find((t) => t.id === tokenId);
  if (!token) return state;

  // In individual mode: only own tokens. In team mode: own tokens or partner's if finished.
  const controllable = getControllableTokensForTurn(state, teamMode);
  if (!controllable.some((t) => t.id === tokenId)) return state;

  const move = computeMove(state, token, dice, teamMode);
  if (!move) return state;

  // -------- Apply to tokens (immutable) --------
  const newTokens: Token[] = state.tokens.map((t) => {
    if (t.id === move.tokenId) return { ...t, position: move.to };
    if (move.captures.includes(t.id)) return { ...t, position: -1 };
    return t;
  });

  const tempState: GameState = { ...state, tokens: newTokens };

  // -------- Check Victory Condition --------
  let matchEnded = false;
  let winner = state.winner;
  const finishOrder = [...state.finishOrder];

  if (teamMode !== 'individual') {
    const { won: teamWon, winningTeam } = checkTeamVictory(tempState, teamMode);
    if (teamWon) {
      matchEnded = true;
      winner = winningTeam?.teamId ?? state.activePlayerIndex;
    }
  } else {
    const playerWon = hasPlayerWon(tempState, state.activePlayerIndex);
    if (playerWon) {
      if (!finishOrder.includes(state.activePlayerIndex)) {
        finishOrder.push(state.activePlayerIndex);
      }
      winner = winner ?? finishOrder[0] ?? state.activePlayerIndex;
      matchEnded = true;
    }
  }

  // -------- Extra turn? --------
  const extra = !matchEnded && grantsExtraTurn(move, dice);

  // -------- Build turn record --------
  const record: TurnRecord = {
    playerIndex: state.activePlayerIndex,
    dice,
    move: {
      tokenId: move.tokenId,
      from: move.from,
      to: move.to,
      capturedTokenIds: [...move.captures],
      reachedHome: move.reachesHome,
      extraTurn: extra,
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  };

  // -------- Determine next player / phase --------
  let nextPlayer = state.activePlayerIndex;
  let nextSixes = state.consecutiveSixes;
  let nextPhase: GamePhase = 'waiting';

  if (matchEnded) {
    nextPhase = 'ended';
    nextSixes = 0;
  } else if (extra) {
    nextPlayer = state.activePlayerIndex;
    nextSixes = dice === 6 ? state.consecutiveSixes : 0;
  } else {
    nextPlayer = findNextActivePlayer(
      state.players,
      state.activePlayerIndex,
      finishOrder,
      teamMode,
      tempState
    );
    nextSixes = 0;
  }

  return {
    ...state,
    tokens: newTokens,
    activePlayerIndex: nextPlayer,
    diceValue: null,
    phase: nextPhase,
    consecutiveSixes: nextSixes,
    history: [...state.history, record],
    winner,
    finishOrder,
    turnStartedAt: Date.now(),
  };
}

/**
 * Explicitly pass the turn to the next player.
 * Called by UI after auto-pass delay, or by timer.
 */
export function passTurn(state: GameState, teamMode: TeamMode = 'individual'): GameState {
  if (state.winner !== null) {
    return { ...state, phase: 'ended' };
  }
  if (state.phase === 'ended') return state;

  const nextPlayer = findNextActivePlayer(
    state.players,
    state.activePlayerIndex,
    state.finishOrder,
    teamMode,
    state
  );

  return {
    ...state,
    activePlayerIndex: nextPlayer,
    diceValue: null,
    consecutiveSixes: 0,
    phase: 'waiting',
    turnStartedAt: Date.now(),
  };
}

/**
 * Timer tick — auto-pass if the current turn has exceeded the time limit.
 * Safe to call every second.
 * Supports both signatures:
 *   tickTimer(state, now)
 *   tickTimer(state, teamMode, now)
 */
export function tickTimer(
  state: GameState,
  teamModeOrNow?: TeamMode | number,
  maybeNow?: number
): GameState {
  let teamMode: TeamMode = 'individual';
  let now = Date.now();

  if (typeof teamModeOrNow === 'number') {
    now = teamModeOrNow;
  } else if (typeof teamModeOrNow === 'string') {
    teamMode = teamModeOrNow;
    if (typeof maybeNow === 'number') {
      now = maybeNow;
    }
  }

  if (state.winner !== null) return state;
  if (state.phase !== 'waiting' && state.phase !== 'selecting') return state;

  if (now - state.turnStartedAt > TURN_DURATION_MS) {
    return passTurn(state, teamMode);
  }
  return state;
}

/**
 * Force-reset to a waiting phase for the current player
 * (used after forfeit / no-move auto-pass without advancing player).
 */
export function resetTurnForCurrentPlayer(state: GameState): GameState {
  return {
    ...state,
    diceValue: null,
    phase: 'waiting',
    turnStartedAt: Date.now(),
  };
}

// -------------------- Helpers --------------------

function findNextActivePlayer(
  players: Player[],
  current: number,
  finished: number[],
  teamMode: TeamMode = 'individual',
  state?: GameState
): number {
  const n = players.length;
  if (n === 0) return current;

  const currentIdxInArray = players.findIndex((p) => p.index === current);
  let step = 1;
  let guard = 0;

  while (guard < n) {
    const nextArrayIdx = ((currentIdxInArray >= 0 ? currentIdxInArray : 0) + step) % n;
    const candidate = players[nextArrayIdx].index;

    if (teamMode === 'individual') {
      if (!finished.includes(candidate)) return candidate;
    } else if (state) {
      // In team mode, a player is only skipped if both they AND their partner are finished
      const controllable = getControllableTokensForTurn(
        { ...state, activePlayerIndex: candidate },
        teamMode
      );
      if (controllable.length > 0) return candidate;
    } else {
      if (!finished.includes(candidate)) return candidate;
    }
    step++;
    guard++;
  }

  return current;
}

// -------------------- Derived selectors --------------------

/**
 * Remaining seconds in the current turn.
 */
export function secondsLeft(state: GameState, now = Date.now()): number {
  const elapsed = now - state.turnStartedAt;
  const remain = TURN_DURATION_MS - elapsed;
  return Math.max(0, Math.floor(remain / 1000));
}

/**
 * All legal moves for the current player with the current dice value.
 */
export function currentLegalMoves(
  state: GameState,
  teamMode: TeamMode = 'individual'
): MoveOption[] {
  return getLegalMoves(state, teamMode);
}

/**
 * Convenience: is it the given player's turn?
 */
export function isPlayersTurn(state: GameState, playerIndex: number): boolean {
  return state.activePlayerIndex === playerIndex && state.phase !== 'ended';
}

/**
 * How many tokens does each player have finished?
 */
export function finishedCounts(state: GameState): number[] {
  return state.players.map(
    (p) =>
      state.tokens.filter(
        (t) => t.playerIndex === p.index && t.position === WIN_POSITION
      ).length
  );
}

/**
 * Debug-friendly snapshot (do not use for UI rendering).
 */
export function snapshot(state: GameState) {
  return {
    turn: state.players[state.activePlayerIndex]?.color ?? 'unknown',
    dice: state.diceValue,
    phase: state.phase,
    sixes: state.consecutiveSixes,
    winner: state.winner,
    tokens: state.tokens.map((t) => ({
      id: t.id,
      pos: t.position,
      safe:
        t.position >= 0 && t.position <= 50
          ? isSafeTrackIndex(
              toTrackIndex(t.playerIndex, t.position) ?? -1
            )
          : false,
    })),
  };
}
