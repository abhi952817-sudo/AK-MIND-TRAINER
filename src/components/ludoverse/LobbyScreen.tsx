import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Users, DoorOpen, Globe, Lock, Shield, Check } from 'lucide-react';
import { Button, EmptyStateWidget, SkeletonBox, ErrorBanner, AppAvatar } from './UIComponents';
import { ActiveRoomSummary, ScreenStateMode, StateMode } from '../../types/ludoverse';
import { BoardPlayerCount } from '../../games/ludo/polygonalBoardGeometry';
import { TeamMode } from '../../games/ludo/teamRules';

export interface RoomConfigOptions {
  isPrivate: boolean;
  boardPlayerCount: BoardPlayerCount;
  gameMode: 'solo' | 'team';
  teamMode: TeamMode;
  teamAssignment: 'opposite_auto' | 'custom_manual';
}

interface LobbyScreenProps {
  onBack: () => void;
  onJoinRoom?: (roomCode: string) => void;
  onEnterRoom?: (roomCode: string, options?: RoomConfigOptions) => void;
  onCreateRoom?: (isPrivate: boolean, maxPlayers: number, options?: RoomConfigOptions) => void;
  activeRooms?: ActiveRoomSummary[];
  state?: StateMode | ScreenStateMode;
  stateMode?: ScreenStateMode;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onBack,
  onJoinRoom,
  onEnterRoom,
  onCreateRoom,
  state,
  stateMode,
}) => {
  const effectiveState = String(state || stateMode || 'DATA').toUpperCase();
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '']);
  const [isPrivate, setIsPrivate] = useState(false);
  const [boardCount, setBoardCount] = useState<BoardPlayerCount>(4);
  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [teamType, setTeamType] = useState<TeamMode>('jodi_2v2');
  const [teamAssignment, setTeamAssignment] = useState<'opposite_auto' | 'custom_manual'>('opposite_auto');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available team modes based on board count
  const availableTeamModes: { id: TeamMode; label: string; desc: string }[] = (() => {
    switch (boardCount) {
      case 4:
        return [{ id: 'jodi_2v2', label: '2v2 Pairs', desc: 'Opposite players form partners' }];
      case 6:
        return [
          { id: 'pairs_2p', label: '3 Pairs (2 Players Each)', desc: 'Opposite partners across 6 arms' },
          { id: 'trios_3p', label: '2 Trios (3 Players Each)', desc: 'Alternating triangle teams' },
        ];
      case 8:
        return [
          { id: 'pairs_2p', label: '4 Pairs (2 Players Each)', desc: 'Opposite partners across octagon' },
          { id: 'squads_4v4', label: '4 vs 4 Squad Battle', desc: 'Two big teams facing off' },
        ];
      case 9:
        return [
          { id: 'trios_3p', label: '3 Trios (3 Players Each)', desc: 'Triangular alliance teams' },
        ];
      case 10:
        return [
          { id: 'pairs_2p', label: '5 Pairs (2 Players Each)', desc: 'Opposite partners across 10 arms' },
          { id: 'squads_5v5', label: '5 vs 5 Squad Battle', desc: '5 players per super-team' },
        ];
      default:
        return [];
    }
  })();

  const canTeamMode = availableTeamModes.length > 0;
  const effectiveTeamType = !canTeamMode || gameMode === 'solo' ? 'individual' : (
    availableTeamModes.some(m => m.id === teamType) ? teamType : availableTeamModes[0].id
  );

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const isLoading = effectiveState === 'LOADING';
  const isEmpty = effectiveState === 'EMPTY';
  const isError = effectiveState === 'ERROR';

  useEffect(() => {
    if (effectiveState === 'DATA') {
      setCodeDigits(['8', '4', '2', '1']);
      setErrorMessage(null);
    } else if (effectiveState === 'EMPTY') {
      setCodeDigits(['', '', '', '']);
      setErrorMessage(null);
    } else if (effectiveState === 'ERROR') {
      setCodeDigits(['9', '9', '9', '9']);
      setErrorMessage('Room not found. Check the code.');
    }
  }, [effectiveState]);

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...codeDigits];
    newDigits[index] = cleaned;
    setCodeDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance
    if (cleaned && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasted) return;
    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setCodeDigits(newDigits);
    if (pasted.length === 4) {
      inputRefs[3].current?.focus();
    }
  };

  const handleJoin = () => {
    const code = codeDigits.join('');
    if (code.length < 4) {
      setErrorMessage('Please enter all 4 digits');
      return;
    }
    if (code === '0000') {
      setErrorMessage('Room is full.');
      return;
    }
    onJoinRoom?.(code);
    onEnterRoom?.(code);
  };

  // Active rooms strictly using real-shaped items when DATA, empty otherwise
  const displayedRooms: ActiveRoomSummary[] =
    effectiveState === 'DATA'
      ? [
          {
            id: 'room-101',
            code: '8421',
            hostName: 'Devin',
            currentPlayers: 3,
            maxPlayers: 4,
            isPrivate: false,
          },
          {
            id: 'room-102',
            code: '6312',
            hostName: 'Samantha',
            currentPlayers: 1,
            maxPlayers: 2,
            isPrivate: false,
          },
        ]
      : [];

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar pt-4">
      {/* Top Bar with Back Arrow + "Ludo Lobby" title */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-current" />
          </button>
          <h1 className="font-heading text-xl font-semibold">Ludo Lobby</h1>
        </div>

        {/* Tabs (Segmented control): "Join Room" | "Create Room" */}
        <div className="flex rounded-2xl bg-black/5 dark:bg-white/5 p-1 border border-slate-300 dark:border-slate-700/60 mb-6">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'join'
                ? 'bg-[#E63946] text-white shadow-md'
                : 'text-[#8D99AE] hover:text-current'
            }`}
          >
            Join Room
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-[#E63946] text-white shadow-md'
                : 'text-[#8D99AE] hover:text-current'
            }`}
          >
            Create Room
          </button>
        </div>
      </div>

      {/* Error banner if triggered */}
      {errorMessage && (
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}

      {/* Tab Content */}
      <div className="flex-1 my-2">
        {activeTab === 'join' ? (
          <div>
            {/* 4 Input Boxes (each 56×56dp, 12sp radius) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
              <label className="text-xs font-semibold text-[#8D99AE] uppercase tracking-wider block mb-3 text-center">
                Enter 4-Digit Room Code
              </label>

              <div className="flex justify-center gap-3 mb-4">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={codeDigits[idx]}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className="w-14 h-14 text-center font-heading text-2xl font-bold rounded-[12px] border border-slate-300 dark:border-slate-700 bg-transparent focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {/* Join Button (full width, disabled until 4 digits entered) */}
              <Button
                variant="primary"
                onClick={handleJoin}
                isLoading={isLoading}
                disabled={codeDigits.some((d) => !d)}
                className="w-full h-[52px]"
              >
                Join
              </Button>
            </div>

            {/* 24dp gap */}
            <div className="h-6" />

            {/* "Active Rooms" section header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8D99AE]">
                Active Rooms
              </span>
            </div>

            {/* Rooms List */}
            {isLoading ? (
              /* LOADING: 3 shimmer room cards */
              <div className="space-y-3">
                <SkeletonBox className="h-16 w-full rounded-xl" />
                <SkeletonBox className="h-16 w-full rounded-xl" />
                <SkeletonBox className="h-16 w-full rounded-xl" />
              </div>
            ) : isEmpty || displayedRooms.length === 0 ? (
              /* EMPTY: Centered icon (door) + "No active rooms" + "Create one?" button (red) */
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-transparent">
                <EmptyStateWidget
                  icon={<DoorOpen className="w-8 h-8" />}
                  message="No active rooms"
                  actionText="Create one?"
                  onAction={() => setActiveTab('create')}
                />
              </div>
            ) : (
              /* Card: host avatar + host name + players count + "Join" chip */
              <div className="space-y-3">
                {displayedRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      onJoinRoom?.(room.code);
                      onEnterRoom?.(room.code);
                    }}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-[#E63946]/50 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <AppAvatar name={room.hostName} size={40} />
                      <div>
                        <h4 className="font-heading text-xs font-bold">
                          {room.hostName ? `${room.hostName}'s Room` : 'Open Room'}
                        </h4>
                        <span className="text-[11px] text-[#8D99AE]">Code: {room.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[#2A9D8F] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {room.currentPlayers}/{room.maxPlayers}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinRoom?.(room.code);
                          onEnterRoom?.(room.code);
                        }}
                        className="px-3 py-1 rounded-full bg-[#E63946] text-white text-xs font-bold hover:bg-[#d62839] active:scale-95 transition-all shadow-sm"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Create Room Tab */
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* 1. Board Type Selection (4, 5, 6, 8, 9, 10 Players) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#8D99AE] uppercase tracking-wider block">
                  Select Board Layout
                </label>
                <span className="text-[11px] font-bold text-[#E63946] bg-[#E63946]/10 px-2 py-0.5 rounded-full">
                  {boardCount} Players
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 4, shape: 'Square', icon: '🎲' },
                  { count: 5, shape: 'Pentagon', icon: '⬟' },
                  { count: 6, shape: 'Hexagon', icon: '⬡' },
                  { count: 8, shape: 'Octagon', icon: '🔷' },
                  { count: 9, shape: 'Enneagon', icon: '💠' },
                  { count: 10, shape: 'Decagon', icon: '⭐' },
                ].map((b) => (
                  <button
                    key={b.count}
                    type="button"
                    onClick={() => {
                      setBoardCount(b.count as BoardPlayerCount);
                      if (b.count === 5) setGameMode('solo');
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                      boardCount === b.count
                        ? 'border-[#E63946] bg-[#E63946]/10 text-[#E63946] font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <span className="text-xs font-bold leading-tight">{b.count}P</span>
                    <span className="text-[10px] opacity-75">{b.shape}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Game Mode Selection (Solo vs Team Mode) */}
            <div>
              <label className="text-xs font-semibold text-[#8D99AE] uppercase tracking-wider block mb-2">
                Game Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGameMode('solo')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    gameMode === 'solo'
                      ? 'border-[#2A9D8F] bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-bold">Solo FFA</span>
                  <span className="text-[10px] opacity-75">Every player for themselves</span>
                </button>

                <button
                  type="button"
                  disabled={!canTeamMode}
                  onClick={() => setGameMode('team')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    !canTeamMode
                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                      : gameMode === 'team'
                      ? 'border-[#E63946] bg-[#E63946]/10 text-[#E63946] font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-xs font-bold">Team Mode</span>
                  <span className="text-[10px] opacity-75">
                    {canTeamMode ? 'Pairs / Trios / Squads' : 'Not for 5P'}
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Team Configurations & Assignment (When Team Mode is active) */}
            {gameMode === 'team' && canTeamMode && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Team Format
                  </span>
                  <div className="space-y-1.5">
                    {availableTeamModes.map((tm) => (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() => setTeamType(tm.id)}
                        className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                          effectiveTeamType === tm.id
                            ? 'border-[#E63946] bg-[#E63946]/15 text-[#E63946] font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div>{tm.label}</div>
                          <div className="text-[10px] text-slate-400">{tm.desc}</div>
                        </div>
                        {effectiveTeamType === tm.id && <Check className="w-4 h-4 text-[#E63946] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Team Assignment
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTeamAssignment('opposite_auto')}
                      className={`p-2 rounded-lg border text-center text-xs transition-all ${
                        teamAssignment === 'opposite_auto'
                          ? 'border-[#2A9D8F] bg-[#2A9D8F]/15 text-[#2A9D8F] font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Auto-Balance</div>
                      <div className="text-[10px] opacity-75">Opposite Seating</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamAssignment('custom_manual')}
                      className={`p-2 rounded-lg border text-center text-xs transition-all ${
                        teamAssignment === 'custom_manual'
                          ? 'border-[#2A9D8F] bg-[#2A9D8F]/15 text-[#2A9D8F] font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-semibold">Custom Manual</div>
                      <div className="text-[10px] opacity-75">Assign in Lobby</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Visibility: segmented (Public | Private) */}
            <div>
              <label className="text-xs font-semibold text-[#8D99AE] uppercase tracking-wider block mb-2">
                Room Privacy
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs ${
                    !isPrivate
                      ? 'border-[#2A9D8F] bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold'
                      : 'border-slate-300 dark:border-slate-700 text-[#8D99AE]'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Public Room</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs ${
                    isPrivate
                      ? 'border-[#F4A261] bg-[#F4A261]/10 text-[#F4A261] font-bold'
                      : 'border-slate-300 dark:border-slate-700 text-[#8D99AE]'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Private (Code)</span>
                </button>
              </div>
            </div>

            {/* Create Room Button (full width, red) */}
            <Button
              variant="primary"
              onClick={() => {
                const code = String(Math.floor(1000 + Math.random() * 9000));
                const roomOpts: RoomConfigOptions = {
                  isPrivate,
                  boardPlayerCount: boardCount,
                  gameMode,
                  teamMode: effectiveTeamType,
                  teamAssignment,
                };
                onCreateRoom?.(isPrivate, boardCount, roomOpts);
                onEnterRoom?.(code, roomOpts);
              }}
              isLoading={isLoading}
              className="w-full h-[52px]"
            >
              Create {boardCount}-Player Room
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
