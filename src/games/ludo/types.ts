// src/games/ludo/types.ts
// All Ludo domain types. No UI, no React, pure logic.

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type GamePhase =
  | 'waiting'      // waiting for player to roll dice
  | 'rolling'      // dice animation playing
  | 'selecting'    // dice landed, waiting for token selection
  | 'moving'       // token animation playing
  | 'ended';       // game finished

export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A player in the game.
 */
export interface Player {
  uid: string;
  name: string | null;   // null means not yet set
  color: PlayerColor;
  index: number;         // 0=red, 1=green, 2=yellow, 3=blue
  isBot: boolean;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
}

/**
 * A single token (one player has 4 tokens).
 *
 * Position encoding:
 *   -1        : token is in home base (not on board)
 *    0..50    : token is on the 52-cell main track (0 = player's start cell)
 *   51..56    : token is on home column (6 cells leading to center)
 *   57        : token has reached center (WON)
 *
 * A player must roll EXACTLY the right number to reach 57 (no overshoot).
 */
export interface Token {
  id: string;              // e.g. "0-2" = playerIndex 0, tokenIndex 2
  playerIndex: number;
  color: PlayerColor;
  tokenIndex: number;      // 0..3 within the player
  position: number;        // -1, 0..56, or 57
}

/**
 * A move option — describes what happens if a token is moved.
 */
export interface MoveOption {
  tokenId: string;
  from: number;
  to: number;
  captures: string[];       // tokenIds that will be captured
  reachesHome: boolean;     // does this move land exactly on 57?
  entersHomeColumn: boolean;// crosses from track to home column
  exitsBase: boolean;       // -1 → 0
}

/**
 * A completed move, stored in history.
 */
export interface MoveRecord {
  tokenId: string;
  from: number;
  to: number;
  capturedTokenIds: string[];
  reachedHome: boolean;
  extraTurn: boolean;       // did player get to roll again?
  timestamp: number;
}

/**
 * One player's complete turn (dice roll + move).
 */
export interface TurnRecord {
  playerIndex: number;
  dice: DiceValue;
  move: MoveRecord;
  timestamp: number;
}

/**
 * Full game state. Immutable — every action returns new state.
 */
export interface GameState {
  players: Player[];
  tokens: Token[];
  activePlayerIndex: number;
  diceValue: DiceValue | null;
  phase: GamePhase;
  consecutiveSixes: number;  // 3 in a row → forfeit turn
  history: TurnRecord[];
  winner: number | null;     // playerIndex of winner
  finishOrder: number[];     // players in order they finished
  startedAt: number;
  turnStartedAt: number;     // for 30s timer
}
