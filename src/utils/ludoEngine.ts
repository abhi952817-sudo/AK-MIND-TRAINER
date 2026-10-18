/**
 * ARCHITECTURAL NOTICE - LEGACY UTILITY
 * -------------------------------------
 * Active production Ludo gameplay uses `src/games/ludo/engine.ts`, `rules.ts`, and `board.ts`.
 * This file is maintained as a legacy utility for existing baseline regression tests.
 * Do not route active GameScreen logic here.
 */

import {
  PlayerColor,
  Token,
  Player,
  GameRoom,
  Coordinates,
  MoveExecutionResult,
  DiceRollResult,
} from '../types/ludo';

/**
 * Standard 52-tile outer track coordinates (15x15 board matrix, 0-indexed).
 * Begins at Red start square (6, 1) and runs clockwise.
 */
export const TRACK_COORDINATES: Coordinates[] = [
  // Red track segment (row, col) - indices 0..12
  { row: 6, col: 1 },  // 0  - Red Start (Safe)
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4
  { row: 5, col: 6 },  // 5
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8  - Star Safe Cell
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10
  { row: 0, col: 7 },  // 11
  { row: 0, col: 8 },  // 12

  // Green track segment - indices 13..25
  { row: 1, col: 8 },  // 13 - Green Start (Safe)
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17
  { row: 6, col: 9 },  // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21 - Star Safe Cell
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24
  { row: 8, col: 14 }, // 25

  // Yellow track segment - indices 26..38
  { row: 8, col: 13 }, // 26 - Yellow Start (Safe)
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30
  { row: 9, col: 8 },  // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34 - Star Safe Cell
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37
  { row: 14, col: 6 }, // 38

  // Blue track segment - indices 39..51
  { row: 13, col: 6 }, // 39 - Blue Start (Safe)
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43
  { row: 8, col: 5 },  // 44
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47 - Star Safe Cell
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49
  { row: 7, col: 0 },  // 50
  { row: 6, col: 0 },  // 51
];

/**
 * 6-step private colored home stretch columns leading directly into the center goal.
 * Steps 51, 52, 53, 54, 55 (stretch tiles 0..4), and step 56 (center goal crown, index 5).
 */
export const HOME_COLUMNS: Record<PlayerColor, Coordinates[]> = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 }, // Home Goal (Step 56)
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
    { row: 6, col: 7 }, // Home Goal (Step 56)
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
    { row: 7, col: 8 }, // Home Goal (Step 56)
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
    { row: 8, col: 7 }, // Home Goal (Step 56)
  ],
};

/**
 * Base yard pocket coordinates for initial tokens when step === -1.
 */
export const BASE_POSITIONS: Record<PlayerColor, Coordinates[]> = {
  red: [
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ],
  green: [
    { row: 2, col: 11 },
    { row: 2, col: 12 },
    { row: 3, col: 11 },
    { row: 3, col: 12 },
  ],
  yellow: [
    { row: 11, col: 11 },
    { row: 11, col: 12 },
    { row: 12, col: 11 },
    { row: 12, col: 12 },
  ],
  blue: [
    { row: 11, col: 2 },
    { row: 11, col: 3 },
    { row: 12, col: 2 },
    { row: 12, col: 3 },
  ],
};

/**
 * Starting track indices on the 52-tile board for each player color.
 */
export const COLOR_START_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/**
 * Standard 8 Safe Cells on the track:
 * 4 starting cells (0, 13, 26, 39) + 4 star safe cells (8, 21, 34, 47).
 * Any token standing on these indices is strictly protected from capture.
 */
export const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Standard turn countdown limit across the entire game engine.
 */
export const TURN_TIME_LIMIT_SECONDS = 25;

/**
 * Calculates global track index (0..51) for a player's step (0..50).
 * Returns null if the step is outside the outer track (i.e. -1 in base or >= 51 in home stretch).
 */
export function getGlobalTrackIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  return (COLOR_START_INDEX[color] + step) % 52;
}

/**
 * Resolves exact (row, col) grid coordinates for rendering any token on the 15x15 board.
 */
