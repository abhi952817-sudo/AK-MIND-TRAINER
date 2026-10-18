// src/games/ludo/polygonalBoardGeometry.ts
// Mathematical model, polygonal geometry, and coordinate projections for 4, 5, 6, 8, 9, and 10 Player Ludo boards.
// Computes high-precision SVG 2D coordinates for base yards, perimeter tracks, home runways, and center triumph.

export type BoardPlayerCount = 4 | 5 | 6 | 8 | 9 | 10;

export interface Point2D {
  x: number;
  y: number;
}

export interface PolygonalSectorInfo {
  index: number;
  label: string;       // "01", "02", ...
  name: string;        // "Blue", "Emerald", etc.
  color: string;       // Primary hex color
  secondaryColor: string;
  glowColor: string;
  angleDeg: number;    // Radial angle (degrees) for the arm
  startTrackIdx: number;
  safeTrackIdx: number;
}

export interface BoardGeometryConfig {
  playerCount: BoardPlayerCount;
  trackLength: number;
  cellsPerSector: number;
  runwayLength: number;
  winPosition: number;
  sectors: readonly PolygonalSectorInfo[];
}

// Convert polar (r, angleDeg) to cartesian (x, y) relative to center (cx, cy)
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point2D {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.cos(rad)).toFixed(2)),
    y: Number((cy + r * Math.sin(rad)).toFixed(2)),
  };
}

// 4-Player Standard Board
export const SECTORS_4P: readonly PolygonalSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue',    color: '#0055D4', secondaryColor: '#3377FF', glowColor: '#60A5FA', angleDeg: 180, startTrackIdx: 0,  safeTrackIdx: 8 },
  { index: 1, label: '02', name: 'Green',   color: '#00AA33', secondaryColor: '#33CC66', glowColor: '#4ADE80', angleDeg: 90,  startTrackIdx: 13, safeTrackIdx: 21 },
  { index: 2, label: '03', name: 'Yellow',  color: '#FACC15', secondaryColor: '#FDE047', glowColor: '#FEF08A', angleDeg: 0,   startTrackIdx: 26, safeTrackIdx: 34 },
  { index: 3, label: '04', name: 'Red',     color: '#E11D48', secondaryColor: '#FB7185', glowColor: '#F87171', angleDeg: 270, startTrackIdx: 39, safeTrackIdx: 47 },
] as const;

// 5-Player Pentagonal Board (72° spacing)
export const SECTORS_5P: readonly PolygonalSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue',    color: '#0055D4', secondaryColor: '#3377FF', glowColor: '#60A5FA', angleDeg: 180, startTrackIdx: 0,  safeTrackIdx: 4 },
  { index: 1, label: '02', name: 'Green',   color: '#00AA33', secondaryColor: '#33CC66', glowColor: '#4ADE80', angleDeg: 108, startTrackIdx: 8,  safeTrackIdx: 12 },
  { index: 2, label: '03', name: 'Yellow',  color: '#FACC15', secondaryColor: '#FDE047', glowColor: '#FEF08A', angleDeg: 36,  startTrackIdx: 16, safeTrackIdx: 20 },
  { index: 3, label: '04', name: 'Red',     color: '#E11D48', secondaryColor: '#FB7185', glowColor: '#F87171', angleDeg: 324, startTrackIdx: 24, safeTrackIdx: 28 },
  { index: 4, label: '05', name: 'Purple',  color: '#8B5CF6', secondaryColor: '#C4B5FD', glowColor: '#A78BFA', angleDeg: 252, startTrackIdx: 32, safeTrackIdx: 36 },
] as const;

