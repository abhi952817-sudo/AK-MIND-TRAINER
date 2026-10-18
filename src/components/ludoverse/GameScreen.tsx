// src/components/ludoverse/GameScreen.tsx
// Comprehensive Ludo Arena supporting 2 to 10 players, Jodi 2v2 partnership mode,
// strict 8-player octagonal board, and 10-player decagonal board with 23-event audio.

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { COLORS, PLAYER_COLORS, StateMode, ScreenStateMode } from '../../types/ludoverse';
import { ConfirmDialog } from './UIComponents';
import { Dice3DCube } from './Dice3DCube';
import { LudoBoard } from '../../games/ludo/LudoBoard';
import { useLudo } from '../../games/ludo/useLudo';
import { Player } from '../../games/ludo/types';
import { soundEngine } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import { SoundSettingsModal } from './SoundSettingsModal';
import { TeamMode, getTeamsForMatch, hasPlayerFinishedAllTokens } from '../../games/ludo/teamRules';

// 6-Player Hexagonal Board imports
import { HexagonalLudoBoard } from '../../games/ludo/HexagonalLudoBoard';
import { useHexagonalLudo } from '../../games/ludo/useHexagonalLudo';
import { HEXAGON_SECTORS } from '../../games/ludo/hexagonalBoard';
import { HexagonPlayer } from '../../games/ludo/hexagonalEngine';

// 8-Player Octagonal Board imports
import { OctagonalLudoBoard } from '../../games/ludo/OctagonalLudoBoard';
import { useOctagonalLudo } from '../../games/ludo/useOctagonalLudo';
import { OCTAGON_SECTORS } from '../../games/ludo/octagonalBoard';
import { OctagonPlayer } from '../../games/ludo/octagonalEngine';

// 10-Player Decagonal Board imports
import { DecagonalLudoBoard } from '../../games/ludo/DecagonalLudoBoard';
import { useDecagonalLudo } from '../../games/ludo/useDecagonalLudo';
import { DECAGON_SECTORS } from '../../games/ludo/decagonalBoard';
import { DecagonPlayer } from '../../games/ludo/decagonalEngine';

// Polygonal Board (5P Pentagon, 9P Enneagon, etc.) imports
import { PolygonalLudoBoard } from './PolygonalLudoBoard';
import { usePolygonalLudo } from '../../games/ludo/usePolygonalLudo';
import { getBoardConfig, BoardPlayerCount } from '../../games/ludo/polygonalBoardGeometry';

// Match Setup Lobby Modal
import { MatchSetupModal, MatchSetupResult, SeatConfig } from './MatchSetupModal';

export type MatchMode = 'classic' | 'jodi' | 'pentagon' | 'hexagon' | 'octagon' | 'enneagon' | 'decagon' | 'duel';

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

// Standard 6-Player Roster for Hexagonal Board
const ALL_SIX_PLAYERS: HexagonPlayer[] = HEXAGON_SECTORS.map((sec, idx) => ({
  id: idx === 0 ? 'you' : `bot-${idx}`,
  name: idx === 0 ? 'You' : `${sec.name} Bot`,
  sectorIndex: sec.index,
  color: sec.color,
  label: sec.label,
  isBot: idx !== 0,
  isHost: idx === 0,
  botDifficulty: 'normal',
}));

// Strict 8-Player Roster for Octagonal Board
const ALL_EIGHT_PLAYERS: OctagonPlayer[] = OCTAGON_SECTORS.map((sec, idx) => ({
  id: idx === 0 ? 'you' : `bot-${idx}`,
  name: idx === 0 ? 'You' : `${sec.name} Bot`,
  sectorIndex: sec.index,
  color: sec.color,
  label: sec.label,
  isBot: idx !== 0,
  isHost: idx === 0,
}));

