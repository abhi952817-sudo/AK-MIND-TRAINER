// src/components/ludoverse/GameScreen.tsx
// Comprehensive Ludo Arena supporting both Classic 4-Player Wooden Board
// and Grand 8-Player Octagonal Board with path previews, 3D dice, and full rules.

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { COLORS, PLAYER_COLORS, StateMode, ScreenStateMode } from '../../types/ludoverse';
import { Avatar, ConfirmDialog } from './UIComponents';
import { Dice3DCube } from './Dice3DCube';
import { LudoBoard } from '../../games/ludo/LudoBoard';
import { useLudo } from '../../games/ludo/useLudo';
import { Player } from '../../games/ludo/types';
import { WIN_POSITION } from '../../games/ludo/board';

// 8-Player Octagonal Board imports
import { OctagonalLudoBoard } from '../../games/ludo/OctagonalLudoBoard';
import { useOctagonalLudo } from '../../games/ludo/useOctagonalLudo';
import { OCTAGON_SECTORS } from '../../games/ludo/octagonalBoard';
import { OctagonPlayer } from '../../games/ludo/octagonalEngine';

const FOUR_PLAYERS: Player[] = [
  { uid: 'you',   name: 'You',      color: 'blue',   index: 0, isBot: false, isHost: true,  isReady: true, isOnline: true },
  { uid: 'bot1',  name: 'Samantha', color: 'red',    index: 1, isBot: true,  isHost: false, isReady: true, isOnline: true },
  { uid: 'bot2',  name: 'Marcus',   color: 'green',  index: 2, isBot: true,  isHost: false, isReady: true, isOnline: true },
  { uid: 'bot3',  name: 'Devin',    color: 'yellow', index: 3, isBot: true,  isHost: false, isReady: true, isOnline: true },
];

const TWO_PLAYERS: Player[] = [
  { uid: 'you',   name: 'You',      color: 'blue',   index: 0, isBot: false, isHost: true,  isReady: true, isOnline: true },
  { uid: 'bot2',  name: 'Marcus',   color: 'green',  index: 2, isBot: true,  isHost: false, isReady: true, isOnline: true },
];

// Default 8-Player Roster for Octagonal Board
const ALL_EIGHT_PLAYERS: OctagonPlayer[] = OCTAGON_SECTORS.map((sec, idx) => ({
  id: idx === 0 ? 'you' : `bot-${idx}`,
  name: idx === 0 ? 'You' : `${sec.name} Bot`,
  sectorIndex: sec.index,
  color: sec.color,
  label: sec.label,
  isBot: idx !== 0,
  isHost: idx === 0,
}));

interface GameScreenProps {
  onQuit?: () => void;
  onWinner?: (winnerIndex?: number) => void;
  onChat?: () => void;
  onRules?: () => void;
  state?: StateMode | ScreenStateMode;
  players?: Player[];
  humanUid?: string;
  initialBoardType?: 'classic' | 'octagon';
}

