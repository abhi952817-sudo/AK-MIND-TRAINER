// src/games/ludo/HexagonalLudoBoard.tsx
// High-fidelity SVG 6-Player Hexagonal Ludo Board.
// Supports 6 colored sectors (01 to 06), 48 perimeter cells, live step trail, and interactive tokens.

import React, { useMemo, useState } from 'react';
import {
  HEXAGON_SECTORS,
  HEXAGON_TRACK_LENGTH,
  HEXAGON_WIN_POSITION,
  getHexagonGeometry,
  getHexagonTokenPosition,
} from './hexagonalBoard';
import {
  HexagonGameState,
  HexagonMoveOption,
  getHexagonStepTrail,
} from './hexagonalEngine';
import { Point2D, polarToCartesian } from './octagonalBoard';

interface HexagonalLudoBoardProps {
  state: HexagonGameState;
  legalMoves: HexagonMoveOption[];
  onTokenClick: (tokenId: string) => void;
  inputLocked?: boolean;
  size?: number;
}

export const HexagonalLudoBoard: React.FC<HexagonalLudoBoardProps> = ({
  state,
  legalMoves,
  onTokenClick,
  inputLocked = false,
  size: sizeProp,
}) => {
  const size = sizeProp ?? Math.min(window.innerWidth - 20, 420);
  const geom = useMemo(() => getHexagonGeometry(800, 800), []);
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  const legalMoveMap = useMemo(() => {
    const map = new Map<string, HexagonMoveOption>();
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

    const trailPoints = getHexagonStepTrail(token.playerIndex, token.tokenIndex, move.from, move.to, geom);
    return {
      tokenId: activeId,
      points: trailPoints,
      from: move.from,
      to: move.to,
      color: HEXAGON_SECTORS[token.playerIndex]?.color ?? '#0055D4',
      captures: move.captures,
      steps: move.steps,
    };
  }, [hoveredTokenId, legalMoves, legalMoveMap, state.tokens, geom]);

  // Compute 6 outer polygon vertices
  const outerHexagonPoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = i * 60 + 30;
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
          <radialGradient id="hexBgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="85%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#080C14" />
          </radialGradient>
          <filter id="hexTokenShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Outer boundary polygon */}
        <polygon
          points={outerHexagonPoints}
          fill="url(#hexBgGlow)"
          stroke="#334155"
          strokeWidth="6"
        />

        {/* 6 Base Yards */}
        {HEXAGON_SECTORS.map((sec) => {
          const yardCenter = polarToCartesian(geom.cx, geom.cy, geom.baseR * 0.95, sec.angleDeg + 30);
          return (
            <g key={`hex-sec-${sec.index}`}>
              <circle
                cx={yardCenter.x}
                cy={yardCenter.y}
                r="36"
                fill={`${sec.color}22`}
                stroke={sec.color}
                strokeWidth="2.5"
              />
              <text
                x={yardCenter.x}
                y={yardCenter.y - 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill={sec.color}
                fontFamily="sans-serif"
              >
                {sec.label}
              </text>
            </g>
          );
        })}

        {/* 6 Home Runways */}
        {HEXAGON_SECTORS.map((sec) => {
          const runwayCells = geom.homeRunways[sec.index] ?? [];
          return (
            <g key={`hex-runway-${sec.index}`}>
              {runwayCells.map((pt, i) => (
                <circle
                  key={`hex-runway-cell-${sec.index}-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="12"
                  fill={sec.color}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  opacity="0.88"
                />
              ))}
            </g>
          );
        })}

        {/* 48 Perimeter Track Cells */}
        {geom.trackCells.map((pt, idx) => {
          const isSafe = idx % 8 === 0 || idx % 8 === 4;
          const secIdx = Math.floor(idx / 8);
          const sec = HEXAGON_SECTORS[secIdx];
          const isStart = idx % 8 === 0;

          return (
            <g key={`hex-track-${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSafe ? 13 : 11}
                fill={isStart ? (sec?.color ?? '#FFFFFF') : isSafe ? '#FEF08A' : '#1E293B'}
                stroke={isSafe ? '#EAB308' : '#475569'}
                strokeWidth={isSafe ? 2.5 : 1.5}
              />
              {isSafe && (
                <text
                  x={pt.x}
                  y={pt.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#854D0E"
                >
                  ★
                </text>
              )}
            </g>
          );
        })}

        {/* Center Triumph Crown */}
        <circle
          cx={geom.cx}
          cy={geom.cy}
          r={geom.centerR}
          fill="#F59E0B"
          stroke="#FEF3C7"
          strokeWidth="3.5"
        />
        <text
          x={geom.cx}
          y={geom.cy + 5}
          textAnchor="middle"
          fontSize="16"
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
              strokeWidth="4.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
            {activeTrail.points.map((p, idx) => (
              <circle
                key={`hex-trail-pt-${idx}`}
                cx={p.x}
                cy={p.y}
                r={idx === activeTrail.points.length - 1 ? 8 : 3.5}
                fill={idx === activeTrail.points.length - 1 ? '#22C55E' : activeTrail.color}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}

        {/* Tokens */}
        {state.tokens.map((token) => {
          const pt = getHexagonTokenPosition(token.playerIndex, token.tokenIndex, token.position, geom);
          const isLegal = legalMoveMap.has(token.id);
          const isActivePlayer = token.playerIndex === state.activePlayerIndex;
          const sec = HEXAGON_SECTORS[token.playerIndex];

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
              filter="url(#hexTokenShadow)"
            >
              {isLegal && !inputLocked && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="20"
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
                r="13"
                fill={sec?.color ?? token.color}
                stroke="#FFFFFF"
                strokeWidth={isActivePlayer ? '2.5' : '1.5'}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="8"
                fill={`${sec?.secondaryColor ?? '#FFF'}55`}
              />
              <text
                x={pt.x}
                y={pt.y + 3.5}
                textAnchor="middle"
                fontSize="9"
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
