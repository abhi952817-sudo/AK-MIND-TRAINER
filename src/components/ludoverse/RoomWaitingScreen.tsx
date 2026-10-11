import React, { useState } from 'react';
import { ArrowLeft, Copy, Share2, Crown, MessageSquare, Check } from 'lucide-react';
import { Button, AppAvatar, SkeletonBox, Toast, ConfirmDialog, ErrorBanner } from './UIComponents';
import { RoomPlayer, ScreenStateMode } from '../../types/ludoverse';

interface RoomWaitingScreenProps {
  roomCode?: string;
  code?: string;
  players?: RoomPlayer[];
  currentUserId?: string;
  onLeaveRoom?: () => void;
  onLeave?: () => void;
  onToggleReady?: () => void;
  onStartGame?: () => void;
  onStart?: () => void;
  onOpenChat?: () => void;
  onChat?: () => void;
  unreadChatCount?: number;
  stateMode?: ScreenStateMode;
}

export const RoomWaitingScreen: React.FC<RoomWaitingScreenProps> = ({
  roomCode,
  code,
  players = [
    { id: 'p1', name: 'Devin', photoUrl: null, color: 'red', isReady: true, isHost: true },
    { id: 'p2', name: 'Samantha', photoUrl: null, color: 'green', isReady: true, isHost: false },
    { id: 'p3', name: 'Marcus', photoUrl: null, color: 'blue', isReady: false, isHost: false },
  ],
  currentUserId = 'p1',
  onLeaveRoom,
  onLeave,
  onToggleReady = () => {},
  onStartGame,
  onStart,
  onOpenChat,
  onChat,
  unreadChatCount = 1,
  stateMode = 'DATA',
}) => {
  const activeRoomCode = code || roomCode || '4218';
  const handleLeave = onLeave || onLeaveRoom || (() => {});
  const handleStart = onStart || onStartGame || (() => {});
  const handleChat = onChat || onOpenChat || (() => {});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const isLoading = stateMode === 'LOADING';
  const isEmpty = stateMode === 'EMPTY';
  const isError = stateMode === 'ERROR';

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activeRoomCode);
    setToastMessage('Code copied');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my AK MIND TRAINER match',
        text: `Play with me on AK MIND TRAINER! Room code: ${activeRoomCode}`,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const currentUser = players.find((p) => p.id === currentUserId);
  const isCurrentUserReady = currentUser?.isReady || false;
  const isHost = currentUser?.isHost || (players.length > 0 && players[0].id === currentUserId);

  // Ready and Start constraints
  const readyCount = players.filter((p) => p.isReady).length;
  const canHostStart = players.length >= 2 && players.every((p) => p.isReady);

  // 4 seats in square layout (96dp):
  // Red (top-left), Green (top-right), Blue (bottom-left), Yellow (bottom-right)
  const seats: { index: number; color: 'red' | 'green' | 'blue' | 'yellow' }[] = [
    { index: 0, color: 'red' },
    { index: 1, color: 'green' },
    { index: 2, color: 'blue' },
    { index: 3, color: 'yellow' },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar relative pt-4">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Leave Room Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        title="Leave Room"
        message="Are you sure you want to leave this room?"
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          handleLeave();
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      {/* Top Bar: Back/Leave button, Room code (Poppins Bold 24sp), Share button */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Leave room"
          >
            <ArrowLeft className="w-5 h-5 text-current" />
          </button>

          <span className="text-xs font-bold uppercase tracking-wider text-[#8D99AE]">
            Match Lobby
          </span>

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-[#E63946] text-white hover:bg-[#d62839] active:scale-95 transition-all flex items-center justify-center shadow-md"
            aria-label="Share room"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Room Code Card (large Poppins Bold 24sp + Copy icon) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between mb-2">
          <div>
            <span className="text-[11px] uppercase font-bold text-[#8D99AE] tracking-wider block">
              Room Code
            </span>
            <span className="font-heading text-[24px] font-bold tracking-widest text-[#E63946]">
              {roomCode}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5"
            aria-label="Copy room code"
          >
            <Copy className="w-4 h-4 text-[#8D99AE]" />
            <span>Copy</span>
          </button>
        </div>

        {isError && (
          <ErrorBanner
            message="Lost connection with game coordinator. Reconnecting..."
            onRetry={() => setToastMessage('Reconnecting to room...')}
          />
        )}
      </div>

      {/* Center — 4-Seat Layout (Square Arrangement, Each Seat 96dp) */}
      <div className="my-auto py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 max-w-[280px] mx-auto">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <SkeletonBox className="w-[96px] h-[96px] !rounded-full mb-2" />
                <SkeletonBox className="w-16 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 max-w-[290px] mx-auto">
            {seats.map((seat) => {
              const player = !isEmpty && players[seat.index];
              const isMe = player && player.id === currentUserId;

              return (
                <div key={seat.index} className="flex flex-col items-center text-center">
                  {player ? (
                    /* Occupied Seat (96dp) */
                    <div className="relative">
                      {/* Host seat crown icon top-right */}
                      {player.isHost && (
                        <div className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md z-10">
                          <Crown className="w-3.5 h-3.5 fill-current" />
                        </div>
                      )}

                      <AppAvatar
                        photoUrl={player.photoUrl}
                        name={player.name}
                        size={96}
                        className={`w-[96px] h-[96px] text-2xl ring-4 ${
                          isMe ? 'ring-[#E63946] shadow-lg shadow-red-500/20' : 'ring-slate-300 dark:ring-slate-700'
                        }`}
                      />

                      {/* Small "Ready" badge (green) if ready */}
                      {player.isReady && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#06D6A0] text-slate-950 shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          READY
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Empty Seat: dashed circle border + "Waiting..." (grey, italic) */
                    <div className="w-[96px] h-[96px] rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[#8D99AE] bg-black/5 dark:bg-white/5">
                      <span className="text-xs italic text-[#8D99AE]">Waiting...</span>
                    </div>
                  )}

                  {/* Player Name below */}
                  <span className="mt-3 font-heading text-xs font-semibold truncate max-w-[100px]">
                    {player ? player.name || 'Not set' : `Seat ${seat.index + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Informational State text */}
        {!isLoading && !isEmpty && (
          <div className="text-center mt-6">
            {players.length < 2 ? (
              <p className="text-xs text-[#F4A261] font-medium">
                Waiting for players to ready up (2+ players required)
              </p>
            ) : !isHost && isCurrentUserReady ? (
              <p className="text-xs text-[#2A9D8F] font-medium animate-pulse">
                Waiting for host to start the game...
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Floating Chat Button with unread count */}
      <div className="relative">
        <button
          onClick={handleChat}
          className="absolute right-0 -top-16 w-12 h-12 rounded-full bg-[#16213E] dark:bg-white text-white dark:text-[#16213E] shadow-xl flex items-center justify-center active:scale-95 transition-transform border border-white/20 z-20"
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E63946] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* Bottom Section: Ready Button + Host Start Game */}
      <div className="space-y-3 pt-2">
        {/* "Ready" Button (large, full width): Not ready outlined, Ready filled green */}
        <button
          onClick={onToggleReady}
          className={`h-[52px] w-full rounded-[24px] font-semibold text-sm transition-all duration-100 flex items-center justify-center gap-2 select-none shadow-md active:scale-[0.97] ${
            isCurrentUserReady
              ? 'bg-[#06D6A0] text-slate-950 hover:bg-[#05bf8e]'
              : 'bg-transparent border-2 border-slate-400 text-slate-400 dark:text-slate-300'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{isCurrentUserReady ? 'Ready ✓' : 'Tap when ready'}</span>
        </button>

        {/* Host only: Start Game button (disabled until 2+ players ready) */}
        {isHost && (
          <div className="relative group">
            <Button
              variant="primary"
              onClick={handleStart}
              disabled={!canHostStart}
              className="w-full h-[52px]"
            >
              Start Game
            </Button>
            {!canHostStart && (
              <span className="block text-center text-[11px] text-[#8D99AE] mt-1.5">
                Waiting for players to ready up
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