export const GameScreen: React.FC<GameScreenProps> = ({
  onQuit = () => {},
  onWinner = () => {},
  onChat = () => {},
  onRules = () => {},
  humanUid = 'you',
  initialBoardType = 'classic',
}) => {
  // Board type state: 'classic' (4P square wood) | 'octagon' (8P grand octagon)
  const [boardType, setBoardType] = useState<'classic' | 'octagon'>(initialBoardType);
  const [playerMode, setPlayerMode] = useState<2 | 4 | 8>(initialBoardType === 'octagon' ? 8 : 4);
  const [passAndPlay, setPassAndPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Audio synthesizer
  const playSoundEffect = (type: 'move' | 'capture' | 'win') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'move') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'capture') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(780, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const t = ctx.currentTime + i * 0.09;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.22);
        });
      }
    } catch {}
  };

  // =========================================================================
  // 1. CLASSIC 4-PLAYER ENGINE SETUP
  // =========================================================================
  const classicPlayers = useMemo(() => {
    const base = playerMode === 2 ? TWO_PLAYERS : FOUR_PLAYERS;
    if (passAndPlay) return base.map((p) => ({ ...p, isBot: false }));
    return base;
  }, [playerMode, passAndPlay]);

  const classicGame = useLudo(
    classicPlayers,
    { autoPlayBots: !passAndPlay },
    passAndPlay ? undefined : humanUid
  );

  // =========================================================================
  // 2. OCTAGONAL 8-PLAYER ENGINE SETUP
  // =========================================================================
  const octagonPlayers = useMemo(() => {
    let base = ALL_EIGHT_PLAYERS;
    if (playerMode === 2) {
      base = [ALL_EIGHT_PLAYERS[0], ALL_EIGHT_PLAYERS[4]]; // 01 Blue vs 05 Yellow
    } else if (playerMode === 4) {
      base = [ALL_EIGHT_PLAYERS[0], ALL_EIGHT_PLAYERS[2], ALL_EIGHT_PLAYERS[4], ALL_EIGHT_PLAYERS[6]];
    }
    if (passAndPlay) {
      return base.map((p) => ({ ...p, isBot: false }));
    }
    return base;
  }, [playerMode, passAndPlay]);

  const octagonGame = useOctagonalLudo(
    octagonPlayers,
    { autoPlayBots: !passAndPlay },
    passAndPlay ? undefined : humanUid
  );

  // Active Game State Router
  const isOctagon = boardType === 'octagon';
  const activeDiceVal = isOctagon ? octagonGame.state.diceValue : classicGame.state.diceValue;
  const activeIsRolling = isOctagon ? octagonGame.isRolling : classicGame.isRolling;
  const activeTimeLeft = isOctagon ? octagonGame.timeLeft : classicGame.timeLeft;
  const activeIsHumanTurn = isOctagon ? octagonGame.isHumanTurn : classicGame.isHumanTurn;
  const activePhase = isOctagon ? octagonGame.state.phase : classicGame.state.phase;

  // Active color for dice ring and badges
  const activeColorHex = useMemo(() => {
    if (isOctagon) {
      const cur = octagonGame.state.players.find((p) => p.sectorIndex === octagonGame.state.activePlayerIndex);
      return cur?.color ?? '#0055D4';
    }
    const cur = classicGame.state.players[classicGame.state.activePlayerIndex];
    return PLAYER_COLORS[cur?.color ?? 'blue'] || COLORS.blue;
  }, [isOctagon, octagonGame.state, classicGame.state]);

  const activePlayerName = useMemo(() => {
    if (isOctagon) {
      const cur = octagonGame.state.players.find((p) => p.sectorIndex === octagonGame.state.activePlayerIndex);
      return cur?.name ?? `Player ${octagonGame.state.activePlayerIndex + 1}`;
    }
    const cur = classicGame.state.players[classicGame.state.activePlayerIndex];
    return cur?.name ?? `Player ${classicGame.state.activePlayerIndex + 1}`;
  }, [isOctagon, octagonGame.state, classicGame.state]);

  const handleRoll = () => {
    if (isOctagon) octagonGame.roll();
    else classicGame.roll();
  };

  const handleRestart = () => {
    if (isOctagon) octagonGame.restart();
    else classicGame.restart();
  };

  const timerColor =
    activeTimeLeft > 15 ? COLORS.success : activeTimeLeft > 5 ? COLORS.yellow : COLORS.error;

  return (
    <div
      className="w-full h-full flex flex-col relative select-none"
      style={{ background: '#161824', color: '#FFFFFF' }}
    >
      {/* ========================================================= */}
      {/* HEADER: Board Selector & Turn Timer                       */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between px-3 h-14 shrink-0 bg-[#1E2235]/75 border-b border-white/5 backdrop-blur-xs">
        {/* Board Switcher Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/30 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setBoardType('classic');
              if (playerMode === 8) setPlayerMode(4);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              !isOctagon
                ? 'bg-[#E85A0C] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🪵 Classic (4P)
          </button>
          <button
            type="button"
            onClick={() => {
              setBoardType('octagon');
              setPlayerMode(8);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              isOctagon
                ? 'bg-[#0055D4] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔷 Octagon (8P)
          </button>
        </div>

        {/* Right Header Utilities: Sound Mute Toggle & Circular Timer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-colors border border-white/10"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          {/* Circular SVG Timer */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="absolute" width="32" height="32">
              <circle cx="16" cy="16" r="13" fill="none" stroke="#FFFFFF1A" strokeWidth="2.5" />
              <circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke={timerColor}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={2 * Math.PI * 13 * (1 - activeTimeLeft / 30)}
                strokeLinecap="round"
                transform="rotate(-90 16 16)"
              />
            </svg>
            <span className="text-[10px] font-bold text-white">{activeTimeLeft}</span>
          </div>
        </div>
      </div>

      {/* Turn Banner with Active Player Indicator & Path Guidance */}
      <div
        className="text-center text-xs py-1 px-4 shrink-0 font-medium flex items-center justify-center gap-2 border-b border-white/5"
        style={{
          background: `${activeColorHex}20`,
          color: activeColorHex,
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-ping"
          style={{ background: activeColorHex }}
        />
        <span className="font-semibold">
          {activePhase === 'ended'
            ? '🏆 Match Finished!'
            : passAndPlay || activeIsHumanTurn
            ? activePhase === 'waiting'
              ? `${activePlayerName}: Roll the Dice`
              : activePhase === 'selecting'
              ? 'Tap glowing token (path trail shown!)'
              : 'Rolling…'
            : `${activePlayerName} (Bot) thinking…`}
        </span>
      </div>

      {/* ========================================================= */}
      {/* BOARD VIEWPORT                                            */}
      {/* ========================================================= */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        {isOctagon ? (
          <OctagonalLudoBoard
            state={octagonGame.state}
            legalMoves={octagonGame.legalMoves}
            onTokenClick={octagonGame.selectToken}
            inputLocked={octagonGame.isRolling || (!passAndPlay && !octagonGame.isHumanTurn)}
            size={Math.min(window.innerWidth - 16, 420)}
          />
        ) : (
          <LudoBoard
            state={classicGame.state}
            legalMoves={classicGame.legalMoves}
            onTokenClick={classicGame.selectToken}
            inputLocked={classicGame.isRolling || (!passAndPlay && !classicGame.isHumanTurn)}
            size={Math.min(window.innerWidth - 18, 420)}
          />
        )}
      </div>

      {/* ========================================================= */}
      {/* BOTTOM CONTROLS & 3D DICE                                 */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between px-5 pb-5 pt-2 shrink-0 bg-[#1A1D2D]/75 border-t border-white/5">
        {/* Chat Button */}
        <button
          type="button"
          onClick={onChat}
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg active:scale-95 transition-transform shadow-lg bg-[#24283D] hover:bg-[#2F344F] border border-white/10"
          title="Chat"
        >
          💬
        </button>

        {/* Rules Button */}
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg active:scale-95 transition-transform shadow-lg bg-[#24283D] hover:bg-[#2F344F] border border-white/10"
          title="How to Play"
        >
          📜
        </button>

        {/* 3D Dice with Active Player Glow */}
        <Dice3DCube
          value={activeDiceVal ?? 1}
          rolling={activeIsRolling}
          disabled={(!passAndPlay && !activeIsHumanTurn) || activePhase !== 'waiting'}
          onRoll={handleRoll}
          accentColor={activeColorHex}
        />

        {/* Menu Dropdown Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg active:scale-95 transition-transform shadow-lg bg-[#24283D] hover:bg-[#2F344F] border border-white/10"
          title="Game Menu"
        >
          ☰
        </button>
      </div>

      {/* ========================================================= */}
      {/* MENU MODAL POPUP                                          */}
      {/* ========================================================= */}
      {menuOpen && (
        <div
          className="absolute bottom-24 right-4 rounded-[18px] overflow-hidden shadow-2xl z-40 border border-white/15 bg-[#1E2235] w-60"
        >
          <div className="px-4 py-3 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Game Setup
          </div>

          {/* Board Selector */}
          <button
            type="button"
            onClick={() => {
              const next = isOctagon ? 'classic' : 'octagon';
              setBoardType(next);
              if (next === 'octagon') setPlayerMode(8);
              else setPlayerMode(4);
              setMenuOpen(false);
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold flex items-center justify-between border-b border-white/10 hover:bg-white/5"
          >
            <span>Board Type</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
              {isOctagon ? '🔷 Octagon 8P' : '🪵 Classic 4P'}
            </span>
          </button>

          {/* Player Count */}
          <button
            type="button"
            onClick={() => {
              if (isOctagon) {
                setPlayerMode((m) => (m === 8 ? 4 : m === 4 ? 2 : 8));
              } else {
                setPlayerMode((m) => (m === 4 ? 2 : 4));
              }
              setMenuOpen(false);
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold flex items-center justify-between border-b border-white/10 hover:bg-white/5"
          >
            <span>Players</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
              {playerMode} Players
            </span>
          </button>

          {/* Pass & Play */}
          <button
            type="button"
            onClick={() => {
              setPassAndPlay((p) => !p);
              setMenuOpen(false);
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold flex items-center justify-between border-b border-white/10 hover:bg-white/5"
          >
            <span>Pass & Play</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                passAndPlay ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {passAndPlay ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Restart Match */}
          <button
            type="button"
            onClick={() => {
              handleRestart();
              setMenuOpen(false);
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-white/5 border-b border-white/10 text-white"
          >
            🔄 Restart Match
          </button>

          {/* Rules */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setRulesOpen(true);
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-white/5 border-b border-white/10 text-white"
          >
            📜 Rules & Path Guide
          </button>

          {/* Quit */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setConfirmQuit(true);
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-white/5 text-rose-400"
          >
            🚪 Quit Game
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* RULES MODAL WITH STEP TRAIL GUIDE                         */}
      {/* ========================================================= */}
      {rulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#1E2235] border border-white/15 rounded-[22px] p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📜</span>
                <span>{isOctagon ? '8-Player Octagonal Rules' : 'Classic Ludo Rules'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRulesOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 text-xs text-slate-300 leading-relaxed pr-1">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="font-bold text-blue-300 block mb-0.5">🛤️ Live Path Trail Preview:</span>
                Whenever you roll the dice, tapping or hovering over your glowing token shows a <span className="font-bold text-white">dotted trail with numbers (① ➜ ② ➜ ③...)</span> indicating the exact path and landing spot!
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-0.5">🎲 Getting Out of Base:</span>
                Rolling a <span className="font-bold text-yellow-400">6</span> unlocks your token from base onto the <span className="font-bold text-emerald-400">Start cell</span> and grants an extra roll.
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-0.5">🛑 Safe Cells:</span>
                Tokens on <span className="font-bold text-yellow-400">★ Stop cells</span> and your colored runway cannot be captured.
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-0.5">⚔️ Captures & Bonus Rolls:</span>
                Landing on an opponent sends their token back to base and gives you a bonus roll!
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-0.5">👑 Winning the Match:</span>
                Complete the lap around the {isOctagon ? '8 octagonal sectors' : 'track'} and enter the center victory area with all 4 tokens!
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRulesOpen(false)}
              className="mt-2 w-full h-11 rounded-xl font-bold text-xs text-white active:scale-98 transition-transform"
              style={{ background: isOctagon ? '#0055D4' : COLORS.blue }}
            >
              Ready to Play!
            </button>
          </div>
        </div>
      )}

      {/* Confirm Quit Dialog */}
      <ConfirmDialog
        open={confirmQuit}
        title="Quit Match?"
        message="Are you sure you want to exit the current match?"
        destructive
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => {
          setConfirmQuit(false);
          onQuit();
        }}
      />
    </div>
  );
};
