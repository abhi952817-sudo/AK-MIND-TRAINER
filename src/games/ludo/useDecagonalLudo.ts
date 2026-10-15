// src/games/ludo/useDecagonalLudo.ts
// Hook managing game loop, bot turns, and timer for 10-Player Decagonal Ludo.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DecagonGameState,
  DecagonMoveOption,
  DecagonPlayer,
  applyDecagonMove,
  createDecagonInitialState,
  getDecagonLegalMoves,
} from './decagonalEngine';
import { soundEngine } from '../../utils/audio';

export interface UseDecagonalLudoOptions {
  autoPlayBots?: boolean;
}

export function useDecagonalLudo(
  players: DecagonPlayer[],
  options: UseDecagonalLudoOptions = {},
  humanId?: string
) {
  const { autoPlayBots = true } = options;

  const [state, setState] = useState<DecagonGameState>(() =>
    createDecagonInitialState(players)
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

    let next: DecagonGameState = {
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

    // Check legal moves
    const legal = getDecagonLegalMoves(next);
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
        const moves = getDecagonLegalMoves(s);
        if (moves.length > 0) {
          // Priority scoring: Captures > Reaching Home > Exiting Base > Furthest advance
          let bestMove = moves[0];
          let bestScore = -1;

          for (const m of moves) {
            let score = 0;
            if (m.captures.length > 0) score += 1000;
            if (m.reachesHome) score += 500;
            if (m.exitsBase) score += 200;
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

          setState((prev) => applyDecagonMove(prev, bestMove.tokenId));
        } else {
          // Pass turn
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

      setState((prev) => applyDecagonMove(prev, tokenId));
    },
    [autoPlayBots, humanId]
  );

  const restart = useCallback(() => {
    setState(createDecagonInitialState(stateRef.current.players));
  }, []);

  const legalMoves = useMemo(() => getDecagonLegalMoves(state), [state]);

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