// 6-Player Hexagonal Board (60° spacing)
export const SECTORS_6P: readonly PolygonalSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue',    color: '#0055D4', secondaryColor: '#3377FF', glowColor: '#60A5FA', angleDeg: 180, startTrackIdx: 0,  safeTrackIdx: 4 },
  { index: 1, label: '02', name: 'Green',   color: '#00AA33', secondaryColor: '#33CC66', glowColor: '#4ADE80', angleDeg: 120, startTrackIdx: 8,  safeTrackIdx: 12 },
  { index: 2, label: '03', name: 'Yellow',  color: '#FACC15', secondaryColor: '#FDE047', glowColor: '#FEF08A', angleDeg: 60,  startTrackIdx: 16, safeTrackIdx: 20 },
  { index: 3, label: '04', name: 'Red',     color: '#E11D48', secondaryColor: '#FB7185', glowColor: '#F87171', angleDeg: 0,   startTrackIdx: 24, safeTrackIdx: 28 },
  { index: 4, label: '05', name: 'Purple',  color: '#8B5CF6', secondaryColor: '#C4B5FD', glowColor: '#A78BFA', angleDeg: 300, startTrackIdx: 32, safeTrackIdx: 36 },
  { index: 5, label: '06', name: 'Cyan',    color: '#00D4FF', secondaryColor: '#66E5FF', glowColor: '#38BDF8', angleDeg: 240, startTrackIdx: 40, safeTrackIdx: 44 },
] as const;

// 8-Player Octagonal Board (45° spacing)
export const SECTORS_8P: readonly PolygonalSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue',    color: '#0055D4', secondaryColor: '#3377FF', glowColor: '#60A5FA', angleDeg: 180, startTrackIdx: 0,  safeTrackIdx: 4 },
  { index: 1, label: '02', name: 'Cyan',    color: '#00D4FF', secondaryColor: '#66E5FF', glowColor: '#38BDF8', angleDeg: 135, startTrackIdx: 8,  safeTrackIdx: 12 },
  { index: 2, label: '03', name: 'Magenta', color: '#E600AA', secondaryColor: '#FF44CC', glowColor: '#F472B6', angleDeg: 90,  startTrackIdx: 16, safeTrackIdx: 20 },
  { index: 3, label: '04', name: 'Purple',  color: '#6F00FF', secondaryColor: '#9944FF', glowColor: '#A78BFA', angleDeg: 45,  startTrackIdx: 24, safeTrackIdx: 28 },
  { index: 4, label: '05', name: 'Yellow',  color: '#FFD700', secondaryColor: '#FFE566', glowColor: '#FEF08A', angleDeg: 0,   startTrackIdx: 32, safeTrackIdx: 36 },
  { index: 5, label: '06', name: 'Orange',  color: '#FF7700', secondaryColor: '#FFAA44', glowColor: '#FB923C', angleDeg: 315, startTrackIdx: 40, safeTrackIdx: 44 },
  { index: 6, label: '07', name: 'Red',     color: '#EE1122', secondaryColor: '#FF4455', glowColor: '#F87171', angleDeg: 270, startTrackIdx: 48, safeTrackIdx: 52 },
  { index: 7, label: '08', name: 'Green',   color: '#00AA33', secondaryColor: '#33CC66', glowColor: '#4ADE80', angleDeg: 225, startTrackIdx: 56, safeTrackIdx: 60 },
] as const;