export function getTokenCoordinates(color: PlayerColor, tokenId: number, step: number): Coordinates {
  if (step === -1) {
    return BASE_POSITIONS[color][tokenId];
  }
  if (step <= 50) {
    const globalIdx = getGlobalTrackIndex(color, step)!;
    return TRACK_COORDINATES[globalIdx];
  }
  // Home stretch steps 51..56 (index 0..5 in HOME_COLUMNS)
  const homeIdx = Math.min(Math.max(0, step - 51), 5);
  return HOME_COLUMNS[color][homeIdx];
}

/**
 * Checks if a token position is safe from opponent captures.
 * - Color starting square (step 0) is safe.
 * - All star cells on the track are safe.
 * - Entire home stretch (steps 51..56) is safe.
 */
export function isSafePosition(color: PlayerColor, step: number): boolean {
  if (step === 0) return true; // Starting square is safe
  if (step >= 51) return true; // Home stretch & goal are completely safe
  const globalIdx = getGlobalTrackIndex(color, step);
  return globalIdx !== null && SAFE_TRACK_INDICES.includes(globalIdx);
}

/**
 * Core Rule 1: Can this token move given the dice value?
 * - Finished tokens (step 56) can never move.
 * - Tokens in yard (step -1) can ONLY move if diceValue is 6.
 * - Tokens on track / stretch can only move if step + diceValue <= 56 (Exact finish rule).
 * - Rejects any overshoot beyond step 56.
 */
export function canTokenMove(token: Token, diceValue: number): boolean {
  if (token.isFinished) return false;
  if (token.step >= 56) return false;
  if (diceValue < 1 || diceValue > 6) return false;

  if (token.step === -1) {
    return diceValue === 6;
  }
  return token.step + diceValue <= 56;
}

/**
 * Core Rule 2: Returns all legal movable tokens for the player.
 */
export function getMovableTokens(player: Player, diceValue: number): Token[] {
  return player.tokens.filter(t => canTokenMove(t, diceValue));
}

/**
 * Core Rule 3: Calculates destination without mutating state.
 */
export function calculateDestination(
  token: Token,
  diceValue: number
): { nextStep: number; reachedHome: boolean; isSafe: boolean } | null {
  if (!canTokenMove(token, diceValue)) return null;

  const nextStep = token.step === -1 ? 0 : token.step + diceValue;
  return {
    nextStep,
    reachedHome: nextStep === 56,
    isSafe: isSafePosition(token.color, nextStep),
  };
}

/**
 * Core Rule 4: Authoritative dice roll processing & 3-consecutive-sixes enforcement.
 * - Validates room status and active player.
 * - Tracks consecutive sixes.
 * - If 3 consecutive sixes occur (6-6-6), the 3rd roll is forfeited, turn immediately passes.
 * - Calculates legal movable tokens.
 */
export function processDiceRoll(room: GameRoom, roll: number): DiceRollResult {
  if (room.status !== 'playing' || roll < 1 || roll > 6) {
    return {
      updatedRoom: room,
      diceValue: roll,
      movableTokens: [],
      isThreeSixesPenalty: false,
      hasLegalMoves: false,
    };
  }

  const activePlayer = room.players.find(p => p.color === room.currentTurnColor);
  if (!activePlayer) {
    return {
      updatedRoom: room,
      diceValue: roll,
      movableTokens: [],
      isThreeSixesPenalty: false,
      hasLegalMoves: false,
    };
  }

  const isSix = roll === 6;
  const newConsecutiveSixes = isSix ? room.consecutiveSixes + 1 : 0;

  // RULE: 3 consecutive sixes forfeits the roll and passes the turn immediately!
  if (newConsecutiveSixes === 3) {
    const nextColor = getNextPlayerColor(room.players, room.currentTurnColor);
    return {
      updatedRoom: {
        ...room,
        diceValue: roll,
        hasRolledDice: false,
        consecutiveSixes: 0,
        currentTurnColor: nextColor,
        turnTimeRemaining: TURN_TIME_LIMIT_SECONDS,
        phase: 'PLAYER_TURN',
        turnIndex: (room.turnIndex || 0) + 1,
      },
      diceValue: roll,
      movableTokens: [],
      isThreeSixesPenalty: true,
      hasLegalMoves: false,
    };
  }

  const movableTokens = getMovableTokens(activePlayer, roll);
  const hasLegalMoves = movableTokens.length > 0;

  return {
    updatedRoom: {
      ...room,
      diceValue: roll,
      hasRolledDice: true,
      consecutiveSixes: newConsecutiveSixes,
      phase: 'MOVE_SELECTION',
    },
    diceValue: roll,
    movableTokens,
    isThreeSixesPenalty: false,
    hasLegalMoves,
  };
}