// Strict 10-Player Roster for Decagonal Board
const ALL_TEN_PLAYERS: DecagonPlayer[] = DECAGON_SECTORS.map((sec, idx) => ({
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
  onOpenSettings?: () => void;
  state?: StateMode | ScreenStateMode;
  players?: Player[];
  humanUid?: string;
  initialBoardType?: 'classic' | 'octagon' | 'jodi' | 'decagon' | 'duel' | 'hexagon' | 'pentagon' | 'enneagon';
  initialMatchMode?: MatchMode;
  initialTeamMode?: TeamMode;
  customSeats?: SeatConfig[];
  onOpenSetup?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  onQuit = () => {},
  onWinner = () => {},
  onChat = () => {},
  onRules = () => {},
  onOpenSettings,
  humanUid = 'you',
  initialBoardType = 'classic',
  initialMatchMode,
  initialTeamMode,
  customSeats,
}) => {
  const [matchMode, setMatchMode] = useState<MatchMode>(() => {
    if (initialMatchMode) return initialMatchMode;
    if (initialBoardType === 'pentagon') return 'pentagon';
    if (initialBoardType === 'hexagon') return 'hexagon';
    if (initialBoardType === 'octagon') return 'octagon';
    if (initialBoardType === 'enneagon') return 'enneagon';
    if (initialBoardType === 'jodi') return 'jodi';
    if (initialBoardType === 'decagon') return 'decagon';
    if (initialBoardType === 'duel') return 'duel';
    return 'classic';
  });
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [activeSeats, setActiveSeats] = useState<SeatConfig[] | undefined>(customSeats);
  const [passAndPlay, setPassAndPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false);

  // Background gameplay music lifecycle & arena start chime
  useEffect(() => {
    soundEngine.playGameStartChime();
    soundEngine.setSceneMusic('gameplay');
    return () => {
      soundEngine.stopBgm();
    };
  }, []);

  const toggleSound = () => {
    setSoundEnabled((v) => {
      const next = !v;
      if (!next) {
        soundEngine.sfxMuted = true;
        soundEngine.bgmMuted = true;
        soundEngine.stopBgm();
      } else {
        soundEngine.sfxMuted = false;
        soundEngine.bgmMuted = false;
        soundEngine.setSceneMusic('gameplay');
      }
      return next;
    });
  };

  // =========================================================================
  // 1. CLASSIC & JODI ENGINE SETUP
  // =========================================================================
  const classicPlayers = useMemo(() => {
    const base = matchMode === 'duel' ? TWO_PLAYERS : FOUR_PLAYERS;
    if (activeSeats && activeSeats.length >= (matchMode === 'duel' ? 2 : 4)) {
      return base.map((p, i) => {
        const s = activeSeats[i];
        if (!s) return p;
        return {
          ...p,
          name: s.name || p.name,
          isBot: passAndPlay ? false : s.isBot,
        };
      });
    }
    if (passAndPlay) return base.map((p) => ({ ...p, isBot: false }));
    return base;
  }, [matchMode, passAndPlay, activeSeats]);

  const teamMode: TeamMode = matchMode === 'jodi' ? 'jodi_2v2' : 'individual';

  const classicGame = useLudo(
    classicPlayers,
    { autoPlayBots: !passAndPlay, teamMode },
    passAndPlay ? undefined : humanUid
  );

  // =========================================================================
  // 2. 6-PLAYER HEXAGON ENGINE
  // =========================================================================
  const hexagonPlayers = useMemo(() => {
    if (activeSeats && activeSeats.length === 6) {
      return ALL_SIX_PLAYERS.map((p, i) => {
        const s = activeSeats[i];
        if (!s) return p;
        return {
          ...p,
          name: s.name || p.name,
          isBot: passAndPlay ? false : s.isBot,
          botDifficulty: s.botDifficulty,
        };
      });
    }
    if (passAndPlay) {
      return ALL_SIX_PLAYERS.map((p) => ({ ...p, isBot: false }));
    }
    return ALL_SIX_PLAYERS;
  }, [passAndPlay, activeSeats]);

  const hexagonGame = useHexagonalLudo(
    hexagonPlayers,
    { autoPlayBots: !passAndPlay },
    passAndPlay ? undefined : humanUid
  );

  // =========================================================================
  // 3. STRICT 8-PLAYER OCTAGON ENGINE
  // =========================================================================
  const octagonPlayers = useMemo(() => {
    if (activeSeats && activeSeats.length === 8) {
      return ALL_EIGHT_PLAYERS.map((p, i) => {
        const s = activeSeats[i];
        if (!s) return p;
        return {
          ...p,
          name: s.name || p.name,
          isBot: passAndPlay ? false : s.isBot,
          botDifficulty: s.botDifficulty,
        };
      });
    }
    if (passAndPlay) {
      return ALL_EIGHT_PLAYERS.map((p) => ({ ...p, isBot: false }));
    }
    return ALL_EIGHT_PLAYERS;
  }, [passAndPlay, activeSeats]);

  const octagonGame = useOctagonalLudo(
    octagonPlayers,
    { autoPlayBots: !passAndPlay },
    passAndPlay ? undefined : humanUid
  );

  // =========================================================================
  // 4. 10-PLAYER DECAGON ENGINE
  // =========================================================================
  const decagonPlayers = useMemo(() => {
    if (activeSeats && activeSeats.length === 10) {
      return ALL_TEN_PLAYERS.map((p, i) => {
        const s = activeSeats[i];
        if (!s) return p;
        return {
          ...p,
          name: s.name || p.name,
          isBot: passAndPlay ? false : s.isBot,
          botDifficulty: s.botDifficulty,
        };
      });
    }
    if (passAndPlay) {
      return ALL_TEN_PLAYERS.map((p) => ({ ...p, isBot: false }));
    }
    return ALL_TEN_PLAYERS;
  }, [passAndPlay, activeSeats]);

  const decagonGame = useDecagonalLudo(
    decagonPlayers,
    { autoPlayBots: !passAndPlay },
    passAndPlay ? undefined : humanUid
  );

  // =========================================================================
  // 5. POLYGONAL ENGINE (5-Player Pentagon, 9-Player Enneagon)
  // =========================================================================
  const isPentagon = matchMode === 'pentagon';
  const isEnneagon = matchMode === 'enneagon';
  const isPolygonal = isPentagon || isEnneagon;
  const polyBoardType: BoardPlayerCount = isPentagon ? 5 : 9;

  const [activeTeamMode, setActiveTeamMode] = useState<TeamMode>(initialTeamMode ?? 'individual');

  const polyPlayers: Player[] = useMemo(() => {
    const count = polyBoardType;
    const config = getBoardConfig(count);
    return Array.from({ length: count }, (_, i) => {
      const s = activeSeats?.[i];
      const sec = config.sectors[i];
      return {
        uid: i === 0 ? 'you' : `bot-${i}`,
        name: s?.name || (i === 0 ? 'You' : `Player ${i + 1} (Bot)`),
        color: (sec?.name?.toLowerCase() ?? 'blue') as any,
        index: i,
        isBot: passAndPlay ? false : (s ? s.isBot : i !== 0),
        isHost: i === 0,
        isReady: true,
        isOnline: true,
      };
    });
  }, [polyBoardType, activeSeats, passAndPlay]);

  const polygonalGame = usePolygonalLudo(
    polyBoardType,
    polyPlayers,
    activeTeamMode,
    { autoPlayBots: !passAndPlay },
    passAndPlay ? undefined : humanUid
  );

  // Active Game State Router
  const isHexagon = matchMode === 'hexagon';
  const isOctagon = matchMode === 'octagon';
  const isDecagon = matchMode === 'decagon';
  const isClassicLike = !isHexagon && !isOctagon && !isDecagon && !isPolygonal;

  const activeDiceVal = isPolygonal
    ? polygonalGame.state.diceValue
    : isOctagon
    ? octagonGame.state.diceValue
    : isDecagon
    ? decagonGame.state.diceValue
    : isHexagon
    ? hexagonGame.state.diceValue
    : classicGame.state.diceValue;

  const activeIsRolling = isPolygonal
    ? polygonalGame.isRolling
    : isOctagon
    ? octagonGame.isRolling
    : isDecagon
    ? decagonGame.isRolling
    : isHexagon
    ? hexagonGame.isRolling
    : classicGame.isRolling;

  const activeTimeLeft = isPolygonal
    ? polygonalGame.timeLeft
    : isOctagon
    ? octagonGame.timeLeft
    : isDecagon
    ? decagonGame.timeLeft
    : isHexagon
    ? hexagonGame.timeLeft
    : classicGame.timeLeft;

  const activeIsHumanTurn = isPolygonal
    ? polygonalGame.isHumanTurn
    : isOctagon
    ? octagonGame.isHumanTurn
    : isDecagon
    ? decagonGame.isHumanTurn
    : isHexagon
    ? hexagonGame.isHumanTurn
    : classicGame.isHumanTurn;

  const activePhase = isPolygonal
    ? polygonalGame.state.phase
    : isOctagon
    ? octagonGame.state.phase
    : isDecagon
    ? decagonGame.state.phase
    : isHexagon
    ? hexagonGame.state.phase
    : classicGame.state.phase;

  // Active color for dice ring and badges
  const activeColorHex = useMemo(() => {
    if (isPolygonal) {
      const config = getBoardConfig(polyBoardType);
      const cur = config.sectors[polygonalGame.state.activePlayerIndex];
      return cur?.color ?? '#0055D4';
    }
    if (isOctagon) {
      const cur = octagonGame.state.players.find((p) => p.sectorIndex === octagonGame.state.activePlayerIndex);
      return cur?.color ?? '#0055D4';
    }
    if (isDecagon) {
      const cur = decagonGame.state.players.find((p) => p.sectorIndex === decagonGame.state.activePlayerIndex);
      return cur?.color ?? '#0055D4';
    }
    if (isHexagon) {
      const cur = hexagonGame.state.players.find((p) => p.sectorIndex === hexagonGame.state.activePlayerIndex);
      return cur?.color ?? '#0055D4';
    }
    const cur = classicGame.state.players[classicGame.state.activePlayerIndex];
    return PLAYER_COLORS[cur?.color ?? 'blue'] || COLORS.blue;
  }, [isPolygonal, polyBoardType, polygonalGame.state, isOctagon, isDecagon, isHexagon, octagonGame.state, decagonGame.state, hexagonGame.state, classicGame.state]);

  const activePlayerName = useMemo(() => {
    if (isPolygonal) {
      const cur = polyPlayers[polygonalGame.state.activePlayerIndex];
      return cur?.name ?? `Player ${polygonalGame.state.activePlayerIndex + 1}`;
    }
    if (isOctagon) {
      const cur = octagonGame.state.players.find((p) => p.sectorIndex === octagonGame.state.activePlayerIndex);
      return cur?.name ?? `Player ${octagonGame.state.activePlayerIndex + 1}`;
    }
    if (isDecagon) {
      const cur = decagonGame.state.players.find((p) => p.sectorIndex === decagonGame.state.activePlayerIndex);
      return cur?.name ?? `Player ${decagonGame.state.activePlayerIndex + 1}`;
    }
    if (isHexagon) {
      const cur = hexagonGame.state.players.find((p) => p.sectorIndex === hexagonGame.state.activePlayerIndex);
      return cur?.name ?? `Player ${hexagonGame.state.activePlayerIndex + 1}`;
    }
    const cur = classicGame.state.players[classicGame.state.activePlayerIndex];
    return cur?.name ?? `Player ${classicGame.state.activePlayerIndex + 1}`;
  }, [isPolygonal, polyPlayers, polygonalGame.state, isOctagon, isDecagon, isHexagon, octagonGame.state, decagonGame.state, hexagonGame.state, classicGame.state]);

  // Jodi partner assist detection
  const isJodiPartnerAssist = useMemo(() => {
    if (matchMode !== 'jodi') return false;
    return hasPlayerFinishedAllTokens(classicGame.state, classicGame.state.activePlayerIndex);
  }, [matchMode, classicGame.state]);

  const handleRoll = () => {
    if (isPolygonal) polygonalGame.roll();
    else if (isOctagon) octagonGame.roll();
    else if (isDecagon) decagonGame.roll();
    else if (isHexagon) hexagonGame.roll();
    else classicGame.roll();
  };

  const handleRestart = () => {
    if (isPolygonal) polygonalGame.restart();
    else if (isOctagon) octagonGame.restart();
    else if (isDecagon) decagonGame.restart();
    else if (isHexagon) hexagonGame.restart();
    else classicGame.restart();
  };

  const handleSetupComplete = (result: MatchSetupResult) => {
    setMatchMode(result.matchMode);
    setActiveSeats(result.seats);
    setActiveTeamMode(result.teamMode);
    setSetupModalOpen(false);
  };

  // Turn notification sound & haptic alert
  const prevTurnRef = useRef<number | null>(null);
  const activeTurn = isPolygonal
    ? polygonalGame.state.activePlayerIndex
    : isOctagon
    ? octagonGame.state.activePlayerIndex
    : isDecagon
    ? decagonGame.state.activePlayerIndex
    : isHexagon
    ? hexagonGame.state.activePlayerIndex
    : classicGame.state.activePlayerIndex;

  useEffect(() => {
    if (prevTurnRef.current !== activeTurn && activePhase !== 'ended') {
      prevTurnRef.current = activeTurn;
      if (soundEnabled) {
        soundEngine.playTurnStart(activeIsHumanTurn);
      }
      haptics.turnTransition(activeIsHumanTurn);
    }
  }, [activeTurn, activePhase, activeIsHumanTurn, soundEnabled]);

  // Low time warning & countdown tick
  useEffect(() => {
    if (soundEnabled && activePhase !== 'ended' && activeTimeLeft <= 5 && activeTimeLeft > 0) {
      soundEngine.playCountdownTick();
    }
  }, [activeTimeLeft, activePhase, soundEnabled]);

  // Match victory fanfare
  useEffect(() => {
    if (activePhase === 'ended') {
      if (soundEnabled) {
        soundEngine.playVictory();
      }
      haptics.tokenHome();
      const winnerIdx = isPolygonal ? (polygonalGame.state.winner ?? 0) : 0;
      onWinner(winnerIdx);
    }
  }, [activePhase, soundEnabled, isPolygonal, polygonalGame.state.winner, onWinner]);

  // Cross-platform desktop/macOS keyboard shortcuts: Space to roll, Esc for menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        const canRoll = (passAndPlay || activeIsHumanTurn) && activePhase === 'waiting' && !activeIsRolling;
        if (canRoll) {
          e.preventDefault();
          handleRoll();
        }
      } else if (e.code === 'Escape') {
        setMenuOpen((m) => !m);
        setRulesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passAndPlay, activeIsHumanTurn, activePhase, activeIsRolling, handleRoll]);

  const timerColor =
    activeTimeLeft > 15 ? COLORS.success : activeTimeLeft > 5 ? COLORS.yellow : COLORS.error;

  return (
    <div
      className="w-full h-full flex flex-col relative select-none pb-[env(safe-area-inset-bottom)]"
      style={{ background: '#161824', color: '#FFFFFF' }}
    >
      {/* ========================================================= */}
      {/* HEADER: Board Selector & Turn Timer                       */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between px-3 h-14 shrink-0 bg-[#1E2235]/80 border-b border-white/5 backdrop-blur-xs">
        {/* Match Mode Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/10 overflow-x-auto no-scrollbar max-w-[70vw]">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('classic');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'classic'
                ? 'bg-[#E85A0C] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🪵 Classic 4P
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('jodi');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'jodi'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🤝 Jodi 2v2
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('pentagon');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'pentagon'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⬟ Pentagon 5P
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('hexagon');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'hexagon'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⬡ Hexagon 6P
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('octagon');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'octagon'
                ? 'bg-[#0055D4] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔷 Octagon 8P
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('enneagon');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'enneagon'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💠 Enneagon 9P
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('decagon');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'decagon'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⭐ Decagon 10P
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMatchMode('duel');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              matchMode === 'duel'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚔️ 2P Duel
          </button>
        </div>

        {/* Right Header Utilities: Setup, Settings, Sound & Timer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setSetupModalOpen(true);
            }}
            className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-[11px] font-bold text-indigo-200 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="Match Setup & Custom Seats"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Setup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                setSoundSettingsOpen(true);
              }
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-colors border border-white/10 cursor-pointer"
            title="Audio & Sound Settings (23 Classic Events)"
          >
            ⚙️
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-colors border border-white/10 cursor-pointer"
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

      {/* Jodi 2v2 Team Badges Header */}
      {matchMode === 'jodi' && (
        <div className="px-3 py-1 bg-black/30 border-b border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="font-bold">Team Alpha:</span>
            <span>You (Blue) & Marcus (Green)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="font-bold">Team Beta:</span>
            <span>Samantha (Red) & Devin (Yellow)</span>
          </div>
        </div>
      )}

      {/* Polygonal Player Status HUD Bar (Supports 5P Pentagon, 6P, 8P, 9P, 10P) */}
      {isPolygonal && (
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black/40 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
          {polyPlayers.map((p, idx) => {
            const isActive = polygonalGame.state.activePlayerIndex === idx;
            const sec = getBoardConfig(polyBoardType).sectors[idx];
            const colorHex = sec?.color ?? '#3B82F6';
            const playerTokens = polygonalGame.state.tokens.filter((t) => t.playerIndex === idx);
            const finishedCount = playerTokens.filter(
              (t) => t.position === getBoardConfig(polyBoardType).winPosition
            ).length;

            return (
              <div
                key={p.uid}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                  isActive ? 'bg-white/15 shadow-md scale-105' : 'bg-white/5 opacity-70'
                }`}
                style={{
                  borderColor: isActive ? colorHex : 'rgba(255,255,255,0.1)',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorHex }} />
                <span className="text-white truncate max-w-[70px]">{p.name}</span>
                <span className="text-[10px] text-amber-300 font-extrabold">({finishedCount}/4)</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Turn Banner with Active Player Indicator & Guidance */}
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
            ? isPolygonal && polygonalGame.state.winningTeam
              ? `🏆 ${polygonalGame.state.winningTeam.name} Wins the Match!`
              : matchMode === 'jodi'
              ? classicGame.state.winner === 0
                ? '🏆 Team Alpha (You & Marcus) Wins Jodi Match!'
                : '🏆 Team Beta (Samantha & Devin) Wins Jodi Match!'
              : `🏆 Match Finished! ${activePlayerName} Wins!`
            : isJodiPartnerAssist
            ? `🤝 Partner Assist: ${activePlayerName} is rolling to move partner's token!`
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
        {isPolygonal ? (
          <PolygonalLudoBoard
            playerCount={polyBoardType}
            tokens={polygonalGame.state.tokens}
            activePlayerIndex={polygonalGame.state.activePlayerIndex}
            legalMoves={polygonalGame.legalMoves}
            onTokenClick={polygonalGame.selectToken}
            teamMode={activeTeamMode}
            inputLocked={polygonalGame.isRolling || (!passAndPlay && !polygonalGame.isHumanTurn)}
            size={Math.min(window.innerWidth - 16, 420)}
          />
        ) : isOctagon ? (
          <OctagonalLudoBoard
            state={octagonGame.state}
            legalMoves={octagonGame.legalMoves}
            onTokenClick={octagonGame.selectToken}
            inputLocked={octagonGame.isRolling || (!passAndPlay && !octagonGame.isHumanTurn)}
            size={Math.min(window.innerWidth - 16, 420)}
          />
        ) : isDecagon ? (
          <DecagonalLudoBoard
            state={decagonGame.state}
            legalMoves={decagonGame.legalMoves}
            onTokenClick={decagonGame.selectToken}
            inputLocked={decagonGame.isRolling || (!passAndPlay && !decagonGame.isHumanTurn)}
            size={Math.min(window.innerWidth - 16, 420)}
          />
        ) : isHexagon ? (
          <HexagonalLudoBoard
            state={hexagonGame.state}
            legalMoves={hexagonGame.legalMoves}
            onTokenClick={hexagonGame.selectToken}
            inputLocked={hexagonGame.isRolling || (!passAndPlay && !hexagonGame.isHumanTurn)}
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
      <div className="flex items-center justify-between px-5 pb-5 pt-2 shrink-0 bg-[#1A1D2D]/80 border-t border-white/5">
        {/* Chat Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonTap();
            onChat();
          }}
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg active:scale-95 transition-transform shadow-lg bg-[#24283D] hover:bg-[#2F344F] border border-white/10"
          title="Chat"
        >
          💬
        </button>

        {/* Rules Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playButtonTap();
            setRulesOpen(true);
          }}
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
          onClick={() => {
            soundEngine.playButtonTap();
            setMenuOpen((v) => !v);
          }}
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
        <div className="absolute bottom-24 right-4 rounded-[18px] overflow-hidden shadow-2xl z-40 border border-white/15 bg-[#1E2235] w-64">
          <div className="px-4 py-3 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Game Setup & Modes
          </div>

          {/* Mode Options */}
          <div className="p-2 space-y-1 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                setMatchMode('classic');
                setMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                matchMode === 'classic' ? 'bg-[#E85A0C]/20 text-[#FF7A29]' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>🪵 Classic 4P</span>
              <span className="text-[10px] text-gray-400">FFA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMatchMode('jodi');
                setMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                matchMode === 'jodi' ? 'bg-blue-600/20 text-blue-300' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>🤝 Jodi 2v2</span>
              <span className="text-[10px] text-blue-400 font-bold">Team Partnership</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMatchMode('hexagon');
                setMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                matchMode === 'hexagon' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>⬡ Hexagon 6P</span>
              <span className="text-[10px] text-teal-400">6 Arms</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMatchMode('octagon');
                setMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                matchMode === 'octagon' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>🔷 Octagon 8P</span>
              <span className="text-[10px] text-gray-400">Strict 8P</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMatchMode('decagon');
                setMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                matchMode === 'decagon' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>⭐ Decagon 10P</span>
              <span className="text-[10px] text-purple-400">10 Players</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMatchMode('duel');
                setMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between ${
                matchMode === 'duel' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>⚔️ 2P Duel</span>
              <span className="text-[10px] text-gray-400">1v1</span>
            </button>
          </div>

          {/* Match Setup & Player Lobby */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMenuOpen(false);
              setSetupModalOpen(true);
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold flex items-center justify-between border-b border-white/10 hover:bg-white/5 text-amber-300"
          >
            <span className="flex items-center gap-2">
              <span>⚙️</span>
              <span>Match Setup & Seats</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
              Custom Lobby
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

          {/* Sound & Audio Settings */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonTap();
              setMenuOpen(false);
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                setSoundSettingsOpen(true);
              }
            }}
            className="w-full px-4 py-3 text-left text-xs font-semibold flex items-center justify-between border-b border-white/10 hover:bg-white/5 text-white"
          >
            <span className="flex items-center gap-2">
              <span>🔊</span>
              <span>Sound & Audio Settings</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
              23 Events
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
      {/* RULES MODAL WITH JODI 2V2 & MULTI-BOARD RULES              */}
      {/* ========================================================= */}
      {rulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#1E2235] border border-white/15 rounded-[22px] p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📜</span>
                <span>
                  {matchMode === 'jodi'
                    ? 'Jodi 2v2 Partnership Rules'
                    : matchMode === 'octagon'
                    ? 'Strict 8-Player Octagonal Rules'
                    : matchMode === 'decagon'
                    ? '10-Player Decagonal Rules'
                    : 'Classic Ludo Rules'}
                </span>
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
              {matchMode === 'jodi' ? (
                <>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="font-bold text-blue-300 block mb-0.5">🤝 Teammate Partnerships:</span>
                    Team Alpha (Player 0 Blue & Player 2 Green) vs Team Beta (Player 1 Red & Player 3 Yellow).
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">🛡️ Friendly Safe Guard Block:</span>
                    Teammates NEVER capture each other. Landing on your partner&apos;s token creates an unbreakable <span className="font-bold text-emerald-400">Team Guard Block</span> that opponents cannot capture!
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">🚀 Partner Move Assistance:</span>
                    When you get all 4 of your tokens home, your turn is NOT skipped! On subsequent rolls, you use your dice roll to move your partner&apos;s remaining tokens!
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">🏆 Joint Team Victory:</span>
                    A team wins when ALL 8 tokens belonging to both partners reach the center triumph area!
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="font-bold text-blue-300 block mb-0.5">🛤️ Live Path Trail Preview:</span>
                    Tapping or hovering over your glowing token displays a numbered path showing the exact landing square!
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">🎲 Getting Out of Base:</span>
                    Rolling a <span className="font-bold text-yellow-400">6</span> unlocks your token from base onto the Start cell and grants an extra roll.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">🛑 Safe Cells:</span>
                    Tokens on <span className="font-bold text-yellow-400">★ Stop cells</span> and your colored runway cannot be captured.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-bold text-white block mb-0.5">⚔️ Captures & Bonus Rolls:</span>
                    Landing on an opponent sends their token back to base and grants a bonus roll!
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setRulesOpen(false)}
              className="mt-2 w-full h-11 rounded-xl font-bold text-xs text-white active:scale-98 transition-transform"
              style={{ background: isOctagon ? '#0055D4' : isDecagon ? '#7C3AED' : COLORS.blue }}
            >
              Ready to Play!
            </button>
          </div>
        </div>
      )}

      {/* Sound Settings Modal */}
      <SoundSettingsModal
        open={soundSettingsOpen}
        onClose={() => setSoundSettingsOpen(false)}
      />

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

      {/* Match Setup & Seat Configuration Modal */}
      <MatchSetupModal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onStartMatch={handleSetupComplete}
        initialMode={matchMode}
      />
    </div>
  );
};
