// src/games/ludo/board.ts
// Board coordinates, path, safe cells. Pure data + helper functions.

export const BOARD_SIZE = 15;

/**
 * The 52-cell main track, clockwise starting from Red's start cell.
 * Coordinates are [row, col] on the 15x15 grid.
 *
 * Verified layout (52 cells):
 *  - 0..4    : row 6, cols 1..5    (Red start at index 0)
 *  - 5..10   : col 6, rows 5..0    (upward)
 *  - 11      : (0,7)               (top middle)
 *  - 12..17  : col 8, rows 0..5    (downward)
 *  - 18..23  : row 6, cols 9..14   (Green start at index 13)
 *  - 24      : (7,14)              (right middle)
 *  - 25..30  : row 8, cols 14..9   (leftward)
 *  - 31..36  : col 8, rows 9..14   (Yellow start at index 26)
 *  - 37      : (14,7)              (bottom middle)
 *  - 38..43  : col 6, rows 14..9   (upward)
 *  - 44..49  : row 8, cols 5..0    (Blue start at index 39)
 *  - 50      : (7,0)               (left middle)
 *  - 51      : (6,0)               (returns near start)
 */
export const MAIN_PATH: readonly [number, number][] = [
  // 0..4
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // 5..10
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // 11
  [0, 7],
  // 12..17
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // 18..23
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // 24
  [7, 14],
  // 25..30
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // 31..36
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // 37
  [14, 7],
  // 38..43
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // 44..49
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // 50
  [7, 0],
  // 51
  [6, 0],
] as const;

export const TRACK_LENGTH = 52;
export const HOME_COLUMN_LENGTH = 6;
export const WIN_POSITION = 57; // position index for "won"
export const TOTAL_TRAVEL = 57; // 0..57
export const TOTAL_STEPS = WIN_POSITION; // alias for rules and engine

/**
 * Start cell on the main track for each player.
 * index:  0=Red, 1=Green, 2=Yellow, 3=Blue
 */
export const PLAYER_STARTS: readonly number[] = [0, 13, 26, 39];

/**
 * Home column cells for each player (6 cells from track entry to center).
 */
export const HOME_COLUMNS: readonly [number, number][][] = [
  // Red:    row 7, cols 1..6 (moving right toward center)
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  // Green:  col 7, rows 1..6 (moving down toward center)
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  // Yellow: row 7, cols 13..8 (moving left toward center)
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  // Blue:   col 7, rows 13..8 (moving up toward center)
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
] as const;

/**
 * Base slot coordinates for the 4 tokens of each player.
 * Uses integer grid cells inside each 6x6 base area.
 */
export const BASE_SLOTS: readonly [number, number][][] = [
  // Player 0 (Blue, top-left) - inside large circle centered at (2.5, 2.5)
  [[1.6, 1.6], [1.6, 3.4], [3.4, 1.6], [3.4, 3.4]],
  // Player 1 (Red/Orange, top-right) - inside large circle centered at (2.5, 11.5)
  [[1.6, 10.6], [1.6, 12.4], [3.4, 10.6], [3.4, 12.4]],
  // Player 2 (Green, bottom-right) - inside large circle centered at (11.5, 11.5)
  [[10.6, 10.6], [10.6, 12.4], [12.4, 10.6], [12.4, 12.4]],
  // Player 3 (Yellow, bottom-left) - inside large circle centered at (11.5, 2.5)
  [[10.6, 1.6], [10.6, 3.4], [12.4, 1.6], [12.4, 3.4]],
] as const;

/**
 * Safe cells on the main track (global track indices).
 *  - 4 start cells: 0, 13, 26, 39
 *  - 4 star cells:  8, 21, 34, 47
 * On safe cells: no capture possible.
 */
export const SAFE_TRACK_INDICES: ReadonlySet<number> = new Set([
  0, 8, 13, 21, 26, 34, 39, 47,
]);

/**
 * Convert (playerIndex, position) into a [row, col] on the grid.
 *
 * Returns:
 *  - null if position is -1 (in base) or out of range
 *  - [7,7] if position is 57 (won — center of board)
 */
export function positionToCoords(
  playerIndex: number,
  position: number
): [number, number] | null {
  if (position < -1 || position > WIN_POSITION) return null;
  if (position === -1) return null;
  if (position === WIN_POSITION) return [7, 7];

  if (position <= 50) {
    const trackIdx = (PLAYER_STARTS[playerIndex] + position) % TRACK_LENGTH;
    return MAIN_PATH[trackIdx];
  }

  return HOME_COLUMNS[playerIndex][position - 51];
}

export const getTokenCoordinates = positionToCoords;

/**
 * Get the [row, col] slot for a token waiting in the base.
 */
export function baseSlotCoords(
  playerIndex: number,
  tokenIndex: number
): [number, number] {
  return BASE_SLOTS[playerIndex][tokenIndex];
}

/**
 * Is a global track index a safe cell?
 */
export function isSafeTrackIndex(trackIdx: number): boolean {
  return SAFE_TRACK_INDICES.has(trackIdx);
}

/**
 * Is a player's token at `position` on a safe track cell?
 */
export function isPositionSafe(
  playerIndex: number,
  position: number
): boolean {
  if (position < 0 || position > 50) return false;
  const trackIdx = (PLAYER_STARTS[playerIndex] + position) % TRACK_LENGTH;
  return SAFE_TRACK_INDICES.has(trackIdx);
}

/**
 * Get the global track index for a (player, position) pair.
 * Returns null for positions outside the main track.
 */
export function toTrackIndex(
  playerIndex: number,
  position: number
): number | null {
  if (position < 0 || position > 50) return null;
  return (PLAYER_STARTS[playerIndex] + position) % TRACK_LENGTH;
}
