import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running in standalone PWA or native app mode, hide install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS (e.g. standard desktop browser that doesn't trigger prompt yet),
  // we still allow user to view instructions or trigger install
  const canPrompt = isInstallable || isIOS;
  if (!canPrompt) {
    return null;
  }

  if (installSuccess) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold ${className}`}>
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>Installed!</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Install App"
        className={
          variant === 'compact'
            ? `flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-transform active:scale-95 ${className}`
            : `w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all active:scale-[0.98] ${className}`
        }
      >
        {isIOS ? (
          <Smartphone className="w-4 h-4 shrink-0" />
        ) : (
          <Download className="w-4 h-4 shrink-0" />
        )}
        <span>{isIOS ? 'Install on iPhone/iPad' : 'Install App (APK/PWA)'}</span>
      </button>

      {/* iOS Safari Add to Home Screen Instructions Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Smartphone className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-300">Install on iOS / Safari</h3>
                <p className="text-xs text-gray-400">Play full-screen with offline support</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-gray-300 bg-white/5 p-4 rounded-2xl border border-white/10">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                <span>Tap the <strong>Share</strong> icon at the bottom of Safari (<span className="text-amber-400">⎋</span> or box with arrow).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                <span>Scroll down the action list and select <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                <span>Tap <strong>Add</strong> in the top right to launch AK LudoVerse as a native app!</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
