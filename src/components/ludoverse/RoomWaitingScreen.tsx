import React, { useState } from 'react';
import { ArrowLeft, Copy, Share2, Crown, MessageSquare, Check, Shield, Users } from 'lucide-react';
import { Button, AppAvatar, SkeletonBox, Toast, ConfirmDialog, ErrorBanner } from './UIComponents';
import { RoomPlayer, ScreenStateMode } from '../../types/ludoverse';
import { BoardPlayerCount, getBoardConfig, PolygonalSectorInfo } from '../../games/ludo/polygonalBoardGeometry';
import { TeamMode, getTeamForPlayer } from '../../games/ludo/teamRules';

const SHAPE_NAMES: Record<BoardPlayerCount, string> = {
  4: 'Square',
  5: 'Pentagon',
  6: 'Hexagon',
  8: 'Octagon',
  9: 'Enneagon',
  10: 'Decagon',
};

interface RoomWaitingScreenProps {
  roomCode?: string;
  code?: string;
  boardPlayerCount?: BoardPlayerCount;
  gameMode?: 'solo' | 'team';
  teamMode?: TeamMode;
  teamAssignment?: 'opposite_auto' | 'custom_manual';
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
  boardPlayerCount = 4,
  gameMode = 'solo',
  teamMode = 'individual',
  teamAssignment = 'opposite_auto',
  players: customPlayers,
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

  const config = getBoardConfig(boardPlayerCount);
  const sectors = config.sectors;
  const shapeName = SHAPE_NAMES[boardPlayerCount];

  // Build default players if none provided
  const players: RoomPlayer[] = customPlayers || sectors.map((sec: PolygonalSectorInfo, idx: number) => {
    if (idx === 0) return { id: currentUserId, name: 'You (Host)', photoUrl: null, color: sec.color, isReady: true, isHost: true };
    if (idx === 1) return { id: `p${idx+1}`, name: 'Samantha', photoUrl: null, color: sec.color, isReady: true, isHost: false };
    if (idx === 2) return { id: `p${idx+1}`, name: 'Marcus', photoUrl: null, color: sec.color, isReady: true, isHost: false };
    return { id: `p${idx+1}`, name: `${sec.name} Bot`, photoUrl: null, color: sec.color, isReady: true, isHost: false };
  });

  const currentUser = players.find((p) => p.id === currentUserId);
  const isCurrentUserReady = currentUser?.isReady || false;
  const isHost = currentUser?.isHost || (players.length > 0 && players[0].id === currentUserId);

  // Ready and Start constraints
  const readyCount = players.filter((p) => p.isReady).length;
  const canHostStart = players.length >= 2 && players.every((p) => p.isReady);

  const seats = sectors.map((sec: PolygonalSectorInfo, idx: number) => {
    const team = gameMode === 'team' ? getTeamForPlayer(idx, boardPlayerCount, teamMode) : null;
    return {
      index: idx,
      name: sec.name,
      color: sec.color,
      team,
    };
  });

  const gridColsClass = boardPlayerCount <= 4 ? 'grid-cols-2 max-w-[280px]' : boardPlayerCount <= 6 ? 'grid-cols-3 max-w-[360px]' : 'grid-cols-4 max-w-[440px]';

  return (
    <div className="w-full h-full flex flex-col justify-between p-5 select-none overflow-y-auto no-scrollbar relative pt-3">
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

      {/* Top Bar: Back/Leave button, Room info, Share button */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
            aria-label="Leave room"
          >
            <ArrowLeft className="w-5 h-5 text-current" />
          </button>

          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8D99AE] block">
              Match Lobby
            </span>
            <div className="text-[11px] font-semibold text-[#E63946] flex items-center gap-1 justify-center">
              <span>{boardPlayerCount}-Player {shapeName}</span>
              <span>•</span>
              <span>{gameMode === 'team' ? `Team (${teamMode.replace('_', ' ')})` : 'Solo FFA'}</span>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-[#E63946] text-white hover:bg-[#d62839] active:scale-95 transition-all flex items-center justify-center shadow-md"
            aria-label="Share room"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Room Code Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8D99AE] tracking-wider block">
              Room Code
            </span>
            <span className="font-heading text-[22px] font-bold tracking-widest text-[#E63946]">
              {activeRoomCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
              {readyCount}/{boardPlayerCount} Ready
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5"
              aria-label="Copy room code"
            >
              <Copy className="w-3.5 h-3.5 text-[#8D99AE]" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {isError && (
          <ErrorBanner
            message="Lost connection with game coordinator. Reconnecting..."
            onRetry={() => setToastMessage('Reconnecting to room...')}
          />
        )}
      </div>

      {/* Center — Dynamic Seats Layout based on board configuration */}
      <div className="my-auto py-4">
        {isLoading ? (
          <div className={`grid ${gridColsClass} gap-4 mx-auto`}>
            {sectors.map((_: PolygonalSectorInfo, i: number) => (
              <div key={i} className="flex flex-col items-center">
                <SkeletonBox className="w-[72px] h-[72px] !rounded-full mb-2" />
                <SkeletonBox className="w-14 h-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-3 mx-auto`}>
            {seats.map((seat: { index: number; name: string; color: string; team: any }) => {
              const player = !isEmpty && players[seat.index];
              const isMe = player && player.id === currentUserId;
              const avatarSize = boardPlayerCount <= 4 ? 80 : boardPlayerCount <= 6 ? 64 : 54;

              return (
                <div key={seat.index} className="flex flex-col items-center text-center relative">
                  {player ? (
                    <div className="relative">
                      {player.isHost && (
                        <div className="absolute -top-1.5 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-md z-10">
                          <Crown className="w-3 h-3 fill-current" />
                        </div>
                      )}

                      <div
                        className="rounded-full p-0.5"
                        style={{ border: `3px solid ${seat.color}` }}
                      >
                        <AppAvatar
                          photoUrl={player.photoUrl}
                          name={player.name}
                          size={avatarSize}
                          className={`text-sm ${
                            isMe ? 'ring-2 ring-[#E63946] shadow-md shadow-red-500/20' : ''
                          }`}
                        />
                      </div>

                      {player.isReady && (
                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#06D6A0] text-slate-950 shadow-sm flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          READY
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{ width: avatarSize, height: avatarSize }}
                      className="rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[#8D99AE] bg-black/5 dark:bg-white/5"
                    >
                      <span className="text-[10px] italic text-[#8D99AE]">Waiting</span>
                    </div>
                  )}

                  {/* Player Name and Sector / Team badge */}
                  <span className="mt-1.5 font-heading text-[11px] font-semibold truncate max-w-[80px]">
                    {player ? player.name : seat.name}
                  </span>

                  {seat.team && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 border"
                      style={{
                        borderColor: seat.team.teamColor,
                        color: seat.team.teamColor,
                        backgroundColor: `${seat.team.teamColor}15`,
                      }}
                    >
                      {seat.team.teamName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Informational State text */}
        {!isLoading && !isEmpty && (
          <div className="text-center mt-4">
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
