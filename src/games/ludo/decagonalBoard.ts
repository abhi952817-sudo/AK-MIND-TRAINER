// src/games/ludo/decagonalBoard.ts
// Mathematical model and geometry for the 10-Player Decagonal Ludo Board.
// Supports 10 players/bots with 10 arms, 80-cell track, 10 home runways, and center triumph.

import { Point2D, polarToCartesian } from './octagonalBoard';

export interface DecagonSectorInfo {
  index: number;
  label: string;       // "01", "02", ... "10"
  name: string;        // "Blue", "Cyan", etc.
  color: string;       // Main hex color
  secondaryColor: string;
  angleDeg: number;    // Center angle of this arm
  startTrackIdx: number;
  safeTrackIdx: number;
}

export const DECAGON_SECTORS: readonly DecagonSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue', color: '#0055D4', secondaryColor: '#3377FF', angleDeg: 180, startTrackIdx: 0, safeTrackIdx: 4 },
  { index: 1, label: '02', name: 'Cyan', color: '#00D4FF', secondaryColor: '#66E5FF', angleDeg: 144, startTrackIdx: 8, safeTrackIdx: 12 },
  { index: 2, label: '03', name: 'Teal', color: '#00BFA5', secondaryColor: '#33D4BE', angleDeg: 108, startTrackIdx: 16, safeTrackIdx: 20 },
  { index: 3, label: '04', name: 'Green', color: '#00AA33', secondaryColor: '#33CC66', angleDeg: 72, startTrackIdx: 24, safeTrackIdx: 28 },
  { index: 4, label: '05', name: 'Lime', color: '#84CC16', secondaryColor: '#A3E635', angleDeg: 36, startTrackIdx: 32, safeTrackIdx: 36 },
  { index: 5, label: '06', name: 'Yellow', color: '#FACC15', secondaryColor: '#FDE047', angleDeg: 0, startTrackIdx: 40, safeTrackIdx: 44 },
  { index: 6, label: '07', name: 'Orange', color: '#EA580C', secondaryColor: '#FB923C', angleDeg: 324, startTrackIdx: 48, safeTrackIdx: 52 },
  { index: 7, label: '08', name: 'Coral', color: '#E11D48', secondaryColor: '#FB7185', angleDeg: 288, startTrackIdx: 56, safeTrackIdx: 60 },
  { index: 8, label: '09', name: 'Magenta', color: '#D946EF', secondaryColor: '#F0ABFC', angleDeg: 252, startTrackIdx: 64, safeTrackIdx: 68 },
  { index: 9, label: '10', name: 'Purple', color: '#8B5CF6', secondaryColor: '#C4B5FD', angleDeg: 216, startTrackIdx: 72, safeTrackIdx: 76 },
] as const;

export const DECAGON_TRACK_LENGTH = 80; // 10 sectors * 8 cells perimeter
export const DECAGON_HOME_RUNWAY_LEN = 5;
export const DECAGON_WIN_POSITION = 85; // 0..79 track, 80..84 runway, 85 win center

/**
 * Precomputes SVG 2D coordinates for all track positions, base slots, and runway cells for 10-player board.
 */
export function getDecagonGeometry(width = 800, height = 800) {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.46;
  const baseR = width * 0.38;
  const trackInnerR = width * 0.16;
  const centerR = width * 0.08;

  // 1. Base slots for each sector (4 slots per sector)
  const baseSlots: Point2D[][] = [];
  for (let s = 0; s < 10; s++) {
    const sec = DECAGON_SECTORS[s];
    const yardAngle = sec.angleDeg + 18;
    const yardR = width * 0.36;
    const centerPoint = polarToCartesian(cx, cy, yardR, yardAngle);

    const d = 14;
    baseSlots.push([
      { x: centerPoint.x - d, y: centerPoint.y - d },
      { x: centerPoint.x + d, y: centerPoint.y - d },
      { x: centerPoint.x - d, y: centerPoint.y + d },
      { x: centerPoint.x + d, y: centerPoint.y + d },
    ]);
  }

  // 2. Track cells (80 cells around perimeter)
  const trackCells: Point2D[] = [];
  for (let idx = 0; idx < DECAGON_TRACK_LENGTH; idx++) {
    const secIdx = Math.floor(idx / 8);
    const cellInSec = idx % 8;
    const sec = DECAGON_SECTORS[secIdx];
    const armAngle = sec.angleDeg;

    let r = width * 0.22;
    let angleOffset = 0;

    if (cellInSec === 0) {
      r = width * 0.19;
      angleOffset = 3.5;
    } else if (cellInSec === 1) {
      r = width * 0.26;
      angleOffset = 3.5;
    } else if (cellInSec === 2) {
      r = width * 0.33;
      angleOffset = 3.5;
    } else if (cellInSec === 3) {
      r = width * 0.40;
      angleOffset = 2.5;
    } else if (cellInSec === 4) {
      r = width * 0.43;
      angleOffset = 0;
    } else if (cellInSec === 5) {
      r = width * 0.40;
      angleOffset = -2.5;
    } else if (cellInSec === 6) {
      r = width * 0.33;
      angleOffset = -3.5;
    } else {
      r = width * 0.26;
      angleOffset = -3.5;
    }

    trackCells.push(polarToCartesian(cx, cy, r, armAngle + angleOffset));
  }

  // 3. Home runway cells (5 cells per sector)
  const homeRunways: Point2D[][] = [];
  for (let s = 0; s < 10; s++) {
    const sec = DECAGON_SECTORS[s];
    const cells: Point2D[] = [];
    for (let step = 0; step < 5; step++) {
      const r = width * 0.38 - step * (width * 0.055);
      cells.push(polarToCartesian(cx, cy, r, sec.angleDeg));
    }
    homeRunways.push(cells);
  }

  // 4. Center victory point
  const centerPoint: Point2D = { x: cx, y: cy };

  return {
    cx,
    cy,
    outerR,
    baseR,
    trackInnerR,
    centerR,
    baseSlots,
    trackCells,
    homeRunways,
    centerPoint,
  };
}

export function getDecagonTokenPosition(
  playerIndex: number,
  tokenIndex: number,
  position: number,
  geom: ReturnType<typeof getDecagonGeometry>
): Point2D {
  if (position === -1) {
    return geom.baseSlots[playerIndex]?.[tokenIndex] ?? geom.centerPoint;
  }

  if (position >= DECAGON_WIN_POSITION) {
    const sec = DECAGON_SECTORS[playerIndex];
    const r = 22;
    const angle = (sec?.angleDeg ?? 0) + (tokenIndex - 1.5) * 10;
    return polarToCartesian(geom.cx, geom.cy, r, angle);
  }

  if (position < DECAGON_TRACK_LENGTH) {
    const sec = DECAGON_SECTORS[playerIndex];
    const globalIdx = ((sec?.startTrackIdx ?? 0) + position) % DECAGON_TRACK_LENGTH;
    return geom.trackCells[globalIdx] ?? geom.centerPoint;
  }

  const runwayIdx = position - DECAGON_TRACK_LENGTH;
  return geom.homeRunways[playerIndex]?.[runwayIdx] ?? geom.centerPoint;
}
