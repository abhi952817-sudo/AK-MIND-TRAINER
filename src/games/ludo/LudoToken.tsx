// src/games/ludo/LudoToken.tsx
// Single Ludo token. 3D domed acrylic pawn with smooth coordinate animations.

import React, { useEffect, useRef, useState } from 'react';
import { PLAYER_COLORS } from '../../types/ludoverse';
import { Token } from './types';
import {
  baseSlotCoords,
  positionToCoords,
} from './board';

interface LudoTokenProps {
  token: Token;
  cellSize: number;
  isMovable: boolean;       // is this token a legal move target right now?
  isSelected: boolean;
  isCapturable: boolean;    // pulse red — an opponent can capture it next turn
  isSafe: boolean;          // glow green — currently on a safe cell
  onClick: (tokenId: string) => void;
  stackIndex?: number;
  totalStacked?: number;
}

export const LudoToken: React.FC<LudoTokenProps> = ({
  token,
  cellSize,
  isMovable,
  isSelected,
  isCapturable,
  isSafe,
  onClick,
  stackIndex = 0,
  totalStacked = 1,
}) => {
  const [coords, setCoords] = useState<[number, number]>(() =>
    token.position === -1
      ? baseSlotCoords(token.playerIndex, token.tokenIndex)
      : positionToCoords(token.playerIndex, token.position) ?? [7, 7]
  );

  const prevPos = useRef(token.position);

  useEffect(() => {
    if (prevPos.current === token.position) return;
    prevPos.current = token.position;

    const next: [number, number] =
      token.position === -1
        ? baseSlotCoords(token.playerIndex, token.tokenIndex)
        : positionToCoords(token.playerIndex, token.position) ?? [7, 7];

    setCoords(next);
  }, [token.position, token.playerIndex, token.tokenIndex]);

  const size = cellSize * 0.76;
  const offset = (cellSize - size) / 2;

  // Stacking offset when multiple tokens share the same track cell
  let stackOffsetX = 0;
  let stackOffsetY = 0;
  if (totalStacked > 1 && token.position >= 0 && token.position !== 57) {
    const angle = (stackIndex / totalStacked) * 2 * Math.PI;
    const r = cellSize * 0.16;
    stackOffsetX = Math.cos(angle) * r;
    stackOffsetY = Math.sin(angle) * r;
  }

  // Center of board (won position) gets a fan-out offset per token
  const wonOffset =
    token.position === 57 ? (token.tokenIndex - 1.5) * (cellSize * 0.22) : 0;

  const left = coords[1] * cellSize + offset + stackOffsetX + wonOffset;
  const top = coords[0] * cellSize + offset + stackOffsetY;

  const color = PLAYER_COLORS[token.color] || '#006CA5';

  return (
    <button
      type="button"
      onClick={() => isMovable && onClick(token.id)}
      className="absolute rounded-full transition-all duration-[260ms] ease-out flex items-center justify-center focus:outline-none"
      style={{
        width: size,
        height: size,
        left,
        top,
        background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 45%, #000000 130%)`,
        border: isSelected
          ? '2.5px solid #FFFFFF'
          : isMovable
          ? '2.5px solid #FFFFFF'
          : '2px solid rgba(0, 0, 0, 0.45)',
        boxShadow: isSelected
          ? `0 0 0 4px ${color}, 0 6px 14px rgba(0,0,0,0.6)`
          : isMovable
          ? `0 0 0 3px #FFFFFF, 0 0 12px ${color}, 0 4px 10px rgba(0,0,0,0.5)`
          : '0 3px 6px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.6)',
        cursor: isMovable ? 'pointer' : 'default',
        zIndex: isSelected ? 40 : isMovable ? 35 : 20 + stackIndex,
        animation: isMovable
          ? 'token-pulse 1.1s ease-in-out infinite'
          : isCapturable
          ? 'token-danger 1.1s ease-in-out infinite'
          : isSafe
          ? 'token-safe 2s ease-in-out infinite'
          : undefined,
        pointerEvents: isMovable ? 'auto' : 'none',
      }}
      aria-label={`Token ${token.id}`}
    >
      {/* 3D Inner Dome Ring */}
      <span
        className="rounded-full pointer-events-none"
        style={{
          width: size * 0.52,
          height: size * 0.52,
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)`,
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
};
