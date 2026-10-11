import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Dice3DCubeProps {
  value: number; // 1 to 6
  isRolling?: boolean;
  rolling?: boolean;
  disabled?: boolean;
  onRoll?: () => void;
  accentColor?: string;
  theme?: 'dark' | 'light';
  showPopupResult?: boolean;
}

export const Dice3DCube: React.FC<Dice3DCubeProps> = ({
  value = 1,
  isRolling,
  rolling,
  disabled = false,
  onRoll,
  accentColor = '#E63946',
  theme = 'dark',
  showPopupResult = true,
}) => {
  const activeRolling = rolling !== undefined ? rolling : Boolean(isRolling);
  const [isPressed, setIsPressed] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(value || 1);
  const [popupNumber, setPopupNumber] = useState<number | null>(null);

  // Rotation turns counter to ensure every roll spins forward multiple times
  const rollTurns = useRef({ x: 0, y: 0, z: 0 });

  // Update displayValue when value changes and not rolling
  useEffect(() => {
    if (!activeRolling && value >= 1 && value <= 6) {
      setDisplayValue(value);
    }
  }, [value, activeRolling]);

  // Web Audio sound synthesizer for physical dice
  const playSound = (stage: 'start' | 'loop' | 'land') => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (stage === 'start') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } else if (stage === 'loop') {
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          const t = ctx.currentTime + i * 0.07;
          osc.frequency.setValueAtTime(200 + i * 35, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.06);
        }
      } else if (stage === 'land') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // Safe fallback
    }
  };

  // When rolling begins / ends
  useEffect(() => {
    if (activeRolling) {
      playSound('start');
      const loopTimer = setTimeout(() => playSound('loop'), 250);

      // Increment rotation turns so every roll spins multiple times forward
      rollTurns.current.x += 720;
      rollTurns.current.y += 1080;

      return () => clearTimeout(loopTimer);
    } else if (value >= 1 && value <= 6) {
      setDisplayValue(value);
      playSound('land');
      setBouncing(true);

      if (showPopupResult) {
        setPopupNumber(value);
        const hideTimer = setTimeout(() => setPopupNumber(null), 1000);
        const bounceTimer = setTimeout(() => setBouncing(false), 450);
        return () => {
          clearTimeout(hideTimer);
          clearTimeout(bounceTimer);
        };
      }
    }
  }, [activeRolling, value, showPopupResult]);

  const handleTap = () => {
    if (disabled || activeRolling) return;
    setIsPressed(true);
    setTimeout(() => {
      setIsPressed(false);
      onRoll?.();
    }, 80);
  };

  /**
   * EXACT 3D EULER ANGLES FOR ALL 6 FACES:
   * Face 1 (Front):  x = 0,   y = 0
   * Face 6 (Back):   x = 0,   y = 180
   * Face 3 (Right):  x = 0,   y = -90
   * Face 4 (Left):   x = 0,   y = 90
   * Face 2 (Top):    x = -90, y = 0
   * Face 5 (Bottom): x = 90,  y = 0
   *
   * These exact angles guarantee 100% that the rolled number faces DIRECTLY
   * at the user with ZERO error or ambiguity.
   */
  const getExactFaceAngles = (val: number): { x: number; y: number; z: number } => {
    switch (val) {
      case 1:
        return { x: 0, y: 0, z: 0 };
      case 2:
        return { x: -90, y: 0, z: 0 };
      case 3:
        return { x: 0, y: -90, z: 0 };
      case 4:
        return { x: 0, y: 90, z: 0 };
      case 5:
        return { x: 90, y: 0, z: 0 };
      case 6:
        return { x: 0, y: 180, z: 0 };
      default:
        return { x: 0, y: 0, z: 0 };
    }
  };

  const currentVal = activeRolling ? displayValue : (value || displayValue || 1);
  const baseAngle = getExactFaceAngles(currentVal);

  // Render authentic carved pips (dots)
  const renderDots = (count: number) => {
    // 3x3 grid positions:
    // 0 1 2
    // 3 4 5
    // 6 7 8
    const dotPositions: Record<number, number[]> = {
      1: [4],
      2: [2, 6],
      3: [2, 4, 6],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const active = dotPositions[count] || [4];
    const isOne = count === 1;

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-2.5 gap-1 place-items-center">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
          const isDot = active.includes(index);
          const isCenterAce = isOne && index === 4;

          return (
            <div key={index} className="w-3 h-3 flex items-center justify-center">
              {isDot && (
                <div
                  className={`rounded-full ${
                    isCenterAce ? 'w-4 h-4' : 'w-2.5 h-2.5'
                  }`}
                  style={{
                    backgroundColor: isCenterAce ? accentColor : '#1E1B4B',
                    boxShadow: isCenterAce
                      ? `inset 0 1.5px 2px rgba(0,0,0,0.5), 0 0 6px ${accentColor}aa`
                      : 'inset 0 1.5px 2px rgba(0,0,0,0.8), 0 0.5px 1px rgba(255,255,255,0.5)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Face styling with 3D acrylic bevel and subtle lighting
  const getFaceClass = (faceNumber: number) => {
    let bg = 'bg-gradient-to-br from-white to-[#EDF2F7]';
    if (faceNumber === 2) bg = 'bg-gradient-to-br from-white to-[#F7FAFC]';
    if (faceNumber === 5) bg = 'bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1]';

    return `absolute w-[64px] h-[64px] rounded-[16px] ${bg} border border-black/15 flex items-center justify-center select-none shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15),0_3px_8px_rgba(0,0,0,0.2)] ${
      disabled ? 'opacity-50 grayscale' : 'opacity-100'
    }`;
  };

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Result Badge / Popup */}
      <AnimatePresence>
        {popupNumber && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.5 }}
            animate={{ opacity: 1, y: -26, scale: 1.25 }}
            exit={{ opacity: 0, y: -38, scale: 0.8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute -top-7 z-40 px-3 py-0.5 rounded-full text-white font-heading font-extrabold text-sm shadow-xl pointer-events-none flex items-center gap-1.5 border border-white/20"
            style={{ background: accentColor }}
          >
            <span>🎲</span>
            <span>{popupNumber}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Perspective Stage */}
      <div
        className={`w-[88px] h-[88px] rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 relative ${
          !disabled && !activeRolling
            ? 'ring-2 ring-offset-2 ring-offset-[#1A1A2E] ring-[#E63946]/70 shadow-[0_0_18px_rgba(230,57,70,0.35)]'
            : ''
        }`}
        style={{ perspective: '800px' }}
        onClick={handleTap}
        role="button"
        tabIndex={0}
        aria-label={`3D Dice showing ${currentVal}${disabled ? ' (disabled)' : ''}`}
      >
        {/* 3D Cube with Multi-Axis Rotation */}
        <motion.div
          animate={
            activeRolling
              ? {
                  rotateX: [0, 360, 720, 1080, 1440],
                  rotateY: [0, 540, 1080, 1620, 2160],
                  rotateZ: [0, 180, 360, 540, 720],
                  y: [0, -38, -12, -28, 0],
                  scale: [1, 1.15, 1.05, 1.1, 1],
                }
              : isPressed
              ? { scale: 0.88, y: 4 }
              : bouncing
              ? {
                  rotateX: baseAngle.x,
                  rotateY: baseAngle.y,
                  rotateZ: baseAngle.z,
                  y: [0, -14, 0, -6, 0],
                  scale: [1, 1.05, 0.98, 1.01, 1],
                }
              : {
                  rotateX: baseAngle.x,
                  rotateY: baseAngle.y,
                  rotateZ: baseAngle.z,
                  y: 0,
                  scale: 1,
                }
          }
          transition={
            activeRolling
              ? {
                  duration: 1.2,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }
              : bouncing
              ? {
                  duration: 0.45,
                  ease: 'easeOut',
                }
              : {
                  type: 'spring',
                  stiffness: 280,
                  damping: 20,
                  mass: 0.9,
                }
          }
          className="w-[64px] h-[64px] relative transform-style-3d"
        >
          {/* Face 1 (Front) */}
          <div className={`${getFaceClass(1)} dice-face-1`}>
            {renderDots(1)}
            <div className="absolute top-1 left-1 w-5 h-2 rounded-full bg-white/40 pointer-events-none" />
          </div>

          {/* Face 6 (Back) */}
          <div className={`${getFaceClass(6)} dice-face-6`}>
            {renderDots(6)}
            <div className="absolute top-1 left-1 w-5 h-2 rounded-full bg-white/40 pointer-events-none" />
          </div>

          {/* Face 3 (Right) */}
          <div className={`${getFaceClass(3)} dice-face-3`}>
            {renderDots(3)}
            <div className="absolute top-1 left-1 w-5 h-2 rounded-full bg-white/40 pointer-events-none" />
          </div>

          {/* Face 4 (Left) */}
          <div className={`${getFaceClass(4)} dice-face-4`}>
            {renderDots(4)}
            <div className="absolute top-1 left-1 w-5 h-2 rounded-full bg-white/40 pointer-events-none" />
          </div>

          {/* Face 2 (Top) */}
          <div className={`${getFaceClass(2)} dice-face-2`}>
            {renderDots(2)}
            <div className="absolute top-1 left-1 w-5 h-2 rounded-full bg-white/60 pointer-events-none" />
          </div>

          {/* Face 5 (Bottom) */}
          <div className={`${getFaceClass(5)} dice-face-5`}>
            {renderDots(5)}
          </div>
        </motion.div>
      </div>

      {/* Dynamic 3D Cast Shadow Beneath the Cube */}
      <motion.div
        animate={
          activeRolling
            ? {
                scale: [1, 0.65, 0.9, 0.7, 1],
                opacity: [0.4, 0.15, 0.3, 0.2, 0.4],
              }
            : bouncing
            ? {
                scale: [1, 0.7, 1, 0.85, 1],
                opacity: [0.4, 0.2, 0.4, 0.3, 0.4],
              }
            : {
                scale: 1,
                opacity: disabled ? 0.15 : 0.4,
              }
        }
        transition={{ duration: activeRolling ? 1.2 : 0.4, ease: 'easeOut' }}
        className="w-14 h-2.5 rounded-full bg-black/60 blur-[2.5px] -mt-1.5"
      />

      {/* Status label showing clearly what action or number is active */}
      <span
        className={`text-[11px] mt-1.5 font-semibold tracking-wide transition-colors ${
          disabled
            ? 'text-gray-400'
            : activeRolling
            ? 'text-[#E63946] animate-pulse font-bold'
            : theme === 'dark'
            ? 'text-slate-300'
            : 'text-slate-700'
        }`}
      >
        {activeRolling
          ? 'Rolling...'
          : disabled
          ? 'Waiting for turn'
          : `Rolled ${currentVal} • Tap to Roll`}
      </span>
    </div>
  );
};
