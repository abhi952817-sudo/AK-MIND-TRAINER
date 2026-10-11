// src/games/ludo/useOctagonalLudo.ts
// Hook managing game loop, bot turns, and timer for 8-Player Octagonal Ludo.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  OCTAGON_SECTORS,
  OCTAGON_WIN_POSITION,
} from './octagonalBoard';
import {
  OctagonGameState,
  OctagonMoveOption,
  OctagonPlayer,
  applyOctagonMove,
  createOctagonInitialState,
  getOctagonLegalMoves,
} from './octagonalEngine';

export interface UseOctagonalLudoOptions {
  autoPlayBots?: boolean;
}

export function useOctagonalLudo(
  players: OctagonPlayer[],
  options: UseOctagonalLudoOptions = {},
  humanId?: string
) {
  const { autoPlayBots = true } = options;

  const [state, setState] = useState<OctagonGameState>(() =>
    createOctagonInitialState(players)
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

  // Reset timer on active player change
  useEffect(() => {
    setTimeLeft(30);
  }, [state.activePlayerIndex]);

  const activePlayer = useMemo(
    () => state.players.find((p) => p.sectorIndex === state.activePlayerIndex) ?? state.players[0],
    [state.players, state.activePlayerIndex]
  );

  const isHumanTurn = useMemo(() => {
    if (!humanId) return true; // Pass & play
    return activePlayer?.id === humanId;
  }, [activePlayer, humanId]);

  // Core Roll action
  const performRoll = useCallback(async (forBot: boolean) => {
    if (rollLock.current) return;
    const s = stateRef.current;
    if (s.phase !== 'waiting' || s.winner !== null) return;

    rollLock.current = true;
    setState((prev) => ({ ...prev, phase: 'rolling' }));

    // Rolling animation time
    await new Promise((r) => setTimeout(r, 1200));

    // Roll random 1..6
    const rollVal = 1 + Math.floor(Math.random() * 6);
    let consecutive = stateRef.current.consecutiveSixes;
    if (rollVal === 6) consecutive++;
    else consecutive = 0;

    let next: OctagonGameState = {
      ...stateRef.current,
      diceValue: rollVal,
      consecutiveSixes: consecutive,
      phase: 'selecting',
    };

    // 3 consecutive sixes forfeit rule
    if (consecutive === 3 && rollVal === 6) {
      await new Promise((r) => setTimeout(r, 600));
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

    setState(next);

    // Auto-pass if no legal moves
    const legal = getOctagonLegalMoves(next);
    if (legal.length === 0) {
      await new Promise((r) => setTimeout(r, 800));
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
    }

    rollLock.current = false;
  }, []);

  // Bot automation
  useEffect(() => {
    if (!autoPlayBots || state.phase === 'ended') return;

    const cur = state.players.find((p) => p.sectorIndex === state.activePlayerIndex);
    if (!cur?.isBot || botLock.current) return;

    botLock.current = true;

    (async () => {
      // Bot rolls after short thinking delay
      await new Promise((r) => setTimeout(r, 650));
      await performRoll(true);

      // Bot selects move after roll
      await new Promise((r) => setTimeout(r, 550));
      const currentSt = stateRef.current;
      if (currentSt.phase === 'selecting' && currentSt.activePlayerIndex === cur.sectorIndex) {
        const legal = getOctagonLegalMoves(currentSt);
        if (legal.length > 0) {
          // Heuristic: prioritize captures, then exiting base, then advancing closest to home
          legal.sort((a, b) => {
            if (a.captures.length !== b.captures.length) return b.captures.length - a.captures.length;
            if (a.exitsBase !== b.exitsBase) return a.exitsBase ? -1 : 1;
            return b.to - a.to;
          });
          const bestMove = legal[0];
          setState((prev) => applyOctagonMove(prev, bestMove.tokenId));
        }
      }
      botLock.current = false;
    })();

    return () => {
      botLock.current = false;
    };
  }, [state.phase, state.activePlayerIndex, state.players, autoPlayBots, performRoll]);

  const roll = useCallback(() => {
    if (stateRef.current.phase !== 'waiting') return;
    performRoll(false);
  }, [performRoll]);

  const selectToken = useCallback((tokenId: string) => {
    if (stateRef.current.phase !== 'selecting') return;
    setState((prev) => applyOctagonMove(prev, tokenId));
  }, []);

  const restart = useCallback(() => {
    setState(createOctagonInitialState(players));
    setTimeLeft(30);
  }, [players]);

  const legalMoves = useMemo(() => getOctagonLegalMoves(state), [state]);

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
