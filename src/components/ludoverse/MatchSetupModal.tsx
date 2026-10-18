// src/components/ludoverse/MatchSetupModal.tsx
// Comprehensive Match Lobby Setup Modal for 4, 5, 6, 8, 9, and 10 player polygonal Ludo boards.
// Configures Board Type, Solo vs Team Modes (Pairs, Trios, Squads), Auto-balance opposite partners vs custom team assignment, AI difficulty, and turn timers.

import React, { useState, useMemo } from 'react';
import { soundEngine } from '../../utils/audio';
import { MatchMode } from './GameScreen';
import { TeamMode, getTeamsForMatch } from '../../games/ludo/teamRules';
import { BoardPlayerCount } from '../../games/ludo/polygonalBoardGeometry';

export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface SeatConfig {
  seatIndex: number;
  name: string;
  colorHex: string;
  label: string;
  isBot: boolean;
  botDifficulty: BotDifficulty;
  teamId?: number;
}

export interface MatchSetupResult {
  matchMode: MatchMode;
  playerCount: BoardPlayerCount | 2;
  teamMode: TeamMode;
  teamAssignment: 'auto_opposite' | 'custom_manual';
  seats: SeatConfig[];
  turnDurationSeconds: number;
}

interface MatchSetupModalProps {
  open: boolean;
  onClose: () => void;
  onStartMatch: (config: MatchSetupResult) => void;
  initialMode?: MatchMode;
}

