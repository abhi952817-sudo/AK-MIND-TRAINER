import React, { useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { ScreenStateMode } from '../../types/ludoverse';

interface SplashScreenProps {
  onFinish?: () => void;
  onDone?: (hasUser: boolean) => void;
  autoRoute?: boolean;
  stateMode?: ScreenStateMode;
  onRetry?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  onDone,
  autoRoute = true,
  stateMode = 'DATA',
  onRetry,
}) => {
  const onDoneRef = React.useRef(onDone);
  const onFinishRef = React.useRef(onFinish);

  useEffect(() => {
    onDoneRef.current = onDone;
    onFinishRef.current = onFinish;
  });

  const handleInstantProceed = () => {
    // Splash screen must never assume that a user is logged in.
    if (onDoneRef.current) {
      onDoneRef.current(false);
    } else {
      onFinishRef.current?.();
    }
  };

  useEffect(() => {
    if (!autoRoute || stateMode === 'ERROR') return;

    const timer = setTimeout(() => {
      handleInstantProceed();
    }, 600);

    return () => clearTimeout(timer);
  }, [autoRoute, stateMode]);

  return (
    <div
      onClick={handleInstantProceed}
      title="Tap to continue"
      className="w-full h-full min-h-[580px] flex flex-col items-center justify-between p-8 select-none relative overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
        color: '#FFFFFF',
      }}
    >
      <div className="h-[20%]" />

      <div className="flex flex-col items-center">
        <div
          className="w-[120px] h-[120px] rounded-3xl bg-slate-900/90 border border-white/20 shadow-2xl p-5 flex flex-col justify-between items-center relative backdrop-blur-md"
          style={{
            animation: 'splashCubeRotate 4s ease-in-out infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="flex justify-between w-full">
            <div className="w-5 h-5 rounded-full bg-[#E63946] shadow-lg shadow-red-500/50" />
            <div className="w-5 h-5 rounded-full bg-[#2A9D8F] shadow-lg shadow-emerald-500/50" />
          </div>

          <div className="w-3.5 h-3.5 rounded-full bg-white/40" />

          <div className="flex justify-between w-full">
            <div className="w-5 h-5 rounded-full bg-[#457B9D] shadow-lg shadow-blue-500/50" />
            <div className="w-5 h-5 rounded-full bg-[#F4A261] shadow-lg shadow-amber-500/50" />
          </div>
        </div>

        <div className="h-6" />

        <h1 className="font-heading text-[32px] leading-tight font-bold tracking-wider text-white">
          LudoVerse
        </h1>

        <div className="h-2" />

        <p className="text-[14px] text-[#8D99AE] tracking-widest uppercase font-medium">
          Play. Compete. Win.
        </p>
      </div>

      <div className="flex-1" />

      <div className="pb-10 flex flex-col items-center">
        {stateMode === 'ERROR' ? (
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-[#EF476F]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-semibold">
                Connection failed. Check network.
              </span>
            </div>

            <button
              onClick={(event) => {
                event.stopPropagation();
                (onRetry || onFinish)?.();
              }}
              className="text-xs font-bold px-3 py-1 bg-[#E63946] text-white rounded-lg hover:bg-[#d62839] active:scale-95"
            >
              Retry Auth
            </button>
          </div>
        ) : (
          <Loader2 className="w-6 h-6 animate-spin text-[#E63946]" />
        )}
      </div>

      <style>{`
        @keyframes splashCubeRotate {
          0%, 100% {
            transform: perspective(600px) rotateY(-8deg) rotateX(4deg);
          }
          50% {
            transform: perspective(600px) rotateY(18deg) rotateX(-6deg);
          }
        }
      `}</style>
    </div>
  );
};