// 9-Player Enneagonal / Non-Symmetrical Board (40° spacing with custom visual apexes)
export const SECTORS_9P: readonly PolygonalSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue',    color: '#0055D4', secondaryColor: '#3377FF', glowColor: '#60A5FA', angleDeg: 180, startTrackIdx: 0,  safeTrackIdx: 4 },
  { index: 1, label: '02', name: 'Cyan',    color: '#00D4FF', secondaryColor: '#66E5FF', glowColor: '#38BDF8', angleDeg: 140, startTrackIdx: 8,  safeTrackIdx: 12 },
  { index: 2, label: '03', name: 'Teal',    color: '#00BFA5', secondaryColor: '#33D4BE', glowColor: '#2DD4BF', angleDeg: 100, startTrackIdx: 16, safeTrackIdx: 20 },
  { index: 3, label: '04', name: 'Green',   color: '#00AA33', secondaryColor: '#33CC66', glowColor: '#4ADE80', angleDeg: 60,  startTrackIdx: 24, safeTrackIdx: 28 },
  { index: 4, label: '05', name: 'Lime',    color: '#84CC16', secondaryColor: '#A3E635', glowColor: '#BEF264', angleDeg: 20,  startTrackIdx: 32, safeTrackIdx: 36 },
  { index: 5, label: '06', name: 'Yellow',  color: '#FACC15', secondaryColor: '#FDE047', glowColor: '#FEF08A', angleDeg: 340, startTrackIdx: 40, safeTrackIdx: 44 },
  { index: 6, label: '07', name: 'Orange',  color: '#EA580C', secondaryColor: '#FB923C', glowColor: '#FB923C', angleDeg: 300, startTrackIdx: 48, safeTrackIdx: 52 },
  { index: 7, label: '08', name: 'Red',     color: '#E11D48', secondaryColor: '#FB7185', glowColor: '#F87171', angleDeg: 260, startTrackIdx: 56, safeTrackIdx: 60 },
  { index: 8, label: '09', name: 'Purple',  color: '#8B5CF6', secondaryColor: '#C4B5FD', glowColor: '#A78BFA', angleDeg: 220, startTrackIdx: 64, safeTrackIdx: 68 },
] as const;

// 10-Player Decagonal Board (36° spacing)
export const SECTORS_10P: readonly PolygonalSectorInfo[] = [
  { index: 0, label: '01', name: 'Blue',    color: '#0055D4', secondaryColor: '#3377FF', glowColor: '#60A5FA', angleDeg: 180, startTrackIdx: 0,  safeTrackIdx: 4 },
  { index: 1, label: '02', name: 'Cyan',    color: '#00D4FF', secondaryColor: '#66E5FF', glowColor: '#38BDF8', angleDeg: 144, startTrackIdx: 8,  safeTrackIdx: 12 },
  { index: 2, label: '03', name: 'Teal',    color: '#00BFA5', secondaryColor: '#33D4BE', glowColor: '#2DD4BF', angleDeg: 108, startTrackIdx: 16, safeTrackIdx: 20 },
  { index: 3, label: '04', name: 'Green',   color: '#00AA33', secondaryColor: '#33CC66', glowColor: '#4ADE80', angleDeg: 72,  startTrackIdx: 24, safeTrackIdx: 28 },
  { index: 4, label: '05', name: 'Lime',    color: '#84CC16', secondaryColor: '#A3E635', glowColor: '#BEF264', angleDeg: 36,  startTrackIdx: 32, safeTrackIdx: 36 },
  { index: 5, label: '06', name: 'Yellow',  color: '#FACC15', secondaryColor: '#FDE047', glowColor: '#FEF08A', angleDeg: 0,   startTrackIdx: 40, safeTrackIdx: 44 },
  { index: 6, label: '07', name: 'Orange',  color: '#EA580C', secondaryColor: '#FB923C', glowColor: '#FB923C', angleDeg: 324, startTrackIdx: 48, safeTrackIdx: 52 },
  { index: 7, label: '08', name: 'Coral',   color: '#E11D48', secondaryColor: '#FB7185', glowColor: '#F87171', angleDeg: 288, startTrackIdx: 56, safeTrackIdx: 60 },
  { index: 8, label: '09', name: 'Magenta', color: '#D946EF', secondaryColor: '#F0ABFC', glowColor: '#F472B6', angleDeg: 252, startTrackIdx: 64, safeTrackIdx: 68 },
  { index: 9, label: '10', name: 'Purple',  color: '#8B5CF6', secondaryColor: '#C4B5FD', glowColor: '#A78BFA', angleDeg: 216, startTrackIdx: 72, safeTrackIdx: 76 },
] as const;

