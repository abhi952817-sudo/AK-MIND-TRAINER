// src/games/ludo/OctagonalLudoBoard.tsx
// High-fidelity SVG 8-Player Octagonal Ludo Board.
// Matches uploaded image 360_F_350836422_mdQntPiifC84DgymHdfGSdFiqHrkgJLI.jpg.
// Includes step trajectory trail preview, legal move highlights, Start/Stop markers, and 3D tokens.

import React, { useMemo, useState } from 'react';
import {
  OCTAGON_SECTORS,
  OCTAGON_TRACK_LENGTH,
  OCTAGON_WIN_POSITION,
  Point2D,
  getOctagonGeometry,
  getOctagonTokenPosition,
  polarToCartesian,
} from './octagonalBoard';
import {
  OctagonGameState,
  OctagonMoveOption,
  OctagonToken,
  getOctagonStepTrail,
} from './octagonalEngine';

interface OctagonalLudoBoardProps {
  state: OctagonGameState;
  legalMoves: OctagonMoveOption[];
  onTokenClick: (tokenId: string) => void;
  inputLocked?: boolean;
  size?: number;
}

export const OctagonalLudoBoard: React.FC<OctagonalLudoBoardProps> = ({
  state,
  legalMoves,
  onTokenClick,
  inputLocked = false,
  size: sizeProp,
}) => {
  const size = sizeProp ?? Math.min(window.innerWidth - 20, 420);
  const geom = useMemo(() => getOctagonGeometry(800, 800), []);
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  // Legal tokens map
  const legalMoveMap = useMemo(() => {
    const map = new Map<string, OctagonMoveOption>();
    if (!inputLocked) {
      for (const m of legalMoves) {
        map.set(m.tokenId, m);
      }
    }
    return map;
  }, [legalMoves, inputLocked]);

  // Active preview trail: hovered token, or the first legal token if only 1 exists
  const activeTrail = useMemo(() => {
    const activeId = hoveredTokenId ?? (legalMoves.length === 1 ? legalMoves[0]?.tokenId : null);
    if (!activeId) return null;

    const move = legalMoveMap.get(activeId);
    if (!move) return null;

    const token = state.tokens.find((t) => t.id === activeId);
    if (!token) return null;

    const trailPoints = getOctagonStepTrail(token.playerIndex, token.tokenIndex, move.from, move.to, geom);
    return {
      tokenId: activeId,
      points: trailPoints,
      from: move.from,
      to: move.to,
      color: OCTAGON_SECTORS[token.playerIndex]?.color ?? '#0055D4',
      captures: move.captures,
      steps: move.steps,
    };
  }, [hoveredTokenId, legalMoves, legalMoveMap, state.tokens, geom]);

  // Compute 8 outer octagon vertices
  const outerOctagonPoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i < 8; i++) {
      // Rotate by 22.5 deg to have flat edges aligned with arms
      const angle = i * 45 + 22.5;
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
        background: '#B8C2CC', // Classic neutral silver-gray backdrop from image
        boxSizing: 'border-box',
      }}
    >
      <svg
        viewBox="0 0 800 800"
        className="w-full h-full"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Subtle drop shadows */}
          <filter id="oct-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.4" />
          </filter>

          <filter id="token-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ========================================================= */}
        {/* 1. OUTER OCTAGONAL BEVELED FRAME                          */}
        {/* ========================================================= */}
        <polygon
          points={outerOctagonPoints}
          fill="#E2E8F0"
          stroke="#1E293B"
          strokeWidth="6"
          filter="url(#oct-shadow)"
        />

        {/* Outer 3D Bevel Rim Segments */}
        {OCTAGON_SECTORS.map((sec, i) => {
          const a1 = i * 45 - 22.5;
          const a2 = i * 45 + 22.5;
          const p1 = polarToCartesian(geom.cx, geom.cy, geom.outerR, a1);
          const p2 = polarToCartesian(geom.cx, geom.cy, geom.outerR, a2);
          const p3 = polarToCartesian(geom.cx, geom.cy, geom.outerR - 16, a2);
          const p4 = polarToCartesian(geom.cx, geom.cy, geom.outerR - 16, a1);

          return (
            <polygon
              key={`bevel-${i}`}
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
              fill={sec.color}
              stroke="#0F172A"
              strokeWidth="2"
              opacity="0.95"
            />
          );
        })}

        {/* ========================================================= */}
        {/* 2. EIGHT CORNER BASE YARDS (Triangular Wedges)            */}
        {/* ========================================================= */}
        {OCTAGON_SECTORS.map((sec, i) => {
          const a1 = sec.angleDeg;
          const a2 = (sec.angleDeg + 45) % 360;
          const apex = polarToCartesian(geom.cx, geom.cy, geom.trackInnerR + 20, (a1 + a2) / 2);
          const p1 = polarToCartesian(geom.cx, geom.cy, geom.outerR - 18, a1 + 8);
          const p2 = polarToCartesian(geom.cx, geom.cy, geom.outerR - 18, a2 - 8);

          return (
            <g key={`yard-${sec.index}`}>
              {/* Sector Base Yard Wedge Background */}
              <polygon
                points={`${apex.x},${apex.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
                fill={sec.color}
                stroke="#1E293B"
                strokeWidth="3"
                opacity="0.9"
              />

              {/* 4 Inset Square Token Slots */}
              {geom.baseSlots[sec.index].map((slot, sIdx) => (
                <g key={`slot-${sec.index}-${sIdx}`}>
                  <rect
                    x={slot.x - 14}
                    y={slot.y - 14}
                    width={28}
                    height={28}
                    rx={6}
                    fill="#FFFFFF"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                    opacity="0.85"
                  />
                  {/* Subtle inner slot gradient */}
                  <rect
                    x={slot.x - 10}
                    y={slot.y - 10}
                    width={20}
                    height={20}
                    rx={4}
                    fill={sec.color}
                    opacity="0.4"
                  />
                </g>
              ))}
            </g>
          );
        })}

        {/* ========================================================= */}
        {/* 3. EIGHT RADIATING TRACK ARMS (White Cells & Runways)     */}
        {/* ========================================================= */}
        {OCTAGON_SECTORS.map((sec) => {
          return (
            <g key={`arm-${sec.index}`}>
              {/* Home Runway: 5 Colored cells heading to center */}
              {geom.homeRunways[sec.index].map((cellPt, step) => (
                <circle
                  key={`runway-${sec.index}-${step}`}
                  cx={cellPt.x}
                  cy={cellPt.y}
                  r={12}
                  fill={sec.color}
                  stroke="#0F172A"
                  strokeWidth="2"
                />
              ))}

              {/* Numbered Wedge Badge (01..08) */}
              {(() => {
                const badgePt = polarToCartesian(geom.cx, geom.cy, geom.trackInnerR - 14, sec.angleDeg);
                return (
                  <g>
                    <circle
                      cx={badgePt.x}
                      cy={badgePt.y}
                      r={18}
                      fill={sec.color}
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                    <text
                      x={badgePt.x}
                      y={badgePt.y + 5}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="13"
                      fontWeight="900"
                      fontFamily="system-ui, sans-serif"
                    >
                      {sec.label}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* ========================================================= */}
        {/* 4. PERIMETER TRACK CELLS (64 Cells Around Octagon)        */}
        {/* ========================================================= */}
        {geom.trackCells.map((pt, idx) => {
          const secIdx = Math.floor(idx / 8);
          const offset = idx % 8;
          const isStart = offset === 0;
          const isSafe = offset === 4;
          const sec = OCTAGON_SECTORS[secIdx];

          const fill = isStart ? sec.color : isSafe ? '#FEF08A' : '#FFFFFF';

          return (
            <g key={`track-cell-${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={11}
                fill={fill}
                stroke="#0F172A"
                strokeWidth="2"
              />

              {/* Start Arrow Indicator */}
              {isStart && (
                <text
                  x={pt.x}
                  y={pt.y + 3.5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="bold"
                >
                  ▶
                </text>
              )}

              {/* Stop / Safe Star Indicator */}
              {isSafe && (
                <text
                  x={pt.x}
                  y={pt.y + 3.5}
                  textAnchor="middle"
                  fill="#854D0E"
                  fontSize="10"
                  fontWeight="black"
                >
                  ★
                </text>
              )}
            </g>
          );
        })}

        {/* ========================================================= */}
        {/* 5. CENTER VICTORY STAR OCTAGON                            */}
        {/* ========================================================= */}
        {OCTAGON_SECTORS.map((sec, i) => {
          const a1 = i * 45 - 22.5;
          const a2 = i * 45 + 22.5;
          const p1 = polarToCartesian(geom.cx, geom.cy, geom.centerR, a1);
          const p2 = polarToCartesian(geom.cx, geom.cy, geom.centerR, a2);

          return (
            <polygon
              key={`center-pie-${i}`}
              points={`${geom.cx},${geom.cy} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
              fill={sec.color}
              stroke="#0F172A"
              strokeWidth="2"
            />
          );
        })}

        {/* Center Golden Star */}
        <circle cx={geom.cx} cy={geom.cy} r={16} fill="#FFD700" stroke="#0F172A" strokeWidth="2.5" />
        <text
          x={geom.cx}
          y={geom.cy + 5}
          textAnchor="middle"
          fill="#0F172A"
          fontSize="15"
          fontWeight="900"
        >
          👑
        </text>

        {/* ========================================================= */}
        {/* 6. TRAJECTORY PATH PREVIEW TRAIL (Solves "Where is token going?") */}
        {/* ========================================================= */}
        {activeTrail && activeTrail.points.length > 1 && (
          <g className="pointer-events-none">
            {/* Pulsating Destination Landing Ring */}
            {(() => {
              const destPt = activeTrail.points[activeTrail.points.length - 1];
              return (
                <g>
                  <circle
                    cx={destPt.x}
                    cy={destPt.y}
                    r={22}
                    fill={activeTrail.color}
                    opacity="0.35"
                  >
                    <animate attributeName="r" values="16;26;16" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle
                    cx={destPt.x}
                    cy={destPt.y}
                    r={14}
                    fill="none"
                    stroke={activeTrail.color}
                    strokeWidth="3"
                    strokeDasharray="4,3"
                  />
                </g>
              );
            })()}

            {/* Connecting Step Trail Line */}
            <polyline
              points={activeTrail.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            <polyline
              points={activeTrail.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={activeTrail.color}
              strokeWidth="3.5"
              strokeDasharray="6,4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate attributeName="stroke-dashoffset" values="20;0" dur="0.8s" repeatCount="indefinite" />
            </polyline>

            {/* Numbered Step Dots along the Trail */}
            {activeTrail.points.map((pt, stepIdx) => {
              if (stepIdx === 0) return null; // Skip start token position
              return (
                <g key={`trail-step-${stepIdx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={7}
                    fill="#FFFFFF"
                    stroke={activeTrail.color}
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y + 3}
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="7"
                    fontWeight="bold"
                  >
                    {stepIdx}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ========================================================= */}
        {/* 7. TOKENS LAYER                                           */}
        {/* ========================================================= */}
        {state.tokens.map((token) => {
          const pt = getOctagonTokenPosition(token.playerIndex, token.tokenIndex, token.position, geom);
          const isLegal = legalMoveMap.has(token.id);
          const isHovered = hoveredTokenId === token.id;
          const sec = OCTAGON_SECTORS[token.playerIndex];

          return (
            <g
              key={token.id}
              onClick={() => isLegal && onTokenClick(token.id)}
              onMouseEnter={() => setHoveredTokenId(token.id)}
              onMouseLeave={() => setHoveredTokenId(null)}
              className="transition-transform duration-200"
              style={{
                cursor: isLegal ? 'pointer' : 'default',
              }}
            >
              {/* Legal Move Pulsating Halo Ring */}
              {isLegal && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={20}
                  fill={sec.color}
                  opacity="0.4"
                >
                  <animate attributeName="r" values="14;22;14" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1s" repeatCount="indefinite" />
                </circle>
              )}

              {/* 3D Domed Token Body */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={13}
                fill={sec.color}
                stroke={isLegal ? '#FFFFFF' : '#0F172A'}
                strokeWidth={isLegal ? 3 : 2}
                filter="url(#token-glow)"
              />

              {/* Glossy Top Reflection */}
              <circle
                cx={pt.x - 3.5}
                cy={pt.y - 3.5}
                r={5.5}
                fill="#FFFFFF"
                opacity="0.65"
              />

              {/* Center Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={3}
                fill="#FFFFFF"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
