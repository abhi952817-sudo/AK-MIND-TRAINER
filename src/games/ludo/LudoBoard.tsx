// src/games/ludo/LudoBoard.tsx
// Authentic classic wooden board matching the exact user-specified design.
// Features circular yards, white token slots, colored entry arrows, runways, center triangles,
// brass rivets, and legal move destination indicators.

import React, { useMemo } from 'react';
import { PLAYER_COLORS, COLORS } from '../../types/ludoverse';
import {
  BASE_SLOTS,
  BOARD_SIZE,
  HOME_COLUMNS,
  MAIN_PATH,
  SAFE_TRACK_INDICES,
  positionToCoords,
  isPositionSafe,
  toTrackIndex,
} from './board';
import { GameState, MoveOption, Token } from './types';
import { LudoToken } from './LudoToken';

interface LudoBoardProps {
  state: GameState;
  legalMoves: MoveOption[];
  onTokenClick: (tokenId: string) => void;
  inputLocked?: boolean;
  size?: number;
}

// 4 Corner circular yards configuration
const CORNER_YARDS = [
  {
    playerIndex: 0,
    color: COLORS.blue,
    name: 'Blue',
    row: 0,
    col: 0,
    centerRow: 2.5,
    centerCol: 2.5,
  },
  {
    playerIndex: 1,
    color: COLORS.red,
    name: 'Red',
    row: 0,
    col: 9,
    centerRow: 2.5,
    centerCol: 11.5,
  },
  {
    playerIndex: 2,
    color: COLORS.green,
    name: 'Green',
    row: 9,
    col: 9,
    centerRow: 11.5,
    centerCol: 11.5,
  },
  {
    playerIndex: 3,
    color: COLORS.yellow,
    name: 'Yellow',
    row: 9,
    col: 0,
    centerRow: 11.5,
    centerCol: 2.5,
  },
] as const;

// Colored start entry cells with white arrows
const ENTRY_ARROWS: Record<string, { color: string; direction: 'right' | 'down' | 'left' | 'up' }> = {
  '6,1':  { color: COLORS.blue,   direction: 'right' },
  '1,8':  { color: COLORS.red,    direction: 'down' },
  '8,13': { color: COLORS.green,  direction: 'left' },
  '13,6': { color: COLORS.yellow, direction: 'up' },
};

// Colored home runways (5 cells leading into each center triangle)
const RUNWAY_CELLS: Record<string, string> = {
  // Blue runway: row 7, cols 1..5
  '7,1': COLORS.blue,
  '7,2': COLORS.blue,
  '7,3': COLORS.blue,
  '7,4': COLORS.blue,
  '7,5': COLORS.blue,

  // Red runway: col 7, rows 1..5
  '1,7': COLORS.red,
  '2,7': COLORS.red,
  '3,7': COLORS.red,
  '4,7': COLORS.red,
  '5,7': COLORS.red,

  // Green runway: row 7, cols 9..13
  '7,9':  COLORS.green,
  '7,10': COLORS.green,
  '7,11': COLORS.green,
  '7,12': COLORS.green,
  '7,13': COLORS.green,

  // Yellow runway: col 7, rows 9..13
  '9,7':  COLORS.yellow,
  '10,7': COLORS.yellow,
  '11,7': COLORS.yellow,
  '12,7': COLORS.yellow,
  '13,7': COLORS.yellow,
};

// Classic star safe spots
const STAR_CELLS = new Set(['2,6', '6,12', '12,8', '8,2']);

