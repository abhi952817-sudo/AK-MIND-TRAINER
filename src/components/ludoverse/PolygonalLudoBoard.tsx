// src/components/ludoverse/PolygonalLudoBoard.tsx
// High-precision SVG board component supporting 4, 5, 6, 8, 9, and 10 player polygonal boards.
// Renders vector track tiles, apex safe stars, player base yards, colored home runways,
// center triumph polygon, interactive tokens with selection halos, and Teammate Shield Blocker indicators.

import React, { useMemo, useState } from 'react';
import {
  BoardPlayerCount,
  getPolygonalBoardGeometry,
  Point2D,
  ComputedBoardGeometry,
  polarToCartesian,
} from '../../games/ludo/polygonalBoardGeometry';
import { Token } from '../../games/ludo/types';
import { TeamMode, getTeamsForMatch, isTeammate } from '../../games/ludo/teamRules';
import { soundEngine } from '../../utils/audio';

export interface MoveOptionLike {
  tokenId: string;
  from: number;
  to: number;
  captures?: string[];
}

interface PolygonalLudoBoardProps {
  playerCount: BoardPlayerCount;
  tokens: Token[];
  activePlayerIndex: number;
  legalMoves: MoveOptionLike[];
  onTokenClick: (tokenId: string) => void;
  teamMode?: TeamMode;
  inputLocked?: boolean;
  size?: number;
}