/**
 * Core Rule 5: Executes a validated move on the room state.
 * - Rejects invalid room status, unrolled dice, wrong player, or illegal moves.
 * - Handles token exit from base to step 0.
 * - Handles track traversal & home stretch entry.
 * - Handles collisions & captures on non-safe track squares.
 * - Grants bonus turn on: Roll 6, Capture, or Reaching Home Goal (56).
 * - Detects game victory when all 4 tokens of active player reach home.
 * - Advances turn clockwise to next active player if no bonus turn is earned.
 */
export function executeMove(
  room: GameRoom,
  tokenId: number
): MoveExecutionResult {
  if (room.status !== 'playing') {
    return {
      updatedRoom: room,
      captured: false,
      capturedTokens: [],
      reachedHome: false,
      bonusTurn: false,
      success: false,
      reason: 'Game is not playing',
    };
  }

  if (!room.hasRolledDice) {
    return {
      updatedRoom: room,
      captured: false,
      capturedTokens: [],
      reachedHome: false,
      bonusTurn: false,
      success: false,
      reason: 'Dice has not been rolled for this turn',
    };
  }

  const activePlayer = room.players.find(p => p.color === room.currentTurnColor);
  if (!activePlayer) {
    return {
      updatedRoom: room,
      captured: false,
      capturedTokens: [],
      reachedHome: false,
      bonusTurn: false,
      success: false,
      reason: 'Active player not found',
    };
  }

  const token = activePlayer.tokens.find(t => t.id === tokenId);
  if (!token) {
    return {
      updatedRoom: room,
      captured: false,
      capturedTokens: [],
      reachedHome: false,
      bonusTurn: false,
      success: false,
      reason: 'Token does not belong to active player',
    };
  }

  if (!canTokenMove(token, room.diceValue)) {
    return {
      updatedRoom: room,
      captured: false,
      capturedTokens: [],
      reachedHome: false,
      bonusTurn: false,
      success: false,
      reason: 'Token cannot legally move with current dice value',
    };
  }

  const dice = room.diceValue;
  const nextStep = token.step === -1 ? 0 : token.step + dice;
  const reachedHome = nextStep === 56;
  const isSafe = isSafePosition(activePlayer.color, nextStep);

  let captured = false;
  const capturedTokens: Array<{ playerId: string; color: PlayerColor; tokenId: number }> = [];
  const targetGlobal = getGlobalTrackIndex(activePlayer.color, nextStep);

  const updatedPlayers = room.players.map(p => {
    if (p.color === activePlayer.color) {
      const updatedTokens = p.tokens.map(t => {
        if (t.id === tokenId) {
          return {
            ...t,
            step: nextStep,
            isSafe: isSafe,
            isFinished: reachedHome,
          };
        }
        return t;
      });
      return { ...p, tokens: updatedTokens };
    } else {
      // Opponent collision check: only on unsafe track cells (steps 0..50)
      if (!isSafe && targetGlobal !== null) {
        const updatedTokens = p.tokens.map(t => {
          if (t.step >= 0 && t.step <= 50) {
            const oppGlobal = getGlobalTrackIndex(p.color, t.step);
            if (oppGlobal === targetGlobal) {
              captured = true;
              capturedTokens.push({ playerId: p.id, color: p.color, tokenId: t.id });
              return { ...t, step: -1, isSafe: true }; // sent back to yard
            }
          }
          return t;
        });
        return { ...p, tokens: updatedTokens };
      }
      return p;
    }
  });

  const updatedActivePlayer = updatedPlayers.find(p => p.color === activePlayer.color)!;
  const hasWon = updatedActivePlayer.tokens.every(t => t.isFinished);

  // Bonus turn awarded on 6, capture, or home goal (unless player has won)
  const bonusTurn = (dice === 6 || captured || reachedHome) && !hasWon;
  const nextTurnColor = bonusTurn
    ? room.currentTurnColor
    : getNextPlayerColor(room.players, room.currentTurnColor);

  return {
    updatedRoom: {
      ...room,
      status: hasWon ? 'finished' : 'playing',
      phase: hasWon ? 'GAME_OVER' : 'PLAYER_TURN',
      turnIndex: (room.turnIndex || 0) + 1,
      winnerId: hasWon ? activePlayer.id : null,
      players: updatedPlayers,
      currentTurnColor: nextTurnColor,
      hasRolledDice: false,
      turnTimeRemaining: TURN_TIME_LIMIT_SECONDS,
      // If bonus was due to capture/home goal and not 6, reset consecutive sixes counter
      consecutiveSixes: dice === 6 ? room.consecutiveSixes : 0,
    },
    captured,
    capturedTokens,
    reachedHome,
    bonusTurn,
    success: true,
  };
}

