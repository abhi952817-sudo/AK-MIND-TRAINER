// src/games/ludo/LudoToken.tsx
// Single Ludo token. 3D domed acrylic pawn with smooth coordinate animations.

import React, { useEffect, useRef, useState } from 'react';
import { PLAYER_COLORS } from '../../types/ludoverse';
import { Token } from './types';
import {
  baseSlotCoords,
  positionToCoords,
} from './board';
import { soundEngine } from '../../utils/audio';
import { haptics } from '../../utils/haptics';

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
  const [isHopping, setIsHopping] = useState(false);

  const prevPos = useRef(token.position);
  const animTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any pending step animations
    animTimeoutsRef.current.forEach(clearTimeout);
    animTimeoutsRef.current = [];

    const from = prevPos.current;
    const to = token.position;

    if (from === to) return;
    prevPos.current = to;

    // Case 1: Yard release (-1 -> 0)
    if (from === -1 && to === 0) {
      soundEngine.playTokenRelease();
      haptics.tokenMove();
      setIsHopping(true);
      const hopOff = setTimeout(() => setIsHopping(false), 220);
      animTimeoutsRef.current.push(hopOff);

      const next = positionToCoords(token.playerIndex, 0) ?? [7, 7];
      setCoords(next);
      return;
    }

    // Case 2: Captured and returned to yard (>= 0 -> -1)
    if (from >= 0 && to === -1) {
      soundEngine.playCapture();
      soundEngine.playReturnToBase();
      haptics.tokenCapture();
      const baseCoords = baseSlotCoords(token.playerIndex, token.tokenIndex);
      setCoords(baseCoords);
      return;
    }

    // Case 3: Box-by-box sequential movement along track (from -> to)
    if (from >= 0 && to > from) {
      const steps: number[] = [];
      for (let s = from + 1; s <= to; s++) {
        steps.push(s);
      }

      const STEP_INTERVAL_MS = 140;

      steps.forEach((stepPos, index) => {
        const stepTimer = setTimeout(() => {
          const stepCoords = positionToCoords(token.playerIndex, stepPos) ?? [7, 7];
          setCoords(stepCoords);
          setIsHopping(true);

          const hopDown = setTimeout(() => setIsHopping(false), STEP_INTERVAL_MS * 0.6);
          animTimeoutsRef.current.push(hopDown);

          soundEngine.playTokenHop();
          haptics.tokenMove();

          if (stepPos === 51) {
            soundEngine.playHomeEntry();
          }

          // On final step of sequence:
          if (index === steps.length - 1) {
            if (isSafe) {
              soundEngine.playSafeChime();
            } else if (to === 57) {
              soundEngine.playTokenFinish();
              haptics.tokenHome();
            } else {
              soundEngine.playTokenLand();
            }
          }
        }, index * STEP_INTERVAL_MS);

        animTimeoutsRef.current.push(stepTimer);
      });
      return;
    }

    // Fallback direct coordinate sync
    const next: [number, number] =
      token.position === -1
        ? baseSlotCoords(token.playerIndex, token.tokenIndex)
        : positionToCoords(token.playerIndex, token.position) ?? [7, 7];
    setCoords(next);

    return () => {
      animTimeoutsRef.current.forEach(clearTimeout);
      animTimeoutsRef.current = [];
    };
  }, [token.position, token.playerIndex, token.tokenIndex, isSafe]);

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
      className="absolute rounded-full flex items-center justify-center focus:outline-none"
      style={{
        width: size,
        height: size,
        left,
        top,
        transform: isHopping ? 'scale(1.22) translateY(-4px)' : 'scale(1) translateY(0px)',
        transition: isHopping
          ? 'left 120ms ease-out, top 120ms ease-out, transform 80ms ease-out'
          : 'left 140ms ease-in-out, top 140ms ease-in-out, transform 100ms ease-in',
        background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 45%, #000000 130%)`,
        border: isSelected
          ? '2.5px solid #FFFFFF'
          : isMovable
          ? '2.5px solid #FFFFFF'
          : '2px solid rgba(0, 0, 0, 0.45)',
        boxShadow: isHopping
          ? `0 10px 18px rgba(0,0,0,0.65), 0 0 16px ${color}`
          : isSelected
          ? `0 0 0 4px ${color}, 0 6px 14px rgba(0,0,0,0.6)`
          : isMovable
          ? `0 0 0 3px #FFFFFF, 0 0 12px ${color}, 0 4px 10px rgba(0,0,0,0.5)`
          : '0 3px 6px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.6)',
        cursor: isMovable ? 'pointer' : 'default',
        zIndex: isHopping ? 50 : isSelected ? 40 : isMovable ? 35 : 20 + stackIndex,
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
