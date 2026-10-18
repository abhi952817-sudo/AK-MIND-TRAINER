import React from 'react';
import { Star } from 'lucide-react';
import { LudoColor } from '../../types/ludoverse';

export interface Token {
  id: string;
  color: LudoColor;
  position?: number | { row: number; col: number }; // -1 = base, 0..56 = on path, 57 = won
  canBeCaptured?: boolean;
  canEnterHome?: boolean;
}

export type BoardToken = Token & {
  step?: number;
  position?: { row: number; col: number };
};

interface LudoBoard2DProps {
  tokens?: BoardToken[];
  onTokenClick?: (token: BoardToken) => void;
  activeColor?: LudoColor;
  movableTokenIds?: string[];
  theme?: 'dark' | 'light';
  isGameStarted?: boolean;
  isRolling?: boolean;
}

// Full path from (6,1) going clockwise
const MAIN_PATH: [number, number][] = [
  // Row 6 going right from (6,1) to (6,5)
  [6,1],[6,2],[6,3],[6,4],[6,5],
  // Col 6 going up from (5,6) to (0,6)
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  // (0,7) top middle
  [0,7],
  // Col 8 going down from (0,8) to (5,8)
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  // Row 6 going right from (6,9) to (6,14)
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  // (7,14) right middle
  [7,14],
  // Row 8 going left from (8,14) to (8,9)
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  // Col 8 going down from (9,8) to (14,8)
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  // (14,7) bottom middle
  [14,7],
  // Col 6 going up from (14,6) to (9,6)
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  // Row 8 going left from (8,5) to (8,0)
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  // (7,0) left middle
  [7,0],
  // Back to row 6 (6,0)
  [6,0],
];
// Total: 5+6+1+6+6+1+6+6+1+6+6+1+1 = 52 ✓

const COLOR_TO_INDEX: Record<string, number> = {
  red: 0,
  green: 1,
  yellow: 2,
  blue: 3,
};

export function getCellCoords(playerIndex: number, position: number): [number, number] | null {
  if (position < 0 || position > 57) return null;
  if (position === 57) return null; // center (handled separately)
  
  const startIndices = [0, 13, 26, 39];
  const homeColumns: [number, number][][] = [
    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],   // Red
    [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],   // Green
    [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], // Yellow
    [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], // Blue
  ];
  
  if (position <= 50) {
    const trackIdx = (startIndices[playerIndex] + position) % 52;
    return MAIN_PATH[trackIdx];
  }
  // home column
  return homeColumns[playerIndex][position - 51];
}

export function getTokenCoordinates(color: LudoColor, position: number): { row: number; col: number } | null {
  const pIdx = COLOR_TO_INDEX[color] ?? 0;
  const coords = getCellCoords(pIdx, position);
  if (!coords) return null;
  return { row: coords[0], col: coords[1] };
}

const SAFE_CELLS = new Set([
  '6,1',   // Red start
  '8,2',   // Red safe
  '1,8',   // Green start
  '2,6',   // Green safe
  '8,13',  // Yellow start
  '6,12',  // Yellow safe
  '13,6',  // Blue start
  '12,8',  // Blue safe
]);

export const LUDO_COLORS: Record<string, string> = {
  red: '#E63946',
  green: '#2A9D8F',
  yellow: '#F4A261',
  blue: '#457B9D',
};

