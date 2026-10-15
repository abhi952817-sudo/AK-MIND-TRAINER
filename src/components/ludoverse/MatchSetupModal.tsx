// src/components/ludoverse/MatchSetupModal.tsx
// Comprehensive Match Lobby Setup Modal for 2, 4, 6, 8, and 10 player Ludo matches.
// Allows human/bot seat toggles, AI difficulty (Easy, Balanced, Hard), teams (FFA vs Jodi 2v2), and timer presets.

import React, { useState } from 'react';
import { soundEngine } from '../../utils/audio';
import { MatchMode } from './GameScreen';

export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface SeatConfig {
  seatIndex: number;
  name: string;
  colorHex: string;
  label: string;
  isBot: boolean;
  botDifficulty: BotDifficulty;
  teamId?: number; // 0 = Alpha, 1 = Beta
}

export interface MatchSetupResult {
  matchMode: MatchMode;
  playerCount: 2 | 4 | 6 | 8 | 10;
  seats: SeatConfig[];
  turnDurationSeconds: number;
}

interface MatchSetupModalProps {
  open: boolean;
  onClose: () => void;
  onStartMatch: (config: MatchSetupResult) => void;
  initialMode?: MatchMode;
}

const DEFAULT_COLORS = [
  '#0055D4', // Blue
  '#00AA33', // Green
  '#FACC15', // Yellow
  '#E11D48', // Red
  '#8B5CF6', // Purple
  '#00D4FF', // Cyan
  '#EA580C', // Orange
  '#D946EF', // Magenta
  '#00BFA5', // Teal
  '#84CC16', // Lime
];

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  open,
  onClose,
  onStartMatch,
  initialMode = 'classic',
}) => {
  const [matchMode, setMatchMode] = useState<MatchMode>(initialMode);
  const [turnTimerSec, setTurnTimerSec] = useState<15 | 30 | 60>(30);

  const playerCount: 2 | 4 | 6 | 8 | 10 =
    matchMode === 'duel' ? 2 : matchMode === 'hexagon' as any ? 6 : matchMode === 'octagon' ? 8 : matchMode === 'decagon' ? 10 : 4;

  // Initialize seats based on matchMode
  const [seats, setSeats] = useState<SeatConfig[]>(() => buildDefaultSeats(initialMode));

  // Sync seats when match mode changes
  const handleModeChange = (mode: MatchMode) => {
    soundEngine.playToggleSwitch();
    setMatchMode(mode);
    setSeats(buildDefaultSeats(mode));
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

  const handleLaunch = () => {
    soundEngine.playGameStartChime();
    onStartMatch({
      matchMode,
      playerCount,
      seats,
      turnDurationSeconds: turnTimerSec,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#1E2235] border border-white/15 rounded-[24px] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0 bg-[#252A42]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Match Setup & Player Lobby</h2>
              <p className="text-[11px] text-slate-400">Configure seats, bot AI difficulty, and rules</p>
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
          {/* 1. Board & Player Count Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Board & Player Count
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('duel')}
                className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'duel'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>⚔️ 2P Duel</span>
                <span className="text-[9px] font-normal text-slate-400">1v1 Classic</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('classic')}
                className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'classic'
                    ? 'bg-[#E85A0C]/30 border-[#E85A0C] text-[#FF9E66] shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>🪵 Classic 4P</span>
                <span className="text-[9px] font-normal text-slate-400">Free For All</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('jodi')}
                className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'jodi'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>🤝 Jodi 2v2</span>
                <span className="text-[9px] font-normal text-slate-400">Team Partnership</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('hexagon' as any)}
                className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  (matchMode as any) === 'hexagon'
                    ? 'bg-teal-600/30 border-teal-500 text-teal-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>⬡ Hexagon 6P</span>
                <span className="text-[9px] font-normal text-slate-400">6 Arms Track</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('octagon')}
                className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'octagon'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>🔷 Octagon 8P</span>
                <span className="text-[9px] font-normal text-slate-400">Strict 8 Players</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('decagon')}
                className={`py-2 px-2.5 rounded-xl font-bold flex flex-col items-center gap-0.5 border transition-all ${
                  matchMode === 'decagon'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-md'
                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>⭐ Decagon 10P</span>
                <span className="text-[9px] font-normal text-slate-400">Grand 10 Players</span>
              </button>
            </div>
          </div>

          {/* 2. Seat Configuration & Bot AI Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Seat Configuration ({seats.length} Players)
              </label>
              <button
                type="button"
                onClick={() => setSeats(buildDefaultSeats(matchMode))}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Reset Seats
              </button>
            </div>

            <div className="space-y-2">
              {seats.map((seat) => (
                <div
                  key={`seat-${seat.seatIndex}`}
                  className="p-2.5 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between gap-2"
                >
                  {/* Left: Color Chip & Name */}
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <span
                      className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                      style={{ background: seat.colorHex }}
                    />
                    <div className="flex flex-col">
                      <input
                        type="text"
                        value={seat.name}
                        onChange={(e) => handleNameChange(seat.seatIndex, e.target.value)}
                        className="bg-transparent border-none text-xs font-bold text-white focus:outline-none max-w-[100px]"
                      />
                      {matchMode === 'jodi' && seat.teamId !== undefined && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded w-max ${
                            seat.teamId === 0
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          Team {seat.teamId === 0 ? 'Alpha' : 'Beta'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Human vs Bot Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleSeatType(seat.seatIndex)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      !seat.isBot
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    }`}
                  >
                    {!seat.isBot ? '👤 Human' : '🤖 Bot'}
                  </button>

                  {/* Right: Bot Difficulty (if bot) */}
                  {seat.isBot ? (
                    <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/5">
                      {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => handleDifficultyChange(seat.seatIndex, diff)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                            seat.botDifficulty === diff
                              ? diff === 'easy'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : diff === 'normal'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {diff[0]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic pr-2">Local Player</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Turn Timer Preset */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Turn Timer Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { sec: 15, label: '⚡ 15s Blitz' },
                { sec: 30, label: '⏱️ 30s Standard' },
                { sec: 60, label: '🧘 60s Relaxed' },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => {
                    soundEngine.playButtonTap();
                    setTurnTimerSec(opt.sec as any);
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    turnTimerSec === opt.sec
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-xs'
                      : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/10 shrink-0 flex items-center justify-between gap-3 bg-[#252A42]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 active:scale-98 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Start Battle</span>
            <span>🎲</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function buildDefaultSeats(mode: MatchMode | 'hexagon'): SeatConfig[] {
  if (mode === 'duel') {
    return [
      { seatIndex: 0, name: 'You', colorHex: DEFAULT_COLORS[0], label: 'P1', isBot: false, botDifficulty: 'normal' },
      { seatIndex: 1, name: 'Marcus Bot', colorHex: DEFAULT_COLORS[1], label: 'P2', isBot: true, botDifficulty: 'normal' },
    ];
  }

  if (mode === 'jodi') {
    return [
      { seatIndex: 0, name: 'You', colorHex: DEFAULT_COLORS[0], label: 'P1', isBot: false, botDifficulty: 'normal', teamId: 0 },
      { seatIndex: 1, name: 'Samantha Bot', colorHex: DEFAULT_COLORS[3], label: 'P2', isBot: true, botDifficulty: 'normal', teamId: 1 },
      { seatIndex: 2, name: 'Marcus Bot', colorHex: DEFAULT_COLORS[1], label: 'P3', isBot: true, botDifficulty: 'normal', teamId: 0 },
      { seatIndex: 3, name: 'Devin Bot', colorHex: DEFAULT_COLORS[2], label: 'P4', isBot: true, botDifficulty: 'normal', teamId: 1 },
    ];
  }

  if ((mode as string) === 'hexagon') {
    return [
      { seatIndex: 0, name: 'You', colorHex: '#0055D4', label: '01', isBot: false, botDifficulty: 'normal' },
      { seatIndex: 1, name: 'Green Bot', colorHex: '#00AA33', label: '02', isBot: true, botDifficulty: 'normal' },
      { seatIndex: 2, name: 'Yellow Bot', colorHex: '#FACC15', label: '03', isBot: true, botDifficulty: 'normal' },
      { seatIndex: 3, name: 'Red Bot', colorHex: '#E11D48', label: '04', isBot: true, botDifficulty: 'normal' },
      { seatIndex: 4, name: 'Purple Bot', colorHex: '#8B5CF6', label: '05', isBot: true, botDifficulty: 'normal' },
      { seatIndex: 5, name: 'Cyan Bot', colorHex: '#00D4FF', label: '06', isBot: true, botDifficulty: 'normal' },
    ];
  }

  if (mode === 'octagon') {
    return Array.from({ length: 8 }, (_, i) => ({
      seatIndex: i,
      name: i === 0 ? 'You' : `Bot ${i + 1}`,
      colorHex: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      label: `0${i + 1}`,
      isBot: i !== 0,
      botDifficulty: 'normal',
    }));
  }

  if (mode === 'decagon') {
    return Array.from({ length: 10 }, (_, i) => ({
      seatIndex: i,
      name: i === 0 ? 'You' : `Bot ${i + 1}`,
      colorHex: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      label: i < 9 ? `0${i + 1}` : '10',
      isBot: i !== 0,
      botDifficulty: 'normal',
    }));
  }

  // Classic 4P
  return [
    { seatIndex: 0, name: 'You', colorHex: DEFAULT_COLORS[0], label: 'P1', isBot: false, botDifficulty: 'normal' },
    { seatIndex: 1, name: 'Samantha Bot', colorHex: DEFAULT_COLORS[3], label: 'P2', isBot: true, botDifficulty: 'normal' },
    { seatIndex: 2, name: 'Marcus Bot', colorHex: DEFAULT_COLORS[1], label: 'P3', isBot: true, botDifficulty: 'normal' },
    { seatIndex: 3, name: 'Devin Bot', colorHex: DEFAULT_COLORS[2], label: 'P4', isBot: true, botDifficulty: 'normal' },
  ];
}