export const PolygonalLudoBoard: React.FC<PolygonalLudoBoardProps> = ({
  playerCount,
  tokens,
  activePlayerIndex,
  legalMoves,
  onTokenClick,
  teamMode = 'individual',
  inputLocked = false,
  size: sizeProp,
}) => {
  const size = sizeProp ?? Math.min(window.innerWidth - 20, 480);
  const geom: ComputedBoardGeometry = useMemo(
    () => getPolygonalBoardGeometry(playerCount, 800, 800),
    [playerCount]
  );

  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  const legalMoveMap = useMemo(() => {
    const map = new Map<string, MoveOptionLike>();
    if (!inputLocked) {
      for (const m of legalMoves) {
        map.set(m.tokenId, m);
      }
    }
    return map;
  }, [legalMoves, inputLocked]);

  // Map each token to its (x, y) coordinates
  const tokenCoords = useMemo(() => {
    const coords = new Map<string, Point2D>();
    const { config, baseSlots, trackCells, runwayCells, centerTriumph } = geom;

    for (const token of tokens) {
      if (token.position === -1) {
        // Base yard slot
        const slot = baseSlots[token.playerIndex]?.[token.tokenIndex] ?? { x: 400, y: 400 };
        coords.set(token.id, slot);
      } else if (token.position >= 0 && token.position < config.trackLength) {
        // Main track cell
        const startIdx = config.sectors[token.playerIndex]?.startTrackIdx ?? 0;
        const trackIdx = (startIdx + token.position) % config.trackLength;
        const cell = trackCells[trackIdx] ?? { x: 400, y: 400 };
        coords.set(token.id, cell);
      } else if (token.position >= config.trackLength && token.position < config.winPosition) {
        // Home runway
        const runwayIdx = token.position - config.trackLength;
        const cell = runwayCells[token.playerIndex]?.[runwayIdx] ?? { x: 400, y: 400 };
        coords.set(token.id, cell);
      } else {
        // Center Triumph (won)
        const angle = (token.playerIndex * (360 / config.playerCount)) + (token.tokenIndex * 20);
        const winPoint = polarToCartesian(centerTriumph.x, centerTriumph.y, 22, angle);
        coords.set(token.id, winPoint);
      }
    }
    return coords;
  }, [tokens, geom]);

  // Identify track tiles that have Teammate Shield Blockers (2+ tokens of same team)
  const teammateBlockerTiles = useMemo(() => {
    if (teamMode === 'individual') return new Set<number>();
    const blockers = new Set<number>();
    const { config } = geom;

    // Group track tokens by track index and team
    const teams = getTeamsForMatch(playerCount, teamMode);
    const tileTeamCounts = new Map<string, number>();

    for (const t of tokens) {
      if (t.position < 0 || t.position >= config.trackLength) continue;
      const startIdx = config.sectors[t.playerIndex]?.startTrackIdx ?? 0;
      const trackIdx = (startIdx + t.position) % config.trackLength;

      const team = teams.find((tm) => tm.playerIndices.includes(t.playerIndex));
      const teamId = team ? team.teamId : t.playerIndex;
      const key = `${trackIdx}-${teamId}`;

      const curr = (tileTeamCounts.get(key) ?? 0) + 1;
      tileTeamCounts.set(key, curr);
      if (curr >= 2) {
        blockers.add(trackIdx);
      }
    }
    return blockers;
  }, [tokens, geom, teamMode, playerCount]);

  // Compute slight offsets for tokens that share the same tile
  const tokenOffsets = useMemo(() => {
    const counts = new Map<string, number>();
    const offsets = new Map<string, { dx: number; dy: number }>();

    for (const t of tokens) {
      const coord = tokenCoords.get(t.id);
      if (!coord) continue;
      const key = `${Math.round(coord.x)},${Math.round(coord.y)}`;
      const indexAtTile = counts.get(key) ?? 0;
      counts.set(key, indexAtTile + 1);

      if (indexAtTile === 0) {
        offsets.set(t.id, { dx: 0, dy: 0 });
      } else if (indexAtTile === 1) {
        offsets.set(t.id, { dx: 7, dy: -7 });
      } else if (indexAtTile === 2) {
        offsets.set(t.id, { dx: -7, dy: 7 });
      } else {
        offsets.set(t.id, { dx: 7, dy: 7 });
      }
    }
    return offsets;
  }, [tokens, tokenCoords]);

  const handleTokenSelect = (tokenId: string) => {
    if (inputLocked) return;
    if (legalMoveMap.has(tokenId)) {
      soundEngine.playTokenHop();
      onTokenClick(tokenId);
    }
  };

  const { config, cx, cy, trackCells, runwayCells, safeTrackIndices, baseSlots } = geom;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      role="region"
      aria-label={`${playerCount}-Player Polygonal Ludo Board`}
    >
      <svg
        viewBox="0 0 800 800"
        className="w-full h-full drop-shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Radial Board Glow Filter */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Central Triumph Radial Gradient */}
          <radialGradient id="centerTriumphGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="1" />
            <stop offset="70%" stopColor="#0F172A" stopOpacity="1" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* 1. Main Background Polygon */}
        <circle cx="400" cy="400" r="396" fill="#0A0E17" stroke="#1E293B" strokeWidth="6" />

        {/* 2. Polygonal Perimeter Outer Ring */}
        <polygon
          points={Array.from({ length: playerCount })
            .map((_, i) => {
              const pt = polarToCartesian(400, 400, 390, (i * 360) / playerCount);
              return `${pt.x},${pt.y}`;
            })
            .join(' ')}
          fill="#0D1322"
          stroke="#334155"
          strokeWidth="3"
        />

        {/* 3. Base Sector Wedges & Yards */}
        {config.sectors.map((sec, sIdx) => {
          const yardOffsetAngle = 360 / (playerCount * 2);
          const yardAngle = sec.angleDeg + yardOffsetAngle;
          const yardCenter = polarToCartesian(400, 400, playerCount >= 8 ? 288 : 280, yardAngle);
          const yardRadius = playerCount >= 8 ? 44 : 52;

          return (
            <g key={`sector-${sec.label}`}>
              {/* Outer Sector Yard Plate */}
              <circle
                cx={yardCenter.x}
                cy={yardCenter.y}
                r={yardRadius}
                fill={sec.color}
                fillOpacity="0.18"
                stroke={sec.color}
                strokeWidth="2.5"
              />

              {/* Player Number Label Badge */}
              <rect
                x={yardCenter.x - 16}
                y={yardCenter.y - yardRadius - 12}
                width="32"
                height="16"
                rx="4"
                fill={sec.color}
              />
              <text
                x={yardCenter.x}
                y={yardCenter.y - yardRadius - 1}
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="#FFFFFF"
              >
                P{sIdx + 1}
              </text>

              {/* 4 Token Recessed Home Base Wells */}
              {baseSlots[sIdx]?.map((slot, bIdx) => (
                <circle
                  key={`yard-slot-${sIdx}-${bIdx}`}
                  cx={slot.x}
                  cy={slot.y}
                  r={playerCount >= 8 ? 13 : 15}
                  fill="#0B0F19"
                  stroke={sec.color}
                  strokeWidth="2"
                  strokeDasharray="2,2"
                />
              ))}
            </g>
          );
        })}

        {/* 4. Home Runways leading to Center Hub */}
        {runwayCells.map((runway, sIdx) => {
          const sec = config.sectors[sIdx];
          return (
            <g key={`runway-${sIdx}`}>
              {runway.map((cell, rIdx) => (
                <g key={`runway-cell-${sIdx}-${rIdx}`}>
                  <circle
                    cx={cell.x}
                    cy={cell.y}
                    r={playerCount >= 8 ? 12 : 14}
                    fill={sec.color}
                    fillOpacity="0.85"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  {/* Arrow Indicator on Runway */}
                  <polygon
                    points={`${cell.x},${cell.y - 4} ${cell.x + 3},${cell.y + 3} ${cell.x - 3},${cell.y + 3}`}
                    fill="#FFFFFF"
                    opacity="0.9"
                    transform={`rotate(${sec.angleDeg + 90}, ${cell.x}, ${cell.y})`}
                  />
                </g>
              ))}
            </g>
          );
        })}

        {/* 5. Perimeter Track Cells */}
        {trackCells.map((cell, tIdx) => {
          const isSafe = safeTrackIndices.includes(tIdx);
          const isBlocker = teammateBlockerTiles.has(tIdx);
          const rCell = playerCount >= 8 ? 12 : 14;

          return (
            <g key={`track-cell-${tIdx}`}>
              <circle
                cx={cell.x}
                cy={cell.y}
                r={rCell}
                fill={isSafe ? '#1E293B' : '#0F172A'}
                stroke={isSafe ? '#FACC15' : '#334155'}
                strokeWidth={isSafe ? '2.5' : '1.5'}
              />

              {/* Apex Star for Safe Cells */}
              {isSafe && (
                <text
                  x={cell.x}
                  y={cell.y + 4}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#FACC15"
                  fontWeight="bold"
                >
                  ★
                </text>
              )}

              {/* Teammate Shield Blocker Ring Indicator */}
              {isBlocker && (
                <circle
                  cx={cell.x}
                  cy={cell.y}
                  r={rCell + 5}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="3"
                  strokeDasharray="4,3"
                  className="animate-spin"
                  style={{ transformOrigin: `${cell.x}px ${cell.y}px`, animationDuration: '6s' }}
                />
              )}
            </g>
          );
        })}

        {/* 6. Central Triumph Hub */}
        <polygon
          points={Array.from({ length: playerCount })
            .map((_, i) => {
              const pt = polarToCartesian(400, 400, 68, (i * 360) / playerCount);
              return `${pt.x},${pt.y}`;
            })
            .join(' ')}
          fill="url(#centerTriumphGrad)"
          stroke="#FACC15"
          strokeWidth="3.5"
        />
        <circle cx="400" cy="400" r="28" fill="#FACC15" fillOpacity="0.15" />
        <text
          x="400"
          y="405"
          textAnchor="middle"
          fontSize="14"
          fontWeight="900"
          fill="#FACC15"
          letterSpacing="1"
        >
          HOME
        </text>

        {/* 7. Active Tokens Overlay */}
        {tokens.map((token) => {
          const coord = tokenCoords.get(token.id);
          if (!coord) return null;

          const offset = tokenOffsets.get(token.id) ?? { dx: 0, dy: 0 };
          const posX = coord.x + offset.dx;
          const posY = coord.y + offset.dy;
          const isLegal = legalMoveMap.has(token.id);
          const isHovered = hoveredTokenId === token.id;
          const sec = config.sectors[token.playerIndex];
          const tokenColor = sec?.color ?? '#3B82F6';
          const tokenGlow = sec?.glowColor ?? '#60A5FA';
          const rToken = playerCount >= 8 ? 11 : 13;

          return (
            <g
              key={token.id}
              onClick={() => handleTokenSelect(token.id)}
              onMouseEnter={() => setHoveredTokenId(token.id)}
              onMouseLeave={() => setHoveredTokenId(null)}
              className={isLegal ? 'cursor-pointer' : 'cursor-default'}
            >
              {/* Pulsing Selection Halo for Movable Tokens */}
              {isLegal && (
                <circle
                  cx={posX}
                  cy={posY}
                  r={rToken + 7}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray="4,3"
                  className="animate-spin"
                  style={{ transformOrigin: `${posX}px ${posY}px`, animationDuration: '4s' }}
                />
              )}

              {/* Token Drop Shadow */}
              <circle cx={posX} cy={posY + 3} r={rToken} fill="#000000" fillOpacity="0.5" />

              {/* Main Token Body */}
              <circle
                cx={posX}
                cy={posY}
                r={rToken}
                fill={tokenColor}
                stroke={isLegal ? '#FFFFFF' : '#0B0F19'}
                strokeWidth={isLegal ? '2.5' : '1.5'}
                filter={isLegal || isHovered ? 'url(#neonGlow)' : undefined}
              />

              {/* Token Crown / Core Ring */}
              <circle cx={posX} cy={posY} r={rToken * 0.55} fill="#FFFFFF" fillOpacity="0.3" />
              <circle cx={posX} cy={posY} r={rToken * 0.28} fill="#FFFFFF" />

              {/* Player Index Subscript */}
              <text
                x={posX}
                y={posY + 3}
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fill="#0F172A"
              >
                {token.playerIndex + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
