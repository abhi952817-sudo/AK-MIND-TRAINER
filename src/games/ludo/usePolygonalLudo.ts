// src/games/ludo/usePolygonalLudo.ts
// React hook managing the game loop, bot turns, audio effects, and state transitions
// for any Polygonal Ludo Board (4, 5, 6, 8, 9, 10 players) and Team Modes.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoardPlayerCount } from './polygonalBoardGeometry';
import {
  PolygonalGameState,
  PolygonalMoveOption,
  createPolygonalInitialState,
  getPolygonalLegalMoves,
  applyPolygonalMove,
} from './polygonalEngine';
import { TeamMode } from './teamRules';
import { Player, DiceValue } from './types';
import { soundEngine } from '../../utils/audio';

export interface UsePolygonalLudoOptions {
  autoPlayBots?: boolean;
}

export function usePolygonalLudo(
  boardType: BoardPlayerCount,
  players: Player[],
  teamMode: TeamMode = 'individual',
  options: UsePolygonalLudoOptions = {},
  humanId?: string
) {
  const { autoPlayBots = true } = options;

  const [state, setState] = useState<PolygonalGameState>(() =>
    createPolygonalInitialState(boardType, players, teamMode)
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const [timeLeft, setTimeLeft] = useState(30);
  const botLock = useRef(false);
  const rollLock = useRef(false);

  // Turn timer countdown
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
    () => state.players[state.activePlayerIndex] ?? state.players[0],
    [state.players, state.activePlayerIndex]
  );

  const isHumanTurn = useMemo(() => {
    if (!humanId) return true;
    return activePlayer?.uid === humanId || !activePlayer?.isBot;
  }, [activePlayer, humanId]);

  // Roll action
  const performRoll = useCallback(async () => {
    if (rollLock.current) return;
    const s = stateRef.current;
    if (s.phase !== 'waiting' || s.winner !== null) return;

    rollLock.current = true;
    soundEngine.playDiceRattle();
    setState((prev) => ({ ...prev, phase: 'rolling' }));

    await new Promise((r) => setTimeout(r, 650));

    const rollVal = (1 + Math.floor(Math.random() * 6)) as DiceValue;
    soundEngine.playDiceLand();
    if (rollVal === 6) {
      soundEngine.playDiceSixBonus();
    }

    let consecutive = stateRef.current.consecutiveSixes;
    if (rollVal === 6) consecutive++;
    else consecutive = 0;

    let next: PolygonalGameState = {
      ...stateRef.current,
      diceValue: rollVal,
      consecutiveSixes: consecutive,
      phase: 'selecting',
    };

    // 3 consecutive sixes penalty: forfeit turn
    if (consecutive === 3 && rollVal === 6) {
      await new Promise((r) => setTimeout(r, 400));
      next = {
        ...next,
        diceValue: null,
        consecutiveSixes: 0,
        activePlayerIndex: (next.activePlayerIndex + 1) % next.boardType,
        phase: 'waiting',
      };
      setState(next);
      rollLock.current = false;
      return;
    }

    // Check if legal moves exist
    const moves = getPolygonalLegalMoves(next);
    if (moves.length === 0) {
      await new Promise((r) => setTimeout(r, 600));
      next = {
        ...next,
        diceValue: null,
        activePlayerIndex: (next.activePlayerIndex + 1) % next.boardType,
        phase: 'waiting',
      };
      setState(next);
      rollLock.current = false;
      return;
    }

    // Single forced move auto-play for bots
    if (moves.length === 1 && activePlayer?.isBot) {
      setState(next);
      rollLock.current = false;
      await new Promise((r) => setTimeout(r, 450));
      applyMove(moves[0]);
      return;
    }

    setState(next);
    rollLock.current = false;
  }, [activePlayer?.isBot]);

  const selectToken = useCallback((tokenId: string) => {
    const s = stateRef.current;
    if (s.phase !== 'selecting' || s.winner !== null) return;

    const moves = getPolygonalLegalMoves(s);
    const chosen = moves.find((m) => m.tokenId === tokenId);
    if (chosen) {
      applyMove(chosen);
    }
  }, []);

  const applyMove = useCallback((move: PolygonalMoveOption) => {
    const s = stateRef.current;
    soundEngine.playTokenHop();

    if (move.captures.length > 0) {
      soundEngine.playTokenCapture();
    }
    if (move.reachesHome) {
      soundEngine.playTokenHomeTriumph();
    }

    const next = applyPolygonalMove(s, move);

    if (next.phase === 'ended') {
      soundEngine.playVictory();
    }

    setState(next);
  }, []);

  // Bot Turn Automation
  useEffect(() => {
    if (!autoPlayBots) return;
    const s = state;
    if (s.phase === 'ended' || s.winner !== null) return;

    const curPlayer = s.players[s.activePlayerIndex];
    if (!curPlayer || !curPlayer.isBot) return;

    if (botLock.current) return;
    botLock.current = true;

    const timer = setTimeout(async () => {
      try {
        if (stateRef.current.phase === 'waiting') {
          await performRoll();
        } else if (stateRef.current.phase === 'selecting') {
          const moves = getPolygonalLegalMoves(stateRef.current);
          if (moves.length > 0) {
            // Bot heuristic: prioritize capture > reach home > exit base > forward move
            const sortedMoves = [...moves].sort((a, b) => {
              if (b.captures.length !== a.captures.length) return b.captures.length - a.captures.length;
              if (b.reachesHome !== a.reachesHome) return Number(b.reachesHome) - Number(a.reachesHome);
              if (b.exitsBase !== a.exitsBase) return Number(b.exitsBase) - Number(a.exitsBase);
              return b.to - a.to;
            });
            applyMove(sortedMoves[0]);
          }
        }
      } finally {
        botLock.current = false;
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      botLock.current = false;
    };
  }, [state, autoPlayBots, performRoll, applyMove]);

  const restart = useCallback(() => {
    soundEngine.playButtonTap();
    setState(createPolygonalInitialState(boardType, players, teamMode));
  }, [boardType, players, teamMode]);

  const legalMoves = useMemo(
    () => (state.phase === 'selecting' ? getPolygonalLegalMoves(state) : []),
    [state]
  );

  return {
    state,
    legalMoves,
    activePlayer,
    isHumanTurn,
    isRolling: state.phase === 'rolling',
    timeLeft,
    roll: () => performRoll(),
    selectToken,
    restart,
  };
}