export function getBoardConfig(playerCount: BoardPlayerCount): BoardGeometryConfig {
  switch (playerCount) {
    case 4:
      return {
        playerCount: 4,
        trackLength: 52,
        cellsPerSector: 13,
        runwayLength: 6,
        winPosition: 57,
        sectors: SECTORS_4P,
      };
    case 5:
      return {
        playerCount: 5,
        trackLength: 40,
        cellsPerSector: 8,
        runwayLength: 5,
        winPosition: 45,
        sectors: SECTORS_5P,
      };
    case 6:
      return {
        playerCount: 6,
        trackLength: 48,
        cellsPerSector: 8,
        runwayLength: 5,
        winPosition: 53,
        sectors: SECTORS_6P,
      };
    case 8:
      return {
        playerCount: 8,
        trackLength: 64,
        cellsPerSector: 8,
        runwayLength: 5,
        winPosition: 69,
        sectors: SECTORS_8P,
      };
    case 9:
      return {
        playerCount: 9,
        trackLength: 72,
        cellsPerSector: 8,
        runwayLength: 5,
        winPosition: 77,
        sectors: SECTORS_9P,
      };
    case 10:
    default:
      return {
        playerCount: 10,
        trackLength: 80,
        cellsPerSector: 8,
        runwayLength: 5,
        winPosition: 85,
        sectors: SECTORS_10P,
      };
  }
}

export interface ComputedBoardGeometry {
  config: BoardGeometryConfig;
  cx: number;
  cy: number;
  baseSlots: Point2D[][];      // [sectorIndex][0..3 token slot]
  trackCells: Point2D[];       // [trackIndex]
  runwayCells: Point2D[][];    // [sectorIndex][0..runwayLength-1]
  centerTriumph: Point2D;
  safeTrackIndices: number[];
}

/**
 * Computes exact SVG vector coordinates for any of the 6 board configurations.
 * Fits within an 800x800 square coordinate system.
 */
