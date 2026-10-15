// src/games/ludo/hexagonalBoard.ts
// Mathematical model and geometry for the 6-Player Hexagonal Ludo Board.
// Supports 6 colored sectors, 48 perimeter cells, 6 home runways, and center triumph.

import { Point2D, polarToCartesian } from './octagonalBoard';

export interface HexagonSectorInfo {
  index: number;
  label: string;       // "01", "02", ... "06"
  name: string;        // "Blue", "Green", etc.
  color: string;       // Primary hex color
  secondaryColor: string;
  angleDeg: number;    // Center angle of this arm
  startTrackIdx: number;
  safeTrackIdx: number;
}

export const HEXAGON_SECTORS: readonly HexagonSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue',   color: '#0055D4', secondaryColor: '#3377FF', angleDeg: 180, startTrackIdx: 0,  safeTrackIdx: 4 },
  { index: 1, label: '02', name: 'Green',  color: '#00AA33', secondaryColor: '#33CC66', angleDeg: 120, startTrackIdx: 8,  safeTrackIdx: 12 },
  { index: 2, label: '03', name: 'Yellow', color: '#FACC15', secondaryColor: '#FDE047', angleDeg: 60,  startTrackIdx: 16, safeTrackIdx: 20 },
  { index: 3, label: '04', name: 'Red',    color: '#E11D48', secondaryColor: '#FB7185', angleDeg: 0,   startTrackIdx: 24, safeTrackIdx: 28 },
  { index: 4, label: '05', name: 'Purple', color: '#8B5CF6', secondaryColor: '#C4B5FD', angleDeg: 300, startTrackIdx: 32, safeTrackIdx: 36 },
  { index: 5, label: '06', name: 'Cyan',   color: '#00D4FF', secondaryColor: '#66E5FF', angleDeg: 240, startTrackIdx: 40, safeTrackIdx: 44 },
] as const;

export const HEXAGON_TRACK_LENGTH = 48; // 6 sectors * 8 cells perimeter
export const HEXAGON_HOME_RUNWAY_LEN = 5;
export const HEXAGON_WIN_POSITION = 53; // 0..47 track, 48..52 runway, 53 win center

/**
 * Precomputes SVG 2D coordinates for all track positions, base slots, and runway cells for 6-player board.
 */
export function getHexagonGeometry(width = 800, height = 800) {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.46;
  const baseR = width * 0.38;
  const trackInnerR = width * 0.17;
  const centerR = width * 0.085;

  // 1. Base slots for each sector (4 slots per sector in wedge)
  const baseSlots: Point2D[][] = [];
  for (let s = 0; s < 6; s++) {
    const sec = HEXAGON_SECTORS[s];
    const yardAngle = sec.angleDeg + 30;
    const yardR = width * 0.36;
    const centerPoint = polarToCartesian(cx, cy, yardR, yardAngle);

    const d = 16;
    baseSlots.push([
      { x: centerPoint.x - d, y: centerPoint.y - d },
      { x: centerPoint.x + d, y: centerPoint.y - d },
      { x: centerPoint.x - d, y: centerPoint.y + d },
      { x: centerPoint.x + d, y: centerPoint.y + d },
    ]);
  }

  // 2. Track cells (48 cells around perimeter)
  const trackCells: Point2D[] = [];
  for (let idx = 0; idx < HEXAGON_TRACK_LENGTH; idx++) {
    const secIdx = Math.floor(idx / 8);
    const cellInSec = idx % 8;
    const sec = HEXAGON_SECTORS[secIdx];
    const armAngle = sec.angleDeg;

    let r = width * 0.22;
    let angleOffset = 0;

    if (cellInSec === 0) {
      r = width * 0.20;
      angleOffset = 4.5;
    } else if (cellInSec === 1) {
      r = width * 0.27;
      angleOffset = 4.5;
    } else if (cellInSec === 2) {
      r = width * 0.34;
      angleOffset = 4.5;
    } else if (cellInSec === 3) {
      r = width * 0.40;
      angleOffset = 3;
    } else if (cellInSec === 4) {
      r = width * 0.43;
      angleOffset = 0;
    } else if (cellInSec === 5) {
      r = width * 0.40;
      angleOffset = -3;
    } else if (cellInSec === 6) {
      r = width * 0.34;
      angleOffset = -4.5;
    } else {
      r = width * 0.27;
      angleOffset = -4.5;
    }

    trackCells.push(polarToCartesian(cx, cy, r, armAngle + angleOffset));
  }

  // 3. Home runway cells (5 cells per sector)
  const homeRunways: Point2D[][] = [];
  for (let s = 0; s < 6; s++) {
    const sec = HEXAGON_SECTORS[s];
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

export function getHexagonTokenPosition(
  playerIndex: number,
  tokenIndex: number,
  position: number,
  geom: ReturnType<typeof getHexagonGeometry>
): Point2D {
  if (position === -1) {
    return geom.baseSlots[playerIndex]?.[tokenIndex] ?? geom.centerPoint;
  }

  if (position >= HEXAGON_WIN_POSITION) {
    const sec = HEXAGON_SECTORS[playerIndex];
    const r = 24;
    const angle = (sec?.angleDeg ?? 0) + (tokenIndex - 1.5) * 12;
    return polarToCartesian(geom.cx, geom.cy, r, angle);
  }

  if (position < HEXAGON_TRACK_LENGTH) {
    const sec = HEXAGON_SECTORS[playerIndex];
    const globalIdx = ((sec?.startTrackIdx ?? 0) + position) % HEXAGON_TRACK_LENGTH;
    return geom.trackCells[globalIdx] ?? geom.centerPoint;
  }

  const runwayIdx = position - HEXAGON_TRACK_LENGTH;
  return geom.homeRunways[playerIndex]?.[runwayIdx] ?? geom.centerPoint;
}
