import React, { useState } from 'react';
import { COLORS } from '../../../types/ludoverse';

/**
 * Banner ad placeholder.
 * - If no ad loaded → collapses to height 0 (no white gap).
 * - Labelled "AD" in corner.
 */
export const AdBanner: React.FC<{
  loaded?: boolean;
  onClose?: () => void;
  height?: number;
}> = ({ loaded = true, height = 50, onClose }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;
  if (!loaded) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div
      className="w-full flex items-center justify-center relative select-none"
      style={{
        height,
        background: '#0e0e1e',
        borderTop: '1px solid #8D99AE22',
      }}
    >
      <span
        className="absolute top-1 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
        style={{ background: '#8D99AE33', color: COLORS.textSecondary }}
      >
        AD
      </span>
      <span className="text-xs" style={{ color: COLORS.textSecondary }}>
        Advertisement
      </span>
      {onClose && (
        <button
          onClick={handleClose}
          aria-label="Close ad"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 text-[#8D99AE] hover:text-white transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
};