export const LudoBoard: React.FC<LudoBoardProps> = ({
  state,
  legalMoves,
  onTokenClick,
  inputLocked = false,
  size: sizeProp,
}) => {
  const outerSize = sizeProp ?? Math.min(window.innerWidth - 20, 420);
  const frameBorder = Math.max(9, Math.round(outerSize * 0.028));
  const boardPlaySize = outerSize - frameBorder * 2;
  const cell = boardPlaySize / BOARD_SIZE;

  // Group tokens for multi-token stacking offset on the same cell
  const tokenStackInfo = useMemo(() => {
    const counts = new Map<string, number>();
    const indices = new Map<string, number>();

    for (const t of state.tokens) {
      const key =
        t.position === -1
          ? `base-${t.playerIndex}-${t.tokenIndex}`
          : cellKey(t);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const tokenMap = new Map<string, { stackIndex: number; total: number }>();
    for (const t of state.tokens) {
      const key =
        t.position === -1
          ? `base-${t.playerIndex}-${t.tokenIndex}`
          : cellKey(t);
      const currIdx = indices.get(key) ?? 0;
      indices.set(key, currIdx + 1);
      tokenMap.set(t.id, {
        stackIndex: currIdx,
        total: counts.get(key) ?? 1,
      });
    }

    return tokenMap;
  }, [state.tokens]);

  const movableTokenIds = useMemo(() => {
    if (inputLocked) return new Set<string>();
    return new Set(legalMoves.map((m) => m.tokenId));
  }, [legalMoves, inputLocked]);

  // Destination highlight cells for current legal moves
  const destinationCells = useMemo(() => {
    if (inputLocked || legalMoves.length === 0) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const m of legalMoves) {
      const pIdx = state.activePlayerIndex;
      const coords = positionToCoords(pIdx, m.to);
      if (coords && coords[0] >= 0 && coords[1] >= 0) {
        const key = `${coords[0]},${coords[1]}`;
        const colorName = (['blue', 'red', 'green', 'yellow'] as const)[pIdx] ?? 'blue';
        map.set(key, PLAYER_COLORS[colorName] || '#006CA5');
      }
    }
    return map;
  }, [legalMoves, inputLocked]);

  return (
    <div
      className="relative select-none rounded-[12px] shadow-[0_14px_40px_rgba(0,0,0,0.65)]"
      style={{
        width: outerSize,
        height: outerSize,
        background: 'linear-gradient(135deg, #DEB887 0%, #D4A373 50%, #C6905D 100%)',
        border: '3px solid #2D180B',
        padding: frameBorder,
        boxSizing: 'border-box',
      }}
    >
      {/* Brass Corner Rivets on Wooden Frame */}
      {[
        { top: 2.5, left: 2.5 },
        { top: 2.5, right: 2.5 },
        { bottom: 2.5, left: 2.5 },
        { bottom: 2.5, right: 2.5 },
      ].map((pos, idx) => (
        <div
          key={`rivet-${idx}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            ...pos,
            width: 5,
            height: 5,
            background: 'radial-gradient(circle at 35% 35%, #F5D77F 0%, #B8860B 80%, #5E4300 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
            border: '0.5px solid #4A3300',
          }}
        />
      ))}

      {/* ---------- Inner 15x15 Playing Surface ---------- */}
      <div
        className="relative overflow-hidden"
        style={{
          width: boardPlaySize,
          height: boardPlaySize,
          background: '#E8BD8C', // Warm parchment / light oak background
          border: '2px solid #1A1A1A',
        }}
      >
        {/* ========================================================= */}
        {/* 1. FOUR CORNER CIRCULAR BASE YARDS (0, 1, 2, 3)          */}
        {/* ========================================================= */}
        {CORNER_YARDS.map((yard) => {
          const yardDiameter = cell * 4.6;
          const yardLeft = (yard.col + 0.7) * cell;
          const yardTop = (yard.row + 0.7) * cell;

          return (
            <div key={`yard-${yard.playerIndex}`}>
              {/* Corner Quadrant Background */}
              <div
                style={{
                  position: 'absolute',
                  left: yard.col * cell,
                  top: yard.row * cell,
                  width: cell * 6,
                  height: cell * 6,
                  background: '#E8BD8C',
                  border: '1.5px solid #1A1A1A',
                  pointerEvents: 'none',
                }}
              />

              {/* Large Colored Circular Yard Disc */}
              <div
                style={{
                  position: 'absolute',
                  left: yardLeft,
                  top: yardTop,
                  width: yardDiameter,
                  height: yardDiameter,
                  borderRadius: '50%',
                  background: yard.color,
                  border: '3.5px solid #1A1A1A',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                }}
              />

              {/* 4 Inset White Circular Slots for Tokens */}
              {BASE_SLOTS[yard.playerIndex].map(([r, c], slotIdx) => {
                const slotSize = cell * 0.88;
                const slotLeft = c * cell + (cell - slotSize) / 2;
                const slotTop = r * cell + (cell - slotSize) / 2;

                return (
                  <div
                    key={`slot-${yard.playerIndex}-${slotIdx}`}
                    style={{
                      position: 'absolute',
                      left: slotLeft,
                      top: slotTop,
                      width: slotSize,
                      height: slotSize,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      border: '2px solid #1A1A1A',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25)',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* ========================================================= */}
        {/* 2. THE 15x15 TRACK CELLS (Cross Arms)                     */}
        {/* ========================================================= */}
        {Array.from({ length: BOARD_SIZE }).map((_, r) =>
          Array.from({ length: BOARD_SIZE }).map((_, c) => {
            // Skip the 4 corner 6x6 base quadrants
            const isCorner =
              (r < 6 && c < 6) ||
              (r < 6 && c > 8) ||
              (r > 8 && c < 6) ||
              (r > 8 && c > 8);
            if (isCorner) return null;

            // Skip the center 3x3 home square
            const isCenter3x3 = r >= 6 && r <= 8 && c >= 6 && c <= 8;
            if (isCenter3x3) return null;

            const coordKey = `${r},${c}`;
            const entryArrow = ENTRY_ARROWS[coordKey];
            const runwayColor = RUNWAY_CELLS[coordKey];
            const isStar = STAR_CELLS.has(coordKey);
            const destinationColor = destinationCells.get(coordKey);

            let cellBg = '#FFFFFF';
            if (runwayColor) {
              cellBg = runwayColor;
            } else if (entryArrow) {
              cellBg = entryArrow.color;
            }

            return (
              <div
                key={`cell-${r}-${c}`}
                className="relative"
                style={{
                  position: 'absolute',
                  left: c * cell,
                  top: r * cell,
                  width: cell,
                  height: cell,
                  background: cellBg,
                  border: '1.5px solid #1A1A1A',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                {/* Entry Arrow SVG */}
                {entryArrow && (
                  <ArrowIcon direction={entryArrow.direction} size={cell * 0.62} />
                )}

                {/* Safe Star Indicator */}
                {isStar && !entryArrow && !runwayColor && (
                  <span
                    style={{
                      fontSize: cell * 0.55,
                      color: '#4A5568',
                      fontWeight: 'bold',
                      lineHeight: 1,
                    }}
                  >
                    ★
                  </span>
                )}

                {/* Move Destination Pulse Ring */}
                {destinationColor && (
                  <div
                    className="absolute inset-1 rounded-full pointer-events-none animate-pulse"
                    style={{
                      border: `2px solid ${destinationColor}`,
                      background: `${destinationColor}25`,
                    }}
                  />
                )}
              </div>
            );
          })
        )}

        {/* ========================================================= */}
        {/* 3. CENTER 3x3 TRIANGLE SECTION (HOME WIN INTERSECTION)    */}
        {/* ========================================================= */}
        <div
          style={{
            position: 'absolute',
            left: cell * 6,
            top: cell * 6,
            width: cell * 3,
            height: cell * 3,
            border: '2px solid #1A1A1A',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{ display: 'block' }}
          >
            {/* Left triangle: Blue */}
            <polygon points="0,0 50,50 0,100" fill={COLORS.blue} />
            {/* Top triangle: Red */}
            <polygon points="0,0 50,50 100,0" fill={COLORS.red} />
            {/* Right triangle: Green */}
            <polygon points="100,0 50,50 100,100" fill={COLORS.green} />
            {/* Bottom triangle: Yellow */}
            <polygon points="0,100 50,50 100,100" fill={COLORS.yellow} />

            {/* Diagonal dividing lines */}
            <line x1="0" y1="0" x2="100" y2="100" stroke="#1A1A1A" strokeWidth="2.5" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="#1A1A1A" strokeWidth="2.5" />

            {/* Center dot marker like the image */}
            <rect x="46.5" y="46.5" width="7" height="7" fill={COLORS.blue} stroke="#1A1A1A" strokeWidth="1" />
          </svg>
        </div>

        {/* ========================================================= */}
        {/* 4. TOKENS LAYER                                           */}
        {/* ========================================================= */}
        {state.tokens.map((token) => {
          const isMovable = movableTokenIds.has(token.id);
          const isSelected = false;
          const isSafe = isSafeToken(token);
          const isCapturable = isTokenCapturable(token, state);
          const stackInfo = tokenStackInfo.get(token.id) ?? { stackIndex: 0, total: 1 };

          return (
            <LudoToken
              key={token.id}
              token={token}
              cellSize={cell}
              isMovable={isMovable}
              isSelected={isSelected}
              isSafe={isSafe}
              isCapturable={isCapturable}
              onClick={onTokenClick}
              stackIndex={stackInfo.stackIndex}
              totalStacked={stackInfo.total}
            />
          );
        })}

        {/* ========================================================= */}
        {/* 5. WINNER CELEBRATION OVERLAY                             */}
        {/* ========================================================= */}
        {state.winner !== null && state.players[state.winner] && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          >
            <div
              className="px-6 py-4 rounded-[20px] font-heading font-black text-white text-xl shadow-2xl border-2 border-white/40 flex flex-col items-center gap-1.5"
              style={{
                background: PLAYER_COLORS[state.players[state.winner].color] || '#E85A0C',
                animation: 'scale-in 0.4s ease',
              }}
            >
              <span className="text-3xl">👑</span>
              <span>
                {state.players[state.winner].name ?? `Player ${state.winner + 1}`} WINS!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------- SVG Arrow Component --------------------

const ArrowIcon: React.FC<{ direction: 'right' | 'down' | 'left' | 'up'; size: number }> = ({
  direction,
  size,
}) => {
  const rotation = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  }[direction];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        transform: `rotate(${rotation}deg)`,
        display: 'block',
      }}
    >
      <polygon
        points="4,8.5 13,8.5 13,4 22,12 13,20 13,15.5 4,15.5"
        fill="#FFFFFF"
        stroke="#1A1A1A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// -------------------- Helper Functions --------------------

function cellKey(t: Token): string {
  const c = positionToCoords(t.playerIndex, t.position);
  return c ? `${c[0]},${c[1]}` : `x-${t.id}`;
}

function isSafeToken(t: Token): boolean {
  if (t.position < 0 || t.position > 50) return false;
  return isPositionSafe(t.playerIndex, t.position);
}

function isTokenCapturable(t: Token, state: GameState): boolean {
  if (t.position < 0 || t.position > 50) return false;
  if (isPositionSafe(t.playerIndex, t.position)) return false;

  const myIdx = toTrackIndex(t.playerIndex, t.position);
  if (myIdx === null) return false;

  for (const o of state.tokens) {
    if (o.playerIndex === t.playerIndex) continue;
    if (o.position < 0 || o.position > 50) continue;
    const oIdx = toTrackIndex(o.playerIndex, o.position);
    if (oIdx === null) continue;
    const dist = (myIdx - oIdx + 52) % 52;
    if (dist >= 1 && dist <= 6) return true;
  }
  return false;
}