const BOARD_COLORS: Record<number, string[]> = {
  2: ['#0055D4', '#00AA33'],
  4: ['#0055D4', '#00AA33', '#FACC15', '#E11D48'],
  5: ['#0055D4', '#00AA33', '#FACC15', '#E11D48', '#8B5CF6'],
  6: ['#0055D4', '#00AA33', '#FACC15', '#E11D48', '#8B5CF6', '#00D4FF'],
  8: ['#0055D4', '#00D4FF', '#E600AA', '#6F00FF', '#FFD700', '#FF7700', '#EE1122', '#00AA33'],
  9: ['#0055D4', '#00D4FF', '#00BFA5', '#00AA33', '#84CC16', '#FACC15', '#EA580C', '#E11D48', '#8B5CF6'],
  10: ['#0055D4', '#00D4FF', '#00BFA5', '#00AA33', '#84CC16', '#FACC15', '#EA580C', '#E11D48', '#D946EF', '#8B5CF6'],
};

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  open,
  onClose,
  onStartMatch,
  initialMode = 'classic',
}) => {
  const [matchMode, setMatchMode] = useState<MatchMode>(initialMode);
  const [teamMode, setTeamMode] = useState<TeamMode>(initialMode === 'jodi' ? 'pairs_2p' : 'individual');
  const [teamAssignment, setTeamAssignment] = useState<'auto_opposite' | 'custom_manual'>('auto_opposite');
  const [turnTimerSec, setTurnTimerSec] = useState<15 | 30 | 60>(30);

  const playerCount: BoardPlayerCount | 2 = useMemo(() => {
    switch (matchMode) {
      case 'duel': return 2;
      case 'pentagon': return 5;
      case 'hexagon': return 6;
      case 'octagon': return 8;
      case 'enneagon': return 9;
      case 'decagon': return 10;
      case 'classic':
      case 'jodi':
      default: return 4;
    }
  }, [matchMode]);

  // Available game modes for selected board
  const availableModes = useMemo(() => {
    const list: { id: TeamMode; label: string; desc: string }[] = [
      { id: 'individual', label: 'Solo FFA', desc: 'Free-For-All solo battle' },
    ];

    if (playerCount === 4 || playerCount === 6 || playerCount === 8 || playerCount === 10) {
      list.push({
        id: 'pairs_2p',
        label: playerCount === 4 ? 'Jodi 2v2' : '2-Player Pairs',
        desc: 'Opposite seating partners with auto-balance',
      });
    }

    if (playerCount === 6 || playerCount === 9) {
      list.push({
        id: 'trios_3p',
        label: '3-Player Trios',
        desc: playerCount === 6 ? '2 Trios (3 vs 3)' : '3 Trios (3 x 3)',
      });
    }

    if (playerCount === 8) {
      list.push({
        id: 'squads_4v4',
        label: 'Squads (4 vs 4)',
        desc: 'Even vs Odd sector teams',
      });
    } else if (playerCount === 10) {
      list.push({
        id: 'squads_5v5',
        label: 'Squads (5 vs 5)',
        desc: 'Titan vs Phoenix 5v5 battle',
      });
    }

    return list;
  }, [playerCount]);

  // Build seats based on playerCount and team allocations
  const [seats, setSeats] = useState<SeatConfig[]>(() =>
    buildSeats(playerCount, teamMode)
  );

  const handleBoardChange = (newMode: MatchMode) => {
    soundEngine.playToggleSwitch();
    setMatchMode(newMode);

    let count: BoardPlayerCount | 2 = 4;
    if (newMode === 'duel') count = 2;
    else if (newMode === 'pentagon') count = 5;
    else if (newMode === 'hexagon') count = 6;
    else if (newMode === 'octagon') count = 8;
    else if (newMode === 'enneagon') count = 9;
    else if (newMode === 'decagon') count = 10;

    const newTeamMode = newMode === 'jodi' ? 'pairs_2p' : 'individual';
    setTeamMode(newTeamMode);
    setSeats(buildSeats(count, newTeamMode));
  };

  const handleTeamModeSelect = (newTeamMode: TeamMode) => {
    soundEngine.playButtonTap();
    setTeamMode(newTeamMode);
    setSeats(buildSeats(playerCount, newTeamMode));
  };

  const handleToggleSeatType = (idx: number) => {
    soundEngine.playToggleSwitch();
    setSeats((prev) =>
      prev.map((s) => (s.seatIndex === idx ? { ...s, isBot: !s.isBot } : s))
    );
  };

  const handleDifficultyChange = (idx: number, diff: BotDifficulty) => {
    soundEngine.playButtonTap();
    setSeats((prev) =>
      prev.map((s) => (s.seatIndex === idx ? { ...s, botDifficulty: diff } : s))
    );
  };

  const handleNameChange = (idx: number, name: string) => {
    setSeats((prev) =>
      prev.map((s) => (s.seatIndex === idx ? { ...s, name } : s))
    );
  };

  const handleCustomTeamChange = (seatIdx: number, newTeamId: number) => {
    soundEngine.playToggleSwitch();
    setSeats((prev) =>
      prev.map((s) => (s.seatIndex === seatIdx ? { ...s, teamId: newTeamId } : s))
    );
  };

  const handleLaunch = () => {
    soundEngine.playGameStartChime();
    onStartMatch({
      matchMode,
      playerCount,
      teamMode,
      teamAssignment,
      seats,
      turnDurationSeconds: turnTimerSec,
    });
    onClose();
  };

  if (!open) return null;

  const currentTeams = getTeamsForMatch(typeof playerCount === 'number' ? playerCount : 4, teamMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#151B2B] border border-white/15 rounded-[24px] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0 bg-[#1A2238]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Multi-Player Ludo Match Setup</h2>
              <p className="text-[11px] text-slate-400">Select board geometry, team modes, and players</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300 pr-2">
          {/* 1. Board Type Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Select Board Geometry ({playerCount} Players)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleBoardChange('classic')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'classic' || matchMode === 'jodi'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>🟦 Standard 4P</span>
                <span className="text-[9px] font-normal text-slate-400">Classic Square</span>
              </button>

              <button
                type="button"
                onClick={() => handleBoardChange('pentagon')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'pentagon'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>⬟ Pentagon 5P</span>
                <span className="text-[9px] font-normal text-slate-400">5 Radial Arms</span>
              </button>

              <button
                type="button"
                onClick={() => handleBoardChange('hexagon')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'hexagon'
                    ? 'bg-teal-600/30 border-teal-500 text-teal-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>⬡ Hexagon 6P</span>
                <span className="text-[9px] font-normal text-slate-400">6 Arms Track</span>
              </button>

              <button
                type="button"
                onClick={() => handleBoardChange('octagon')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'octagon'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>🔷 Octagon 8P</span>
                <span className="text-[9px] font-normal text-slate-400">8 Apex Sectors</span>
              </button>

              <button
                type="button"
                onClick={() => handleBoardChange('enneagon')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'enneagon'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>💠 Non-Sym 9P</span>
                <span className="text-[9px] font-normal text-slate-400">9 Arms Enneagon</span>
              </button>

              <button
                type="button"
                onClick={() => handleBoardChange('decagon')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'decagon'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>⭐ Decagon 10P</span>
                <span className="text-[9px] font-normal text-slate-400">10 Grand Arms</span>
              </button>
            </div>
          </div>

          {/* 2. Game Mode Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              2. Select Game Mode & Team Rules
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableModes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleTeamModeSelect(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    teamMode === m.id
                      ? 'bg-blue-600/25 border-blue-500 text-blue-200'
                      : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Team Rules Quick Reference */}
            {teamMode !== 'individual' && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] space-y-1 text-blue-200">
                <div className="font-bold flex items-center gap-1.5 text-blue-300">
                  <span>🛡️</span> Team Rules Activated:
                </div>
                <div>• <strong>Safe Passthrough</strong>: Cannot capture friendly teammate tokens.</div>
                <div>• <strong>Teammate Shield</strong>: 2 team tokens on 1 tile block opponents.</div>
                <div>• <strong>Roll Sharing</strong>: Finished players roll to help active teammates.</div>
                <div>• <strong>Team Victory</strong>: Wins when all tokens of all members are HOME.</div>
              </div>
            )}
          </div>

          {/* 3. Team Assignment Strategy (Auto-Balance vs Manual) */}
          {teamMode !== 'individual' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                3. Team Assignment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playToggleSwitch();
                    setTeamAssignment('auto_opposite');
                    setSeats(buildSeats(playerCount, teamMode));
                  }}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                    teamAssignment === 'auto_opposite'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-black/20 border-white/10 text-slate-400'
                  }`}
                >
                  🎯 Auto-Balance (Opposite Partners)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playToggleSwitch();
                    setTeamAssignment('custom_manual');
                  }}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                    teamAssignment === 'custom_manual'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-black/20 border-white/10 text-slate-400'
                  }`}
                >
                  ✍️ Custom Manual Slots
                </button>
              </div>
            </div>
          )}

          {/* 4. Seat Roster Configuration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Seat Configuration ({seats.length} Slots)
              </label>
              <button
                type="button"
                onClick={() => setSeats(buildSeats(playerCount, teamMode))}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Reset Default
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {seats.map((seat) => (
                <div
                  key={`seat-${seat.seatIndex}`}
                  className="p-2 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-2"
                >
                  {/* Left: Color & Name */}
                  <div className="flex items-center gap-2 min-w-[130px]">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                      style={{ background: seat.colorHex }}
                    />
                    <div className="flex flex-col">
                      <input
                        type="text"
                        value={seat.name}
                        onChange={(e) => handleNameChange(seat.seatIndex, e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-amber-400 focus:outline-none text-[11px] font-semibold text-white w-24 truncate"
                      />
                      <span className="text-[9px] text-slate-400">
                        Sector {seat.label}
                        {seat.teamId !== undefined && teamMode !== 'individual' && (
                          <span className="ml-1 text-blue-300 font-bold">
                            (Team {seat.teamId + 1})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Custom Team Selector if in manual mode */}
                  {teamAssignment === 'custom_manual' && teamMode !== 'individual' && (
                    <select
                      value={seat.teamId ?? 0}
                      onChange={(e) => handleCustomTeamChange(seat.seatIndex, Number(e.target.value))}
                      className="bg-black/50 border border-white/20 rounded-md text-[10px] text-white px-1 py-0.5"
                    >
                      {currentTeams.map((t) => (
                        <option key={t.teamId} value={t.teamId}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Right: Human / Bot Toggle */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleSeatType(seat.seatIndex)}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all ${
                        seat.isBot
                          ? 'bg-purple-900/40 border-purple-500/50 text-purple-300'
                          : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                      }`}
                    >
                      {seat.isBot ? '🤖 Bot' : '👤 You'}
                    </button>

                    {seat.isBot && (
                      <select
                        value={seat.botDifficulty}
                        onChange={(e) =>
                          handleDifficultyChange(seat.seatIndex, e.target.value as BotDifficulty)
                        }
                        className="bg-black/50 border border-white/20 rounded-md text-[10px] text-slate-200 px-1 py-0.5"
                      >
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Turn Timer Preset */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Turn Timer Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonTap();
                    setTurnTimerSec(t as any);
                  }}
                  className={`py-1.5 rounded-lg border font-bold text-center text-xs transition-all ${
                    turnTimerSec === t
                      ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                      : 'bg-black/20 border-white/10 text-slate-400'
                  }`}
                >
                  ⏱️ {t}s {t === 30 ? '(Standard)' : t === 15 ? '(Blitz)' : '(Relaxed)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#1A2238] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-white/20 text-slate-300 hover:text-white font-medium text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLaunch}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs tracking-wider shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <span>⚔️ Start Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function buildSeats(count: BoardPlayerCount | 2, teamMode: TeamMode): SeatConfig[] {
  const colors = BOARD_COLORS[count] ?? BOARD_COLORS[4];
  const teams = getTeamsForMatch(count, teamMode);

  return Array.from({ length: count }, (_, i) => {
    const team = teams.find((t) => t.playerIndices.includes(i));
    return {
      seatIndex: i,
      name: i === 0 ? 'You' : `Player ${i + 1} (Bot)`,
      colorHex: colors[i % colors.length],
      label: i < 9 ? `0${i + 1}` : `${i + 1}`,
      isBot: i !== 0,
      botDifficulty: 'normal',
      teamId: team?.teamId ?? i,
    };
  });
}
