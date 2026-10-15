// src/games/ludo/useHexagonalLudo.ts
// Hook managing game loop, bot turns, audio triggers, and timer for 6-Player Hexagonal Ludo.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HexagonGameState,
  HexagonMoveOption,
  HexagonPlayer,
  applyHexagonMove,
  createHexagonInitialState,
  getHexagonLegalMoves,
} from './hexagonalEngine';
import { soundEngine } from '../../utils/audio';

export interface UseHexagonalLudoOptions {
  autoPlayBots?: boolean;
}

export function useHexagonalLudo(
  players: HexagonPlayer[],
  options: UseHexagonalLudoOptions = {},
  humanId?: string
) {
  const { autoPlayBots = true } = options;

  const [state, setState] = useState<HexagonGameState>(() =>
    createHexagonInitialState(players)
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const [timeLeft, setTimeLeft] = useState(30);
  const botLock = useRef(false);
  const rollLock = useRef(false);

  // Turn timer
  useEffect(() => {
    if (state.phase === 'ended') return;
    const iv = setInterval(() => {
      setTimeLeft((t) => (t > 1 ? t - 1 : 30));
    }, 1000);
    return () => clearInterval(iv);
  }, [state.phase]);

  useEffect(() => {
    setTimeLeft(30);
  }, [state.activePlayerIndex]);

  const activePlayer = useMemo(
    () => state.players.find((p) => p.sectorIndex === state.activePlayerIndex) ?? state.players[0],
    [state.players, state.activePlayerIndex]
  );

  const isHumanTurn = useMemo(() => {
    if (!humanId) return true;
    return activePlayer?.id === humanId;
  }, [activePlayer, humanId]);

  // Core Roll action
  const performRoll = useCallback(async (forBot: boolean) => {
    if (rollLock.current) return;
    const s = stateRef.current;
    if (s.phase !== 'waiting' || s.winner !== null) return;

    rollLock.current = true;
    soundEngine.playDiceRattle();
    setState((prev) => ({ ...prev, phase: 'rolling' }));

    await new Promise((r) => setTimeout(r, 700));

    const rollVal = 1 + Math.floor(Math.random() * 6);
    soundEngine.playDiceLand();
    if (rollVal === 6) {
      soundEngine.playDiceSixBonus();
    }

    let consecutive = stateRef.current.consecutiveSixes;
    if (rollVal === 6) consecutive++;
    else consecutive = 0;

    let next: HexagonGameState = {
      ...stateRef.current,
      diceValue: rollVal,
      consecutiveSixes: consecutive,
      phase: 'selecting',
    };

    if (consecutive === 3 && rollVal === 6) {
      await new Promise((r) => setTimeout(r, 400));
      const currentRosterIdx = next.players.findIndex((p) => p.sectorIndex === next.activePlayerIndex);
      const nextRosterIdx = (currentRosterIdx + 1) % next.players.length;
      next = {
        ...next,
        activePlayerIndex: next.players[nextRosterIdx]?.sectorIndex ?? 0,
        diceValue: null,
        consecutiveSixes: 0,
        phase: 'waiting',
      };
      setState(next);
      rollLock.current = false;
      return;
    }

    const legal = getHexagonLegalMoves(next);
    if (legal.length === 0) {
      await new Promise((r) => setTimeout(r, 400));
      const currentRosterIdx = next.players.findIndex((p) => p.sectorIndex === next.activePlayerIndex);
      const nextRosterIdx = (currentRosterIdx + 1) % next.players.length;
      next = {
        ...next,
        activePlayerIndex: next.players[nextRosterIdx]?.sectorIndex ?? 0,
        diceValue: null,
        consecutiveSixes: 0,
        phase: 'waiting',
      };
    }

    setState(next);
    rollLock.current = false;
  }, []);

  // Bot auto-play loop
  useEffect(() => {
    if (!autoPlayBots) return;
    if (state.phase === 'ended') return;

    const cur = state.players.find((p) => p.sectorIndex === state.activePlayerIndex);
    if (!cur?.isBot || botLock.current) return;

    botLock.current = true;

    (async () => {
      soundEngine.playBotThinking();
      await new Promise((r) => setTimeout(r, 500));
      await performRoll(true);

      await new Promise((r) => setTimeout(r, 400));

      const s = stateRef.current;
      if (s.phase === 'selecting' && s.activePlayerIndex === cur.sectorIndex) {
        const moves = getHexagonLegalMoves(s);
        if (moves.length > 0) {
          // Priority scoring: Captures > Reaching Home > Exiting Base > Furthest advance
          let bestMove = moves[0];
          let bestScore = -1;

          for (const m of moves) {
            let score = 0;
            if (m.captures.length > 0) score += 1000;
            if (m.reachesHome) score += 500;
            if (m.exitsBase) score += 250;
            score += m.to * 2;
            if (score > bestScore) {
              bestScore = score;
              bestMove = m;
            }
          }

          if (bestMove.captures.length > 0) {
            soundEngine.playTokenCapture();
          } else if (bestMove.reachesHome) {
            soundEngine.playTokenHomeTriumph();
          } else if (bestMove.exitsBase) {
            soundEngine.playTokenRelease();
          }

          setState((prev) => applyHexagonMove(prev, bestMove.tokenId));
        } else {
          const currentRosterIdx = s.players.findIndex((p) => p.sectorIndex === s.activePlayerIndex);
          const nextRosterIdx = (currentRosterIdx + 1) % s.players.length;
          setState((prev) => ({
            ...prev,
            activePlayerIndex: prev.players[nextRosterIdx]?.sectorIndex ?? 0,
            diceValue: null,
            consecutiveSixes: 0,
            phase: 'waiting',
          }));
        }
      }

      botLock.current = false;
    })();

    return () => {
      botLock.current = false;
    };
  }, [state.phase, state.activePlayerIndex, state.players, autoPlayBots, performRoll]);

  const roll = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'waiting') return;
    const cur = s.players.find((p) => p.sectorIndex === s.activePlayerIndex);
    if (cur?.isBot && autoPlayBots) return;
    performRoll(false);
  }, [performRoll, autoPlayBots]);

  const selectToken = useCallback(
    (tokenId: string) => {
      const s = stateRef.current;
      if (s.phase !== 'selecting') return;
      const cur = s.players.find((p) => p.sectorIndex === s.activePlayerIndex);
      if (cur?.isBot && autoPlayBots) return;
      if (humanId && cur?.id !== humanId) return;

      setState((prev) => applyHexagonMove(prev, tokenId));
    },
    [autoPlayBots, humanId]
  );

  const restart = useCallback(() => {
    setState(createHexagonInitialState(stateRef.current.players));
  }, []);

  const legalMoves = useMemo(() => getHexagonLegalMoves(state), [state]);

  return {
    state,
    legalMoves,
    timeLeft,
    isRolling: state.phase === 'rolling',
    isHumanTurn,
    roll,
    selectToken,
    restart,
  };
}
