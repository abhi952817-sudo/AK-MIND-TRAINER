import React, { useEffect, useState } from 'react';
import { COLORS } from '../../../types/ludoverse';
import { toast } from '../UIComponents';

export const RewardedAdModal: React.FC<{
  open: boolean;
  rewardCoins?: number;
  onClose: () => void;
  onReward: (coins: number) => void;
}> = ({ open, rewardCoins = 1, onClose, onReward }) => {
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      setLoading(true);
      setCountdown(5);
      setFinished(false);
      setError(false);
      return;
    }
    // Simulate ad loading
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open && !loading && !error && countdown > 0 && !finished) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (open && countdown === 0 && !finished && !error) {
      setFinished(true);
      onReward(rewardCoins);
    }
  }, [open, loading, countdown, finished, error, rewardCoins, onReward]);

  if (!open) return null;

  const canClose = countdown === 0 || finished;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={() => {
          if (!canClose) {
            toast('Wait for the ad to finish', 'error');
            return;
          }
          if (!finished) toast('Reward not earned', 'error');
          onClose();
        }}
        className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
        style={{
          background: canClose ? COLORS.red : '#333',
          opacity: canClose ? 1 : 0.6,
        }}
      >
        ✕
      </button>

      {/* Content */}
      <div className="w-full max-w-md px-6 flex flex-col items-center gap-6">
        {loading ? (
          <div className="w-full aspect-video rounded-[12px] flex items-center justify-center" style={{ background: '#111' }}>
            <div className="w-10 h-10 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="w-full aspect-video rounded-[12px] flex flex-col items-center justify-center gap-3" style={{ background: '#111' }}>
            <span className="text-4xl">⚠️</span>
            <span className="text-white text-sm">Ad unavailable, try again</span>
            <button
              onClick={() => { setError(false); setLoading(true); setCountdown(5); setTimeout(() => setLoading(false), 800); }}
              className="px-4 py-2 rounded-full text-white text-sm font-semibold"
              style={{ background: COLORS.red }}
            >
              Retry
            </button>
          </div>
        ) : !finished ? (
          <>
            <div className="w-full aspect-video rounded-[12px] flex items-center justify-center relative" style={{ background: '#111' }}>
              <span className="text-6xl">▶️</span>
              <span className="absolute bottom-3 right-3 text-white text-xs px-2 py-1 rounded" style={{ background: '#00000088' }}>
                {countdown}s
              </span>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Watching ad...</p>
              <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
                Reward will be granted after {countdown}s
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4" style={{ animation: 'scale-in .3s ease' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: COLORS.success + '22' }}>
              <span className="text-4xl" style={{ color: COLORS.success }}>✓</span>
            </div>
            <p className="text-white font-semibold text-lg">+{rewardCoins} Coin</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-3 rounded-full text-white font-semibold cursor-pointer"
              style={{ background: COLORS.red }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