/**
 * Clockwise turn rotation order: Red -> Green -> Yellow -> Blue.
 * Automatically skips inactive players or players who have already won/finished all 4 tokens.
 */
export function getNextPlayerColor(players: Player[], current: PlayerColor): PlayerColor {
  const order: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  const curIdx = order.indexOf(current);

  for (let i = 1; i <= 4; i++) {
    const next = order[(curIdx + i) % 4];
    const candidate = players.find(p => p.color === next);
    if (candidate && !candidate.tokens.every(t => t.isFinished)) {
      return next;
    }
  }
  return current;
}

/**
 * Bot Decision Engine:
 * Selects the best move among legal tokens based on standard Ludo heuristics:
 * 1. Release token from yard on 6.
 * 2. Finish token into home goal (step 56).
 * 3. Advance furthest token along the board.
 */
export function chooseBotMove(movableTokens: Token[], diceValue: number): Token | null {
  if (movableTokens.length === 0) return null;

  // 1. Priority: release from base on 6
  const baseToken = movableTokens.find(t => t.step === -1 && diceValue === 6);
  if (baseToken) return baseToken;

  // 2. Priority: reach home goal
  const finishToken = movableTokens.find(t => t.step + diceValue === 56);
  if (finishToken) return finishToken;

  // 3. Priority: move furthest along track/home stretch
  return [...movableTokens].sort((a, b) => b.step - a.step)[0];
}

/**
 * Pure deterministic path generator for token movement.
 * Returns an ordered array of intermediate step numbers from fromStep to toStep.
 * - Yard release (-1 -> 0): returns [0]
 * - Standard multi-step: returns [fromStep + 1, ..., toStep]
 * - Invalid/overshoot moves: returns []
 */
export function getPathSteps(color: PlayerColor, fromStep: number, toStep: number): number[] {
  // Yard release strictly goes to step 0
  if (fromStep === -1) {
    return toStep === 0 ? [0] : [];
  }
  // Invalid or backward step
  if (fromStep < 0 || toStep <= fromStep || toStep > 56) {
    return [];
  }
  const steps: number[] = [];
  for (let s = fromStep + 1; s <= toStep; s++) {
    steps.push(s);
  }
  return steps;
}

/**
 * Deterministically passes the turn to the next player.
 * Resets dice status, consecutive sixes, and grants a full turn timer.
 */
export function passTurn(room: GameRoom): GameRoom {
  const nextColor = getNextPlayerColor(room.players, room.currentTurnColor);
  return {
    ...room,
    currentTurnColor: nextColor,
    hasRolledDice: false,
    turnTimeRemaining: TURN_TIME_LIMIT_SECONDS,
    consecutiveSixes: 0,
    phase: 'PLAYER_TURN',
    turnIndex: (room.turnIndex || 0) + 1,
  };
}

/**
 * Player setup configuration modes for local same-device and bot play.
 * Mode A (1H3B): 1 Human (Host) + 3 Bots (AI)
 * Mode B (2H2B): 2 Humans (Local Pass & Play) + 2 Bots (AI)
 * Mode C (3H1B): 3 Humans (Local Pass & Play) + 1 Bot (AI)
 * Mode D (4H0B): 4 Humans (Local Pass & Play, 0 Bots)
 */
export type PlayerSetupMode = '1H3B' | '2H2B' | '3H1B' | '4H0B';

