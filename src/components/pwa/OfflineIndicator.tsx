import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 border border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      <span>Offline Mode — Playing locally with saved state</span>
    </div>
  );
};