export const LudoBoard2D: React.FC<LudoBoard2DProps> = ({
  tokens = [],
  onTokenClick,
  activeColor = 'red',
  movableTokenIds = [],
  theme = 'dark',
  isGameStarted = true,
  isRolling = false,
}) => {
  const getCellColor = (r: number, c: number): string => {
    // Red home column (row 7, cols 1..5) & start track
    if (r === 7 && c >= 1 && c <= 5) return LUDO_COLORS.red;
    if (r === 6 && c === 1) return LUDO_COLORS.red;

    // Green home column (col 7, rows 1..5) & start track
    if (c === 7 && r >= 1 && r <= 5) return LUDO_COLORS.green;
    if (r === 1 && c === 8) return LUDO_COLORS.green;

    // Yellow home column (row 7, cols 9..13) & start track
    if (r === 7 && c >= 9 && c <= 13) return LUDO_COLORS.yellow;
    if (r === 8 && c === 13) return LUDO_COLORS.yellow;

    // Blue home column (col 7, rows 9..13) & start track
    if (c === 7 && r >= 9 && r <= 13) return LUDO_COLORS.blue;
    if (r === 13 && c === 6) return LUDO_COLORS.blue;

    return '#FFFFFF';
  };

  // 4 Corner Homes
  const renderHomeYard = (
    color: LudoColor,
    bgHex: string,
    areaClasses: string
  ) => {
    const yardTokens = isGameStarted
      ? tokens.filter((t) => t.color === color && (t.position === -1 || t.step === -1))
      : [];

    return (
      <div
        className={`absolute p-2.5 sm:p-3 flex flex-col items-center justify-center ${areaClasses}`}
        style={{ backgroundColor: bgHex }}
      >
        <div className="w-full h-full bg-white rounded-xl shadow-inner p-2 grid grid-cols-2 grid-rows-2 gap-2 place-items-center border-2 border-slate-900/10">
          {[0, 1, 2, 3].map((slotIdx) => {
            const token = yardTokens[slotIdx];
            const isMovable = token && movableTokenIds.includes(token.id);

            return (
              <div
                key={slotIdx}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center relative bg-gray-50/70"
              >
                {token && (
                  <button
                    onClick={() => onTokenClick?.(token)}
                    disabled={!isMovable || isRolling}
                    className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${
                      isMovable && !isRolling
                        ? 'animate-bounce cursor-pointer scale-110 ring-2 ring-amber-400'
                        : 'cursor-default'
                    }`}
                    style={{ backgroundColor: bgHex }}
                    title={`${color} token`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white/70" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getCellTokens = (r: number, c: number) => {
    if (!isGameStarted) return [];
    return tokens.filter((t) => {
      if (t.position && typeof t.position === 'object' && 'row' in t.position) {
        return t.position.row === r && t.position.col === c;
      }
      const pos = typeof t.position === 'number' ? t.position : (t.step !== undefined ? t.step : -1);
      if (pos === -1 || pos === 57) return false;
      const coords = getTokenCoordinates(t.color, pos);
      return coords?.row === r && coords?.col === c;
    });
  };

  return (
    <div
      className={`relative w-full max-w-[340px] aspect-square mx-auto select-none transition-opacity duration-300 ${
        isRolling ? 'opacity-70' : 'opacity-100'
      }`}
    >
      {/* 2D Board Surface: 16sp rounded corners and subtle shadow */}
      <div
        className="relative w-full h-full rounded-[16px] overflow-hidden border-[1px] border-[#1A1A2E] shadow-xl bg-white"
        style={{
          boxShadow:
            theme === 'dark'
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 15x15 Track Grid (1dp grid lines) */}
        <div className="grid grid-cols-15 grid-rows-15 w-full h-full">
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => {
              const isRedHome = r < 6 && c < 6;
              const isGreenHome = r < 6 && c > 8;
              const isBlueHome = r > 8 && c < 6;
              const isYellowHome = r > 8 && c > 8;
              const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

              if (isRedHome || isGreenHome || isBlueHome || isYellowHome || isCenter) {
                return <div key={`${r}-${c}`} className="w-full h-full" />;
              }

              const cellBg = getCellColor(r, c);
              const isSafe = SAFE_CELLS.has(`${r},${c}`);
              const cellTokens = getCellTokens(r, c);
              const hasTokens = cellTokens.length > 0;
              const primaryToken = cellTokens[0];
              const isMovable = primaryToken && movableTokenIds.includes(primaryToken.id);

              return (
                <div
                  key={`${r}-${c}`}
                  className="w-full h-full border-[0.5px] border-slate-300 relative flex items-center justify-center"
                  style={{ backgroundColor: cellBg }}
                >
                  {isSafe && !hasTokens && (
                    <Star
                      className="w-2.5 h-2.5 text-gray-500 fill-gray-400 opacity-70"
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Render 24dp circle tokens with white border (2dp) */}
                  {hasTokens && (
                    <div className="relative flex items-center justify-center">
                      <button
                        onClick={() => onTokenClick?.(primaryToken)}
                        disabled={!isMovable || isRolling}
                        className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${
                          isMovable && !isRolling
                            ? 'animate-bounce cursor-pointer ring-2 ring-amber-400 scale-110 z-20'
                            : primaryToken.canBeCaptured
                            ? 'animate-pulse ring-2 ring-[#EF476F] shadow-red-500/50'
                            : primaryToken.canEnterHome
                            ? 'animate-pulse ring-2 ring-[#06D6A0] shadow-emerald-500/50'
                            : 'cursor-default'
                        }`}
                        style={{
                          backgroundColor: LUDO_COLORS[primaryToken.color],
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                      </button>

                      {/* Stacked count badge on top-right */}
                      {cellTokens.length > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#1A1A2E] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white z-30">
                          {cellTokens.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4 Corner Homes */}
        {renderHomeYard('red', LUDO_COLORS.red, 'top-0 left-0 w-[40%] h-[40%]')}
        {renderHomeYard('green', LUDO_COLORS.green, 'top-0 right-0 w-[40%] h-[40%]')}
        {renderHomeYard('blue', LUDO_COLORS.blue, 'bottom-0 left-0 w-[40%] h-[40%]')}
        {renderHomeYard('yellow', LUDO_COLORS.yellow, 'bottom-0 right-0 w-[40%] h-[40%]')}

        {/* Center Win Triangle (4 colored segments) */}
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] border border-slate-900/20 overflow-hidden bg-white shadow-inner">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="0,0 100,0 50,50" fill={LUDO_COLORS.green} />
            <polygon points="100,0 100,100 50,50" fill={LUDO_COLORS.yellow} />
            <polygon points="100,100 0,100 50,50" fill={LUDO_COLORS.blue} />
            <polygon points="0,100 0,0 50,50" fill={LUDO_COLORS.red} />
            <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
            <polygon
              points="50,43 52,48 57,48 53,51 55,56 50,53 45,56 47,51 43,48 48,48"
              fill="#F4A261"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