export const BOT_CONFIGS: Array<{ name: string; avatar: string }> = [
  { name: 'Priya', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' },
  { name: 'Rohit', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
  { name: 'Anam', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120' },
];

/**
 * Pure deterministic factory for match players based on human vs bot configuration.
 */
export function createMatchPlayers(
  hostAvatar: string = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  mode: PlayerSetupMode = '1H3B',
  customHostName: string = 'Abhishek',
  maxPlayers: number = 4
): Player[] {
  const allColors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
  const colors = allColors.slice(0, maxPlayers);

  // Exact boolean flags indicating whether each slot (0..3) is a bot
  const botMap: Record<PlayerSetupMode, boolean[]> = {
    '1H3B': [false, true, true, true],
    '2H2B': [false, false, true, true],
    '3H1B': [false, false, false, true],
    '4H0B': [false, false, false, false],
  };

  const botFlags = botMap[mode] || botMap['1H3B'];

  return colors.map((color, idx) => {
    const isHost = idx === 0;
    const isBot = isHost ? false : Boolean(botFlags[idx]);

    const name = isHost
      ? customHostName
      : isBot
      ? BOT_CONFIGS[(idx - 1) % BOT_CONFIGS.length].name
      : `Player ${idx + 1}`;

    const avatar = isHost
      ? hostAvatar
      : isBot
      ? BOT_CONFIGS[(idx - 1) % BOT_CONFIGS.length].avatar
      : `https://images.unsplash.com/photo-${1534528741775 + idx * 1000}?w=120`;

    return {
      id: isHost ? 'user_1' : isBot ? `bot_${idx}` : `human_${idx + 1}`,
      name,
      avatar,
      color,
      isHost,
      isReady: true,
      isOnline: true,
      isBot,
      tokens: [
        { id: 0, color, step: -1, isSafe: true, isFinished: false },
        { id: 1, color, step: -1, isSafe: true, isFinished: false },
        { id: 2, color, step: -1, isSafe: true, isFinished: false },
        { id: 3, color, step: -1, isSafe: true, isFinished: false },
      ],
    };
  });
}

/**
 * Responsive board dimensions and stage boundary calculation.
 * Ensures the board plinth maximizes available space without vertical or horizontal overflow.
 */
export interface BoardDimensions {
  plinthSize: number;
  stagePadding: number;
  totalStageWidth: number;
  totalStageHeight: number;
  hasHorizontalOverflow: boolean;
  hasVerticalOverflow: boolean;
}

export function calculateBoardDimensions(
  viewportWidth: number,
  viewportHeight: number = 800
): BoardDimensions {
  const isSm = viewportWidth >= 640;
  const isMd = viewportWidth >= 768;

  let maxPlinthWidth: number;
  let stagePadding: number;

  if (isMd) {
    maxPlinthWidth = 540;
    stagePadding = 24;
  } else if (isSm) {
    maxPlinthWidth = 500;
    stagePadding = 24;
  } else {
    // Mobile (<640px): max practical space, up to 410px
    maxPlinthWidth = Math.min(410, Math.max(0, viewportWidth - 16));
    stagePadding = 12;
  }

  // Streamlined UI overhead is ~216px (top bar 38px, top pods 46px, bottom pods 46px, turn bar 34px, chat 38px, margins 14px)
  const UI_OVERHEAD = 216;
  const maxAvailableHeight = Math.max(180, viewportHeight - UI_OVERHEAD - stagePadding);

  // Board is square, bounded by width, height, and maximum practical display size
  const plinthSize = Math.min(maxPlinthWidth, maxAvailableHeight);

  const totalStageWidth = plinthSize + stagePadding;
  const totalStageHeight = plinthSize + stagePadding;
  const hasHorizontalOverflow = totalStageWidth > viewportWidth;
  const hasVerticalOverflow = totalStageHeight + UI_OVERHEAD > viewportHeight;

  return {
    plinthSize,
    stagePadding,
    totalStageWidth,
    totalStageHeight,
    hasHorizontalOverflow,
    hasVerticalOverflow,
  };
}

/**
 * Factory for a brand new, clean match session.
 */
export function createInitialRoom(
  code: string,
  players: Player[],
  hostId: string = 'user_1',
  maxPlayers: number = 4
): GameRoom {
  return {
    id: `room_${Date.now()}`,
    code,
    hostId,
    maxPlayers,
    status: 'playing',
    phase: 'PLAYER_TURN',
    turnIndex: 1,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    players,
    currentTurnColor: 'red',
    diceValue: 6,
    hasRolledDice: false,
    turnTimeRemaining: TURN_TIME_LIMIT_SECONDS,
    winnerId: null,
    consecutiveSixes: 0,
  };
}
