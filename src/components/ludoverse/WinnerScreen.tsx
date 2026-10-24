import React, { useEffect, useState } from 'react';
import { Trophy, Share2, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button, AppAvatar, SkeletonBox, Toast } from './UIComponents';
import { GameWinnerStats, ScreenStateMode } from '../../types/ludoverse';
import { useI18n } from '../../utils/i18n';

interface WinnerScreenProps {
  stats?: GameWinnerStats | null;
  onPlayAgain?: () => void;
  onBackToLobby?: () => void;
  onBackLobby?: () => void;
  stateMode?: ScreenStateMode;
}

const defaultStats: GameWinnerStats = {
  winnerId: 'p1',
  winnerName: 'Devin',
  winnerAvatar: null,
  winnerColor: 'red',
  moves: 42,
  timeSeconds: 320,
  kills: 3,
};

export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  stats = defaultStats,
  onPlayAgain = () => {},
  onBackToLobby,
  onBackLobby,
  stateMode = 'DATA',
}) => {
  const { t } = useI18n();
  const handleLobby = onBackLobby || onBackToLobby || (() => {});
  const [confettiPieces, setConfettiPieces] = useState<
    { id: number; left: number; delay: number; color: string; size: number }[]
  >([]);
  const [showStats, setShowStats] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isLoading = stateMode === 'LOADING';
  const isEmpty = stateMode === 'EMPTY';

  useEffect(() => {
    // Generate exactly 100 celebratory confetti particles (falling, 3s loop)
    const colors = ['#E63946', '#2A9D8F', '#F4A261', '#457B9D', '#FFD166', '#06D6A0'];
    const pieces = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 7 + 5,
    }));
    setConfettiPieces(pieces);

    // Fade-in stats card after 500ms
    const timer = setTimeout(() => setShowStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'AK MIND TRAINER Champion!',
        text: `I just won a match on AK MIND TRAINER!`,
      }).catch(() => {});
    } else {
      setToastMessage(t('victoryShared'));
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const winnerDisplayName = !isEmpty && stats?.winnerName?.trim() ? stats.winnerName.trim() : null;

  const formattedTime =
    stats?.timeSeconds !== null && stats?.timeSeconds !== undefined
      ? `${Math.floor(stats.timeSeconds / 60)}m ${stats.timeSeconds % 60}s`
      : '-';

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-hidden relative pt-4">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Confetti Animation (100 particles, falling 3s loop) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {confettiPieces.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-xs"
            style={{
              left: `${p.left}%`,
              top: `-15px`,
              width: `${p.size}px`,
              height: `${p.size * 1.5}px`,
              backgroundColor: p.color,
              animation: `confettiFall 3s linear infinite`,
              animationDelay: `${p.delay}s`,
              transform: `rotate(${p.id * 18}deg)`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Top Header: Share button top-right */}
      <div className="z-10 flex items-center justify-between">
        <button
          onClick={onBackToLobby}
          className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-current"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="font-heading text-xs font-bold tracking-widest text-[#F4A261] uppercase">
          Match Complete
        </span>

        {/* Share icon button top-right */}
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-[#E63946] text-white hover:bg-[#d62839] active:scale-95 transition-all flex items-center justify-center shadow-md"
          aria-label="Share victory"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Center Stage: Golden Trophy (120dp) + Winner Avatar (96dp) + Name (28sp) + "Winner!" */}
      <div className="z-10 flex flex-col items-center my-auto text-center">
        {/* Golden Trophy (120dp, subtle glow) — scale-in animation */}
        <div className="w-[120px] h-[120px] rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-3 shadow-2xl shadow-amber-500/30 animate-in zoom-in-75 duration-500">
          <Trophy className="w-16 h-16 fill-amber-400" />
        </div>

        {/* Winner Avatar (96dp) below trophy */}
        {isLoading ? (
          <SkeletonBox className="w-24 h-24 !rounded-full mb-3" />
        ) : (
          <div className="relative mb-3">
            <AppAvatar
              photoUrl={!isEmpty ? stats?.winnerAvatar : null}
              name={winnerDisplayName}
              size={96}
              className="ring-4 ring-amber-400 shadow-2xl"
            />
          </div>
        )}

        {/* Winner Name (Poppins Bold 28sp) — from real data, no fallback */}
        {isLoading ? (
          <SkeletonBox className="h-8 w-44 mb-2" />
        ) : (
          <h2 className="font-heading text-[28px] font-bold tracking-tight">
            {winnerDisplayName || 'Not set'}
          </h2>
        )}

        {/* "Winner!" text below (Inter 16sp, grey) */}
        <p className="text-[16px] text-[#8D99AE] font-medium tracking-wide mt-0.5">
          {t('winnerExclamation')}
        </p>

        {/* Stats Card: 3-column grid (fade-in after 500ms) */}
        <div
          className={`mt-6 w-full max-w-[320px] p-4 rounded-2xl bg-white/95 dark:bg-[#16213E]/95 border border-slate-200 dark:border-slate-800 shadow-lg backdrop-blur-md flex items-center justify-around transition-all duration-500 ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {isLoading ? (
            <>
              <SkeletonBox className="h-10 w-16" />
              <SkeletonBox className="h-10 w-16" />
              <SkeletonBox className="h-10 w-16" />
            </>
          ) : (
            <>
              {/* Column 1: Moves taken */}
              <div>
                <span className="text-[10px] text-[#8D99AE] uppercase font-bold tracking-wider">
                  {t('moves')}
                </span>
                <p className="font-heading text-base font-bold mt-0.5">
                  {!isEmpty && stats?.moves !== null && stats?.moves !== undefined ? stats.moves : '-'}
                </p>
              </div>

              <div className="w-[1px] h-8 bg-slate-300 dark:bg-slate-700" />

              {/* Column 2: Total time */}
              <div>
                <span className="text-[10px] text-[#8D99AE] uppercase font-bold tracking-wider">
                  {t('totalTime')}
                </span>
                <p className="font-heading text-base font-bold mt-0.5">
                  {!isEmpty ? formattedTime : '-'}
                </p>
              </div>

              <div className="w-[1px] h-8 bg-slate-300 dark:bg-slate-700" />

              {/* Column 3: Tokens captured */}
              <div>
                <span className="text-[10px] text-[#8D99AE] uppercase font-bold tracking-wider">
                  {t('captured')}
                </span>
                <p className="font-heading text-base font-bold text-[#EF476F] mt-0.5">
                  {!isEmpty && stats?.kills !== null && stats?.kills !== undefined ? stats.kills : '-'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Buttons (Stacked, bottom): Play Again (primary red) + Back to Lobby (outlined) */}
      <div className="z-10 space-y-3 pt-2">
        <Button variant="primary" onClick={onPlayAgain} className="w-full !h-[52px]">
          <RotateCcw className="w-4 h-4 mr-1.5" />
          {t('playAgain')}
        </Button>

        <Button variant="secondary" onClick={handleLobby} className="w-full !h-[52px]">
          {t('backToLobby')}
        </Button>
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(850px) rotate(720deg); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};