export function getPolygonalBoardGeometry(
  playerCount: BoardPlayerCount,
  width = 800,
  height = 800
): ComputedBoardGeometry {
  const config = getBoardConfig(playerCount);
  const cx = width / 2;
  const cy = height / 2;
  const numSectors = config.playerCount;

  // 1. Base slots for each sector (4 slots per player base yard)
  const baseSlots: Point2D[][] = [];
  const yardOffsetAngle = 360 / (numSectors * 2);

  for (let s = 0; s < numSectors; s++) {
    const sec = config.sectors[s];
    const yardAngle = sec.angleDeg + yardOffsetAngle;
    const yardR = width * (numSectors >= 8 ? 0.36 : 0.35);
    const centerPoint = polarToCartesian(cx, cy, yardR, yardAngle);
    const d = numSectors >= 8 ? 14 : 16;

    baseSlots.push([
      { x: Number((centerPoint.x - d).toFixed(2)), y: Number((centerPoint.y - d).toFixed(2)) },
      { x: Number((centerPoint.x + d).toFixed(2)), y: Number((centerPoint.y - d).toFixed(2)) },
      { x: Number((centerPoint.x - d).toFixed(2)), y: Number((centerPoint.y + d).toFixed(2)) },
      { x: Number((centerPoint.x + d).toFixed(2)), y: Number((centerPoint.y + d).toFixed(2)) },
    ]);
  }

  // 2. Track Cells around the polygon perimeter
  const trackCells: Point2D[] = [];

  if (playerCount === 4) {
    // Standard square 52-cell track
    const step = width / 15;
    // Map standard 4-player 52 coordinates
    for (let i = 0; i < 52; i++) {
      let x = cx;
      let y = cy;
      // Coordinates mapped to 15x15 classic ludo grid
      if (i <= 4) { x = step * (i + 1); y = step * 6.5; }
      else if (i === 5) { x = step * 6.5; y = step * 5.5; }
      else if (i <= 10) { x = step * 6.5; y = step * (11 - i); }
      else if (i === 11) { x = step * 7.5; y = step * 0.5; }
      else if (i === 12) { x = step * 8.5; y = step * 0.5; }
      else if (i <= 17) { x = step * 8.5; y = step * (i - 11); }
      else if (i === 18) { x = step * 9.5; y = step * 6.5; }
      else if (i <= 23) { x = step * (i - 9); y = step * 6.5; }
      else if (i === 24) { x = step * 14.5; y = step * 7.5; }
      else if (i === 25) { x = step * 14.5; y = step * 8.5; }
      else if (i <= 30) { x = step * (39 - i); y = step * 8.5; }
      else if (i === 31) { x = step * 8.5; y = step * 9.5; }
      else if (i <= 36) { x = step * 8.5; y = step * (i - 22); }
      else if (i === 37) { x = step * 7.5; y = step * 14.5; }
      else if (i === 38) { x = step * 6.5; y = step * 14.5; }
      else if (i <= 43) { x = step * 6.5; y = step * (52 - i); }
      else if (i === 44) { x = step * 5.5; y = step * 8.5; }
      else if (i <= 49) { x = step * (50 - i); y = step * 8.5; }
      else if (i === 50) { x = step * 0.5; y = step * 7.5; }
      else { x = step * 0.5; y = step * 6.5; }

      trackCells.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    }
  } else {
    // Polygonal radial perimeter (5, 6, 8, 9, 10 sectors, 8 cells per arm)
    const armHalfAngle = (360 / numSectors) * 0.28;
    const rOuter = width * 0.44;
    const rMid = width * 0.28;
    const rInner = width * 0.17;

    for (let idx = 0; idx < config.trackLength; idx++) {
      const secIdx = Math.floor(idx / 8);
      const cellInSec = idx % 8;
      const sec = config.sectors[secIdx];
      const armAngle = sec.angleDeg;

      let r = rMid;
      let angle = armAngle;

      if (cellInSec === 0) {
        // Start cell (right boundary of arm, middle radius)
        r = rInner + 10;
        angle = armAngle + armHalfAngle;
      } else if (cellInSec === 1) {
        r = (rInner + rMid) / 2;
        angle = armAngle + armHalfAngle;
      } else if (cellInSec === 2) {
        r = rMid;
        angle = armAngle + armHalfAngle * 0.85;
      } else if (cellInSec === 3) {
        r = (rMid + rOuter) / 2;
        angle = armAngle + armHalfAngle * 0.6;
      } else if (cellInSec === 4) {
        // Safe cell / apex star at outer vertex
        r = rOuter;
        angle = armAngle;
      } else if (cellInSec === 5) {
        r = (rMid + rOuter) / 2;
        angle = armAngle - armHalfAngle * 0.6;
      } else if (cellInSec === 6) {
        r = rMid;
        angle = armAngle - armHalfAngle * 0.85;
      } else {
        // cell 7: Returning inward along left side
        r = rInner + 10;
        angle = armAngle - armHalfAngle;
      }

      trackCells.push(polarToCartesian(cx, cy, r, angle));
    }
  }

  // 3. Home Runways (leading into central triumph)
  const runwayCells: Point2D[][] = [];
  for (let s = 0; s < numSectors; s++) {
    const sec = config.sectors[s];
    const armAngle = sec.angleDeg;
    const runway: Point2D[] = [];

    if (playerCount === 4) {
      const step = width / 15;
      for (let r = 0; r < config.runwayLength; r++) {
        let x = cx;
        let y = cy;
        if (s === 0) { x = step * (r + 1.5); y = step * 7.5; }
        else if (s === 1) { x = step * 7.5; y = step * (13.5 - r); }
        else if (s === 2) { x = step * (13.5 - r); y = step * 7.5; }
        else { x = step * 7.5; y = step * (r + 1.5); }
        runway.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      }
    } else {
      const rStart = width * 0.17;
      const rEnd = width * 0.08;
      const deltaR = (rStart - rEnd) / (config.runwayLength);

      for (let r = 0; r < config.runwayLength; r++) {
        const radius = rStart - deltaR * r;
        runway.push(polarToCartesian(cx, cy, radius, armAngle));
      }
    }

    runwayCells.push(runway);
  }

  const safeTrackIndices = config.sectors.map((s) => s.safeTrackIdx);

  return {
    config,
    cx,
    cy,
    baseSlots,
    trackCells,
    runwayCells,
    centerTriumph: { x: cx, y: cy },
    safeTrackIndices,
  };
}
