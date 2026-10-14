// src/games/ludo/useLudo.ts
// React hook that wraps the engine. Handles:
//  - Dice animation timing
//  - Auto-pass on no-move / forfeit
//  - Per-second turn timer
//  - Bot auto-play

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyMove,
  createInitialState,
  currentLegalMoves,
  DICE_ROLL_MS,
  passTurn,
  resolveRoll,
  secondsLeft,
  shouldAutoPass,
  startRoll,
  tickTimer,
} from './engine';
import { DiceValue, GameState, MoveOption, Player } from './types';
import { getBotMove } from './bot';
import { soundEngine } from '../../utils/audio';

export interface UseLudoOptions {
  /** If true, players with isBot=true auto-roll + auto-move. */
  autoPlayBots?: boolean;
  /** Milliseconds to wait before auto-passing when no move is available. */
  autoPassDelay?: number;
  /** Milliseconds for dice roll animation. Default 1400. */
  rollDuration?: number;
}

export interface UseLudoApi {
  state: GameState;
  /** Legal moves for the current player with the current dice value. */
  legalMoves: MoveOption[];
  /** Seconds remaining in the current turn (for UI timer). */
  timeLeft: number;
  /** Is the dice currently animating? */
  isRolling: boolean;
  /** Is it the human's turn (i.e., first non-bot player)? */
  isHumanTurn: boolean;
  /** Roll the dice. Safe to call even when not your turn — it will no-op. */
  roll: () => void;
  /** Select a token to move. Pass token id. */
  selectToken: (tokenId: string) => void;
  /** Reset the game with the same players. */
  restart: () => void;
  /** Reset the game with new players. */
  reset: (players: Player[]) => void;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Main Ludo hook.
 *
 * @param players         Array of players (2..4). Mark bots with isBot: true.
 * @param options         Optional configuration.
 * @param humanPlayerId   UID of the local human player (defaults to first non-bot).
 */
export function useLudo(
  players: Player[],
  options: UseLudoOptions = {},
  humanPlayerId?: string
): UseLudoApi {
  const {
    autoPlayBots = true,
    autoPassDelay = 350,
    rollDuration = DICE_ROLL_MS,
  } = options;

  const [state, setState] = useState<GameState>(() =>
    createInitialState(players)
  );

  // ----- Refs for use inside async callbacks -----
  const stateRef = useRef(state);
  stateRef.current = state;

  const rollingLock = useRef(false);
  const botLock = useRef(false);

  // ----- Human player detection -----
  const humanIndex = useMemo(() => {
    if (humanPlayerId) {
      const p = players.find((pl) => pl.uid === humanPlayerId);
      if (p) return p.index;
    }
    const nonBot = players.find((p) => !p.isBot);
    return nonBot?.index ?? 0;
  }, [players, humanPlayerId]);

  const isHumanTurn =
    state.activePlayerIndex === humanIndex && state.phase !== 'ended';

  // ----- Timer tick -----
  useEffect(() => {
    if (state.phase === 'ended') return;
    const iv = setInterval(() => {
      setState((prev) => tickTimer(prev));
    }, 1000);
    return () => clearInterval(iv);
  }, [state.phase]);

  // ----- Core roll action -----
  const performRoll = useCallback(
    async (forBot: boolean) => {
      if (rollingLock.current) return;
      const s = stateRef.current;
      if (s.phase !== 'waiting') return;
      if (s.winner !== null) return;

      rollingLock.current = true;

      // Phase → rolling (UI plays animation)
      soundEngine.playDiceRattle();
      setState((prev) => startRoll(prev));

      await sleep(rollDuration);

      // Generate the dice value
      const value = (1 + Math.floor(Math.random() * 6)) as DiceValue;
      soundEngine.playDiceLand();
      if (value === 6) {
        soundEngine.playDiceSixBonus();
      }

      let next = resolveRoll(stateRef.current, value);
      setState(next);

      // Auto-pass if needed
      if (shouldAutoPass(next)) {
        await sleep(autoPassDelay);
        next = passTurn(next);
        setState(next);
      }

      rollingLock.current = false;
    },
    [rollDuration, autoPassDelay]
  );

  // ----- Bot auto-play -----
  useEffect(() => {
    if (!autoPlayBots) return;
    if (state.phase === 'ended') return;

    const currentPlayer = state.players[state.activePlayerIndex];
    if (!currentPlayer || !currentPlayer.isBot) return;
    if (botLock.current) return;

    botLock.current = true;

    (async () => {
      // Natural thinking delay with soft strategy sound
      soundEngine.playBotThinking();
      await sleep(500 + Math.random() * 200);

      await performRoll(true);

      // Natural pause after roll to evaluate best tactical move
      await sleep(350 + Math.random() * 150);

      const s = stateRef.current;
      if (s.phase === 'selecting' && s.activePlayerIndex === currentPlayer.index) {
        const botMove = getBotMove(s);
        if (botMove) {
          // Play specific audio cues based on the move's tactical outcome
          if (botMove.captures && botMove.captures.length > 0) {
            soundEngine.playTokenCapture();
          } else if (botMove.reachesHome) {
            soundEngine.playTokenHomeTriumph();
          } else if (botMove.exitsBase) {
            soundEngine.playTokenRelease();
          } else if (botMove.entersHomeColumn) {
            soundEngine.playHomeEntry();
          }
          setState((prev) => applyMove(prev, botMove.tokenId));
        } else {
          // No legal move — engine should have auto-passed already,
          // but be defensive.
          setState((prev) => passTurn(prev));
        }
      }

      botLock.current = false;
    })();

    return () => {
      botLock.current = false;
    };
  }, [state.phase, state.activePlayerIndex, state.players, autoPlayBots, performRoll]);

  // ----- Public API -----
  const roll = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'waiting') return;
    const currentPlayer = s.players[s.activePlayerIndex];
    if (currentPlayer?.isBot && autoPlayBots) return; // bots roll themselves
    performRoll(false);
  }, [performRoll, autoPlayBots]);

  const selectToken = useCallback((tokenId: string) => {
    const s = stateRef.current;
    if (s.phase !== 'selecting') return;
    const currentPlayer = s.players[s.activePlayerIndex];
    if (currentPlayer?.isBot && autoPlayBots) return;
    if (currentPlayer?.index !== humanIndex && humanPlayerId) {
      // Not your token — ignore
      return;
    }
    setState((prev) => applyMove(prev, tokenId));
  }, [autoPlayBots, humanIndex, humanPlayerId]);

  const restart = useCallback(() => {
    setState(createInitialState(stateRef.current.players));
  }, []);

  const reset = useCallback((newPlayers: Player[]) => {
    setState(createInitialState(newPlayers));
  }, []);

  const legalMoves = useMemo(() => currentLegalMoves(state), [state]);

  const timeLeft = useMemo(() => secondsLeft(state), [state]);

  return {
    state,
    legalMoves,
    timeLeft,
    isRolling: state.phase === 'rolling',
    isHumanTurn,
    roll,
    selectToken,
    restart,
    reset,
  };
}
