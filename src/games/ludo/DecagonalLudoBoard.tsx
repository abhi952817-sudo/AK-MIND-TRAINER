// src/games/ludo/DecagonalLudoBoard.tsx
// High-fidelity SVG 10-Player Decagonal Ludo Board.
// Supports 10 sectors (01 to 10), 80-track perimeter, step trails, and responsive SVG scaling.

import React, { useMemo, useState } from 'react';
import {
  DECAGON_SECTORS,
  DECAGON_TRACK_LENGTH,
  DECAGON_WIN_POSITION,
  getDecagonGeometry,
  getDecagonTokenPosition,
} from './decagonalBoard';
import {
  DecagonGameState,
  DecagonMoveOption,
  getDecagonStepTrail,
} from './decagonalEngine';
import { Point2D, polarToCartesian } from './octagonalBoard';

interface DecagonalLudoBoardProps {
  state: DecagonGameState;
  legalMoves: DecagonMoveOption[];
  onTokenClick: (tokenId: string) => void;
  inputLocked?: boolean;
  size?: number;
}

export const DecagonalLudoBoard: React.FC<DecagonalLudoBoardProps> = ({
  state,
  legalMoves,
  onTokenClick,
  inputLocked = false,
  size: sizeProp,
}) => {
  const size = sizeProp ?? Math.min(window.innerWidth - 20, 420);
  const geom = useMemo(() => getDecagonGeometry(800, 800), []);
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  const legalMoveMap = useMemo(() => {
    const map = new Map<string, DecagonMoveOption>();
    if (!inputLocked) {
      for (const m of legalMoves) {
        map.set(m.tokenId, m);
      }
    }
    return map;
  }, [legalMoves, inputLocked]);

  const activeTrail = useMemo(() => {
    const activeId = hoveredTokenId ?? (legalMoves.length === 1 ? legalMoves[0]?.tokenId : null);
    if (!activeId) return null;

    const move = legalMoveMap.get(activeId);
    if (!move) return null;

    const token = state.tokens.find((t) => t.id === activeId);
    if (!token) return null;

    const trailPoints = getDecagonStepTrail(token.playerIndex, token.tokenIndex, move.from, move.to, geom);
    return {
      tokenId: activeId,
      points: trailPoints,
      from: move.from,
      to: move.to,
      color: DECAGON_SECTORS[token.playerIndex]?.color ?? '#0055D4',
      captures: move.captures,
      steps: move.steps,
    };
  }, [hoveredTokenId, legalMoves, legalMoveMap, state.tokens, geom]);

  // Compute 10 outer polygon vertices
  const outerDecagonPoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = i * 36 + 18;
      const pt = polarToCartesian(geom.cx, geom.cy, geom.outerR, angle);
      pts.push(`${pt.x},${pt.y}`);
    }
    return pts.join(' ');
  }, [geom]);

  return (
    <div
      className="relative select-none flex items-center justify-center rounded-[20px] shadow-[0_16px_44px_rgba(0,0,0,0.7)] overflow-hidden"
      style={{
        width: size,
        height: size,
        background: '#0F172A',
        boxSizing: 'border-box',
      }}
    >
      <svg viewBox="0 0 800 800" className="w-full h-full">
        <defs>
          <radialGradient id="decagonBgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="85%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#090D16" />
          </radialGradient>
          <filter id="tokenShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Outer boundary polygon */}
        <polygon
          points={outerDecagonPoints}
          fill="url(#decagonBgGlow)"
          stroke="#334155"
          strokeWidth="6"
        />

        {/* 10 Arms & Base Yards */}
        {DECAGON_SECTORS.map((sec) => {
          const yardCenter = polarToCartesian(geom.cx, geom.cy, geom.baseR * 0.95, sec.angleDeg + 18);
          return (
            <g key={`sec-${sec.index}`}>
              {/* Sector Base Yard Circle */}
              <circle
                cx={yardCenter.x}
                cy={yardCenter.y}
                r="30"
                fill={`${sec.color}22`}
                stroke={sec.color}
                strokeWidth="2.5"
              />
              <text
                x={yardCenter.x}
                y={yardCenter.y - 14}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={sec.color}
                fontFamily="sans-serif"
              >
                {sec.label}
              </text>
            </g>
          );
        })}

        {/* 10 Home Runways */}
        {DECAGON_SECTORS.map((sec) => {
          const runwayCells = geom.homeRunways[sec.index] ?? [];
          return (
            <g key={`runway-${sec.index}`}>
              {runwayCells.map((pt, i) => (
                <circle
                  key={`runway-cell-${sec.index}-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="10"
                  fill={sec.color}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  opacity="0.85"
                />
              ))}
            </g>
          );
        })}

        {/* 80 Perimeter Track Cells */}
        {geom.trackCells.map((pt, idx) => {
          const isSafe = idx % 8 === 0 || idx % 8 === 4;
          const secIdx = Math.floor(idx / 8);
          const sec = DECAGON_SECTORS[secIdx];
          const isStart = idx % 8 === 0;

          return (
            <g key={`track-${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSafe ? 11 : 9}
                fill={isStart ? (sec?.color ?? '#FFFFFF') : isSafe ? '#FEF08A' : '#1E293B'}
                stroke={isSafe ? '#EAB308' : '#475569'}
                strokeWidth={isSafe ? 2 : 1.2}
              />
              {isSafe && (
                <text
                  x={pt.x}
                  y={pt.y + 3.5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill="#854D0E"
                >
                  ★
                </text>
              )}
            </g>
          );
        })}

        {/* Center Triumph Star */}
        <circle
          cx={geom.cx}
          cy={geom.cy}
          r={geom.centerR * 0.9}
          fill="#F59E0B"
          stroke="#FEF3C7"
          strokeWidth="3"
        />
        <text
          x={geom.cx}
          y={geom.cy + 4}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#78350F"
        >
          👑
        </text>

        {/* Step Trail Preview */}
        {activeTrail && activeTrail.points.length > 1 && (
          <g>
            <polyline
              points={activeTrail.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={activeTrail.color}
              strokeWidth="4"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
            {activeTrail.points.map((p, idx) => (
              <circle
                key={`trail-pt-${idx}`}
                cx={p.x}
                cy={p.y}
                r={idx === activeTrail.points.length - 1 ? 7 : 3}
                fill={idx === activeTrail.points.length - 1 ? '#22C55E' : activeTrail.color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}

        {/* Tokens */}
        {state.tokens.map((token) => {
          const pt = getDecagonTokenPosition(token.playerIndex, token.tokenIndex, token.position, geom);
          const isLegal = legalMoveMap.has(token.id);
          const isActivePlayer = token.playerIndex === state.activePlayerIndex;
          const sec = DECAGON_SECTORS[token.playerIndex];

          return (
            <g
              key={token.id}
              onClick={() => {
                if (isLegal && !inputLocked) {
                  onTokenClick(token.id);
                }
              }}
              onMouseEnter={() => setHoveredTokenId(token.id)}
              onMouseLeave={() => setHoveredTokenId(null)}
              className={isLegal && !inputLocked ? 'cursor-pointer' : ''}
              filter="url(#tokenShadow)"
            >
              {isLegal && !inputLocked && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="18"
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="animate-spin"
                  style={{ transformOrigin: `${pt.x}px ${pt.y}px`, animationDuration: '3s' }}
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="12"
                fill={sec?.color ?? token.color}
                stroke="#FFFFFF"
                strokeWidth={isActivePlayer ? '2.5' : '1.5'}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill={`${sec?.secondaryColor ?? '#FFF'}55`}
              />
              <text
                x={pt.x}
                y={pt.y + 3}
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="#FFFFFF"
              >
                {token.tokenIndex + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
