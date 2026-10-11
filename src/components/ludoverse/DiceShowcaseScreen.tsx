import React, { useState } from 'react';
import { ArrowLeft, Dices, RotateCw, Volume2 } from 'lucide-react';
import { Dice3DCube } from './Dice3DCube';
import { Button } from './UIComponents';
import { ScreenStateMode } from '../../types/ludoverse';

interface DiceShowcaseScreenProps {
  onBack: () => void;
  stateMode?: ScreenStateMode;
}

export const DiceShowcaseScreen: React.FC<DiceShowcaseScreenProps> = ({
  onBack,
  stateMode = 'DATA',
}) => {
  const [value, setValue] = useState(6);
  const [isRolling, setIsRolling] = useState(false);
  const [forceNumber, setForceNumber] = useState<number | null>(null);

  const isLoading = stateMode === 'LOADING';
  const isEmpty = stateMode === 'EMPTY';
  const isError = stateMode === 'ERROR';

  const handleRoll = () => {
    if (isRolling || isLoading || isEmpty) return;
    setIsRolling(true);
    setTimeout(() => {
      const next = forceNumber || Math.floor(Math.random() * 6) + 1;
      setValue(next);
      setIsRolling(false);
    }, 1400);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar pt-4">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-current"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-semibold">13. 3D Dice Widget</h1>
            <span className="text-[11px] text-[#8D99AE]">60dp Cube • 3D Faces • Web Audio</span>
          </div>
        </div>
      </div>

      {/* Center 3D Dice Canvas */}
      <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#16213E] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center">
          <Dice3DCube
            value={isEmpty ? 1 : value}
            isRolling={isRolling}
            disabled={isLoading || isEmpty || isError}
            onRoll={handleRoll}
            accentColor="#E63946"
            theme="dark"
          />

          <div className="mt-8 flex items-center gap-2 text-xs text-[#8D99AE]">
            <Volume2 className="w-4 h-4 text-[#2A9D8F]" />
            <span>Interactive mechanical audio synthesis active</span>
          </div>
        </div>

        {/* Dice Simulator Controls */}
        <div className="mt-6 w-full max-w-[320px] p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8D99AE] block mb-2">
            Force Next Dice Result (1-6)
          </span>
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setForceNumber(num);
                  setValue(num);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  value === num
                    ? 'bg-[#E63946] text-white shadow-md'
                    : 'bg-white/10 text-current hover:bg-white/20'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={handleRoll}
            isLoading={isRolling}
            disabled={isLoading || isEmpty || isError}
            className="w-full !h-10 text-xs"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Trigger 1.4s Roll Animation
          </Button>
        </div>
      </div>

      {/* Bottom info */}
      <div className="text-center pb-2 text-[11px] text-[#8D99AE]">
        Spec: 60dp cube, real pip dot geometry, idle bobbing, land bounce & popup
      </div>
    </div>
  );
};
