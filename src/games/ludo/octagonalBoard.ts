// src/games/ludo/octagonalBoard.ts
// Mathematical model and geometry for the 8-Player Octagonal Ludo Board.
// Matches the uploaded 8-player octagonal design with sectors 01 to 08.

export interface OctagonSectorInfo {
  index: number;
  label: string;       // "01", "02", ... "08"
  name: string;        // "Blue", "Cyan", etc.
  color: string;       // Main hex color
  secondaryColor: string;
  angleDeg: number;    // Center angle of this arm
  startTrackIdx: number;
  safeTrackIdx: number;
}

export const OCTAGON_SECTORS: readonly OctagonSectorInfo[] = [
  {
    index: 0,
    label: '01',
    name: 'Blue',
    color: '#0055D4',
    secondaryColor: '#3377FF',
    angleDeg: 180, // Left
    startTrackIdx: 0,
    safeTrackIdx: 4,
  },
  {
    index: 1,
    label: '02',
    name: 'Cyan',
    color: '#00D4FF',
    secondaryColor: '#66E5FF',
    angleDeg: 135, // Bottom-Left
    startTrackIdx: 8,
    safeTrackIdx: 12,
  },
  {
    index: 2,
    label: '03',
    name: 'Magenta',
    color: '#E600AA',
    secondaryColor: '#FF44CC',
    angleDeg: 90, // Bottom
    startTrackIdx: 16,
    safeTrackIdx: 20,
  },
  {
    index: 3,
    label: '04',
    name: 'Purple',
    color: '#6F00FF',
    secondaryColor: '#9944FF',
    angleDeg: 45, // Bottom-Right
    startTrackIdx: 24,
    safeTrackIdx: 28,
  },
  {
    index: 4,
    label: '05',
    name: 'Yellow',
    color: '#FFD700',
    secondaryColor: '#FFE566',
    angleDeg: 0, // Right
    startTrackIdx: 32,
    safeTrackIdx: 36,
  },
  {
    index: 5,
    label: '06',
    name: 'Orange',
    color: '#FF7700',
    secondaryColor: '#FFAA44',
    angleDeg: 315, // Top-Right
    startTrackIdx: 40,
    safeTrackIdx: 44,
  },
  {
    index: 6,
    label: '07',
    name: 'Red',
    color: '#EE1122',
    secondaryColor: '#FF4455',
    angleDeg: 270, // Top
    startTrackIdx: 48,
    safeTrackIdx: 52,
  },
  {
    index: 7,
    label: '08',
    name: 'Green',
    color: '#00AA33',
    secondaryColor: '#33CC66',
    angleDeg: 225, // Top-Left
    startTrackIdx: 56,
    safeTrackIdx: 60,
  },
] as const;

export const OCTAGON_TRACK_LENGTH = 64; // 8 sectors * 8 cells perimeter
export const OCTAGON_HOME_RUNWAY_LEN = 5;
export const OCTAGON_WIN_POSITION = 69; // 0..63 track, 64..68 runway, 69 win center

export interface Point2D {
  x: number;
  y: number;
}

// Convert polar (r, angleDeg) to cartesian (x, y) relative to center
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point2D {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Precomputes SVG 2D coordinates for all track positions, base slots, and runway cells.
 * Coordinate space is a 800x800 square viewbox.
 */
export function getOctagonGeometry(width = 800, height = 800) {
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.46; // ~368
  const baseR = width * 0.38;
  const trackInnerR = width * 0.17;
  const centerR = width * 0.08;

  // 1. Base slots for each sector (4 slots per sector in wedge)
  const baseSlots: Point2D[][] = [];
  for (let s = 0; s < 8; s++) {
    const sec = OCTAGON_SECTORS[s];
    // Base yard is positioned in the triangular corner between arms
    const yardAngle = sec.angleDeg + 22.5;
    const yardR = width * 0.35;
    const centerPoint = polarToCartesian(cx, cy, yardR, yardAngle);

    // 2x2 cluster around centerPoint
    const d = 16;
    baseSlots.push([
      { x: centerPoint.x - d, y: centerPoint.y - d },
      { x: centerPoint.x + d, y: centerPoint.y - d },
      { x: centerPoint.x - d, y: centerPoint.y + d },
      { x: centerPoint.x + d, y: centerPoint.y + d },
    ]);
  }

  // 2. Track cells (64 cells clockwise around perimeter)
  const trackCells: Point2D[] = [];
  for (let idx = 0; idx < OCTAGON_TRACK_LENGTH; idx++) {
    const secIdx = Math.floor(idx / 8);
    const cellInSec = idx % 8;
    const sec = OCTAGON_SECTORS[secIdx];
    const armAngle = sec.angleDeg;

    // Cells 0..7 within sector:
    // 0: Start cell (right of arm, near middle radius)
    // 1..3: Going outward along right side of arm
    // 4: Stop / Safe cell at outer turn
    // 5..7: Returning inward along left side of arm
    let r = width * 0.22;
    let angleOffset = 0;

    if (cellInSec === 0) {
      r = width * 0.20;
      angleOffset = 4;
    } else if (cellInSec === 1) {
      r = width * 0.27;
      angleOffset = 4;
    } else if (cellInSec === 2) {
      r = width * 0.34;
      angleOffset = 4;
    } else if (cellInSec === 3) {
      r = width * 0.40;
      angleOffset = 3;
    } else if (cellInSec === 4) {
      // Safe "Stop" cell at apex
      r = width * 0.42;
      angleOffset = 0;
    } else if (cellInSec === 5) {
      r = width * 0.40;
      angleOffset = -3;
    } else if (cellInSec === 6) {
      r = width * 0.34;
      angleOffset = -4;
    } else {
      r = width * 0.27;
      angleOffset = -4;
    }

    trackCells.push(polarToCartesian(cx, cy, r, armAngle + angleOffset));
  }

  // 3. Home runway cells for each sector (5 cells leading from track into center)
  const homeRunways: Point2D[][] = [];
  for (let s = 0; s < 8; s++) {
    const sec = OCTAGON_SECTORS[s];
    const cells: Point2D[] = [];
    for (let step = 0; step < 5; step++) {
      // Linearly interpolate from track radius down to center wedge
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

/**
 * Convert player's relative position (-1..69) to 2D coordinates on the 800x800 board.
 */
export function getOctagonTokenPosition(
  playerIndex: number,
  tokenIndex: number,
  position: number,
  geom: ReturnType<typeof getOctagonGeometry>
): Point2D {
  // -1: in base
  if (position === -1) {
    return geom.baseSlots[playerIndex][tokenIndex] ?? geom.centerPoint;
  }

  // 69: in center (won)
  if (position >= OCTAGON_WIN_POSITION) {
    const sec = OCTAGON_SECTORS[playerIndex];
    // Fan out slightly around center
    const r = 24;
    const angle = sec.angleDeg + (tokenIndex - 1.5) * 12;
    return polarToCartesian(geom.cx, geom.cy, r, angle);
  }

  // 0..63: on main track
  if (position < OCTAGON_TRACK_LENGTH) {
    const sec = OCTAGON_SECTORS[playerIndex];
    const globalIdx = (sec.startTrackIdx + position) % OCTAGON_TRACK_LENGTH;
    return geom.trackCells[globalIdx];
  }

  // 64..68: in home runway
  const runwayIdx = position - OCTAGON_TRACK_LENGTH;
  return geom.homeRunways[playerIndex][runwayIdx] ?? geom.centerPoint;
}
