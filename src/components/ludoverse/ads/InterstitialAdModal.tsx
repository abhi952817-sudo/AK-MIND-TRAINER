import React, { useEffect, useState } from 'react';
import { COLORS } from '../../../types/ludoverse';

export const InterstitialAdModal: React.FC<{
  open: boolean;
  duration?: number; // seconds
  onClose: () => void;
}> = ({ open, duration = 5, onClose }) => {
  const [countdown, setCountdown] = useState(duration);

  useEffect(() => {
    if (!open) { setCountdown(duration); return; }
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, countdown, duration]);

  if (!open) return null;

  const canClose = countdown === 0;

  return (
    <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center animate-fade-in select-none">
      <button
        onClick={() => canClose && onClose()}
        disabled={!canClose}
        className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${
          canClose ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed'
        }`}
        style={{ background: canClose ? COLORS.red : '#333', opacity: canClose ? 1 : 0.6 }}
      >
        {canClose ? '✕' : countdown}
      </button>

      <div className="w-full max-w-md px-6 flex flex-col items-center gap-4">
        <div className="w-full aspect-video rounded-[12px] flex items-center justify-center relative overflow-hidden" style={{ background: '#111' }}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">📺</span>
            <span className="text-white text-lg font-semibold tracking-wide">Advertisement</span>
          </div>
          <span className="absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded bg-black/60 text-white/70">
            {canClose ? 'Finished' : `${countdown}s remaining`}
          </span>
        </div>
        <p className="text-xs" style={{ color: COLORS.textSecondary }}>
          {canClose ? 'You can close now' : `Closes in ${countdown}s`}
        </p>
      </div>
    </div>
  );
};
