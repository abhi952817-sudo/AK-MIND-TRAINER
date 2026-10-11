import React, { useState } from 'react';
import { COLORS, StateMode, ScreenStateMode } from '../../types/ludoverse';
import { Skeleton, ConfirmDialog } from './UIComponents';
import { Dice3DCube } from './Dice3DCube';

// Snakes: key = head cell, value = tail cell
const SNAKES: Record<number, number> = {
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78,
};
// Ladders: key = bottom cell, value = top cell
const LADDERS: Record<number, number> = {
  3: 22, 5: 8, 11: 26, 20: 29, 27: 56, 36: 44, 51: 67, 71: 92, 80: 99,
};

export const SnakesLaddersScreen: React.FC<{
  state?: StateMode | ScreenStateMode;
  stateMode?: StateMode | ScreenStateMode;
  onQuit?: () => void;
  onBack?: () => void;
  onWinner?: () => void;
}> = ({ state, stateMode, onQuit, onBack, onWinner = () => {} }) => {
  const [positions, setPositions] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmQuit, setConfirmQuit] = useState(false);

  const currentState = String(state || stateMode || 'data').toLowerCase();
  const handleQuit = onQuit || onBack || (() => {});

  const cellPos = (n: number) => {
    if (n === 0) return null;
    const row = Math.floor((n - 1) / 10);
    const isReversed = row % 2 === 1;
    const col = isReversed ? 9 - ((n - 1) % 10) : (n - 1) % 10;
    // Bottom row = row 0 is at bottom (visually)
    return { row: 9 - row, col };
  };

  const onWinnerRef = React.useRef(onWinner);
  React.useEffect(() => {
    onWinnerRef.current = onWinner;
  }, [onWinner]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setMessage('');

    setTimeout(() => {
      const v = 1 + Math.floor(Math.random() * 6);
      setDice(v);
      setRolling(false);

      setPositions((p) => {
        const cur = p[turn];
        let next = cur + v;

        if (cur === 0 && v !== 6) {
          setMessage(`Player ${turn + 1} needs a 6 to start`);
          setTimeout(() => setTurn((t) => (t + 1) % 2), 900);
          return p;
        }

        if (next > 100) {
          setMessage(`Overshoot — Player ${turn + 1} stays`);
          setTimeout(() => setTurn((t) => (t + 1) % 2), 900);
          return p;
        }

        if (SNAKES[next]) {
          setMessage(`🐍 Snake! Down to ${SNAKES[next]}`);
          next = SNAKES[next];
        } else if (LADDERS[next]) {
          setMessage(`🪜 Ladder! Up to ${LADDERS[next]}`);
          next = LADDERS[next];
        }

        const np: [number, number] = [...p] as [number, number];
        np[turn] = next;
        return np;
      });
    }, 1400);
  };

  // Separate effect for turn passing (after message shown) and win check
  React.useEffect(() => {
    const cur = positions[turn];
    if (cur === 100) {
      setTimeout(() => onWinnerRef.current(), 600);
      return;
    }
    // Pass turn only if dice is done and no bonus
    const t = setTimeout(() => {
      if (!rolling && positions[turn] !== 100) {
        // 6 = extra turn, snake/ladder handled by message
        if (dice !== 6 && positions[turn] !== 0) {
          setTurn((tt) => (tt + 1) % 2);
        }
      }
    }, 1600);
    return () => clearTimeout(t);
  }, [positions, turn, rolling, dice]);

  if (currentState === 'loading') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6" style={{ background: COLORS.bgDark }}>
        <Skeleton w="340px" h="340px" radius={16} />
        <Skeleton w="60px" h="60px" radius={12} />
      </div>
    );
  }

  const boardSize = typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 340) : 340;
  const cellSize = boardSize / 10;

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: COLORS.bgDark }}>
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <button onClick={() => setConfirmQuit(true)} className="text-2xl text-white">←</button>
        <span className="font-semibold text-white">Snakes & Ladders</span>
        <span className="text-xs" style={{ color: COLORS.textSecondary }}>
          Turn: P{turn + 1}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center px-2">
        <div className="relative shadow-2xl rounded-xl overflow-hidden border border-white/10" style={{ width: boardSize, height: boardSize }}>
          {/* Cells */}
          {Array.from({ length: 100 }).map((_, idx) => {
            const n = 100 - idx;
            const row = Math.floor((n - 1) / 10);
            const isReversed = row % 2 === 1;
            const col = isReversed ? 9 - ((n - 1) % 10) : (n - 1) % 10;
            const isEven = (row + col) % 2 === 0;
            return (
              <div
                key={n}
                className="absolute flex items-center justify-center text-[9px] font-semibold"
                style={{
                  left: col * cellSize,
                  top: (9 - row) * cellSize,
                  width: cellSize,
                  height: cellSize,
                  background: isEven ? '#1c1c30' : '#242440',
                  color: COLORS.textSecondary,
                  border: '0.5px solid #8D99AE22',
                }}
              >
                {n}
              </div>
            );
          })}

          {/* Snakes & Ladders overlay */}
          <svg className="absolute inset-0 pointer-events-none" width={boardSize} height={boardSize}>
            {Object.entries(LADDERS).map(([b, t]) => {
              const from = cellPos(Number(b))!;
              const to = cellPos(Number(t))!;
              return (
                <line
                  key={`L${b}`}
                  x1={(from.col + 0.5) * cellSize}
                  y1={(from.row + 0.5) * cellSize}
                  x2={(to.col + 0.5) * cellSize}
                  y2={(to.row + 0.5) * cellSize}
                  stroke={COLORS.success}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              );
            })}
            {Object.entries(SNAKES).map(([h, t]) => {
              const from = cellPos(Number(h))!;
              const to = cellPos(Number(t))!;
              return (
                <path
                  key={`S${h}`}
                  d={`M ${(from.col + 0.5) * cellSize} ${(from.row + 0.5) * cellSize} Q ${((from.col + to.col) / 2 + 0.5) * cellSize} ${((from.row + to.row) / 2 + 0.5) * cellSize - 20} ${(to.col + 0.5) * cellSize} ${(to.row + 0.5) * cellSize}`}
                  fill="none"
                  stroke={COLORS.error}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              );
            })}
          </svg>

          {/* Tokens */}
          {[0, 1].map((pIdx) => {
            const p = positions[pIdx];
            if (p === 0) {
              // Show at start (bottom-left, cell 1)
              const c = cellPos(1)!;
              return (
                <div
                  key={pIdx}
                  className="absolute rounded-full border-2"
                  style={{
                    left: c.col * cellSize + (pIdx === 0 ? 2 : 2),
                    top: c.row * cellSize + (pIdx === 0 ? 2 : 2),
                    width: cellSize * 0.4,
                    height: cellSize * 0.4,
                    background: pIdx === 0 ? COLORS.red : COLORS.green,
                    borderColor: '#fff',
                  }}
                />
              );
            }
            const c = cellPos(p)!;
            return (
              <div
                key={pIdx}
                className="absolute rounded-full border-2"
                style={{
                  left: c.col * cellSize + cellSize * 0.15,
                  top: c.row * cellSize + (pIdx === 0 ? cellSize * 0.15 : cellSize * 0.45),
                  width: cellSize * 0.4,
                  height: cellSize * 0.4,
                  background: pIdx === 0 ? COLORS.red : COLORS.green,
                  borderColor: '#fff',
                  transition: 'left .35s ease, top .35s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="text-center min-h-[20px] mb-2 px-4">
        {message && <p className="text-xs" style={{ color: COLORS.yellow }}>{message}</p>}
      </div>

      <div className="flex items-center justify-between px-6 pb-6 shrink-0">
        <div className="text-xs" style={{ color: COLORS.textSecondary }}>
          P1: {positions[0] === 0 ? 'Start' : positions[0]} · P2: {positions[1] === 0 ? 'Start' : positions[1]}
        </div>
        <Dice3DCube value={dice} rolling={rolling} onRoll={roll} />
        <div className="text-xs font-semibold" style={{ color: turn === 0 ? COLORS.red : COLORS.green }}>
          P{turn + 1}
        </div>
      </div>

      <ConfirmDialog
        open={confirmQuit}
        title="Quit game?"
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => { setConfirmQuit(false); handleQuit(); }}
        destructive
      />
    </div>
  );
};

export default SnakesLaddersScreen;
