import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Users, DoorOpen, Globe, Lock } from 'lucide-react';
import { Button, EmptyStateWidget, SkeletonBox, ErrorBanner, AppAvatar } from './UIComponents';
import { ActiveRoomSummary, ScreenStateMode, StateMode } from '../../types/ludoverse';

interface LobbyScreenProps {
  onBack: () => void;
  onJoinRoom?: (roomCode: string) => void;
  onEnterRoom?: (roomCode: string) => void;
  onCreateRoom?: (isPrivate: boolean, maxPlayers: 2 | 4) => void;
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
  const [maxPlayers, setMaxPlayers] = useState<2 | 4>(4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Visibility: segmented (Public | Private) */}
            <div>
              <label className="text-xs font-semibold text-[#8D99AE] uppercase tracking-wider block mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    !isPrivate
                      ? 'border-[#2A9D8F] bg-[#2A9D8F]/10 text-[#2A9D8F] font-bold'
                      : 'border-slate-300 dark:border-slate-700 text-[#8D99AE]'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-xs">Public</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    isPrivate
                      ? 'border-[#F4A261] bg-[#F4A261]/10 text-[#F4A261] font-bold'
                      : 'border-slate-300 dark:border-slate-700 text-[#8D99AE]'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span className="text-xs">Private (Code Only)</span>
                </button>
              </div>
            </div>

            {/* Max Players: segmented (2P | 4P) */}
            <div>
              <label className="text-xs font-semibold text-[#8D99AE] uppercase tracking-wider block mb-2">
                Max Players
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMaxPlayers(2)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    maxPlayers === 2
                      ? 'border-[#E63946] bg-[#E63946]/10 text-[#E63946] font-bold'
                      : 'border-slate-300 dark:border-slate-700 text-[#8D99AE]'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">2P</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMaxPlayers(4)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    maxPlayers === 4
                      ? 'border-[#E63946] bg-[#E63946]/10 text-[#E63946] font-bold'
                      : 'border-slate-300 dark:border-slate-700 text-[#8D99AE]'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">4P</span>
                </button>
              </div>
            </div>

            {/* Create Room Button (full width, red) */}
            <Button
              variant="primary"
              onClick={() => {
                const code = String(Math.floor(1000 + Math.random() * 9000));
                onCreateRoom?.(isPrivate, maxPlayers);
                onEnterRoom?.(code);
              }}
              isLoading={isLoading}
              className="w-full h-[52px]"
            >
              Create Room
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
