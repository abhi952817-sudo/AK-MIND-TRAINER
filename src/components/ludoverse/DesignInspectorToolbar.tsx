import React from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  RotateCw,
  UserCheck,
  Dices,
} from 'lucide-react';
import { ScreenId, ScreenStateMode, ThemeMode, LudoColor, StateMode } from '../../types/ludoverse';
import { useI18n, Language } from '../../utils/i18n';

interface DesignInspectorToolbarProps {
  currentScreen?: ScreenId;
  screen?: ScreenId;
  onSelectScreen?: (screen: ScreenId) => void;
  setScreen?: (screen: ScreenId) => void;
  stateMode?: ScreenStateMode | StateMode;
  state?: StateMode;
  onSelectStateMode?: (mode: ScreenStateMode | StateMode) => void;
  setState?: (mode: StateMode) => void;
  themeMode?: ThemeMode;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  setTheme?: (theme: ThemeMode) => void;
  deviceFrame?: 'iphone' | 'pixel' | 'fluid';
  onChangeDeviceFrame?: (frame: 'iphone' | 'pixel' | 'fluid') => void;
  onResetFlow?: () => void;
  currentTurnColor?: LudoColor;
  onCycleTurn?: () => void;
  onForceDiceValue?: (value: number) => void;
}

export const DesignInspectorToolbar: React.FC<DesignInspectorToolbarProps> = ({
  currentScreen,
  screen,
  onSelectScreen,
  setScreen,
  stateMode,
  state,
  onSelectStateMode,
  setState,
  themeMode,
  theme,
  onToggleTheme,
  setTheme,
  deviceFrame = 'iphone',
  onChangeDeviceFrame = () => {},
  onResetFlow = () => {},
  currentTurnColor = 'red',
  onCycleTurn,
  onForceDiceValue,
}) => {
  const { language, setLanguage, languages } = useI18n();

  const cycleLanguage = () => {
    const list: Language[] = ['en', 'hi', 'es', 'fr'];
    const nextIdx = (list.indexOf(language) + 1) % list.length;
    setLanguage(list[nextIdx]);
  };

  const rawScreen = screen || currentScreen || 'splash';
  const activeScreen =
    rawScreen === 'forgot'
      ? 'forgot_password'
      : rawScreen === 'room'
      ? 'room_waiting'
      : rawScreen === 'snakes'
      ? 'snakes_ladders'
      : rawScreen;
  const handleSelectScreen = (s: ScreenId) => {
    setScreen?.(s);
    onSelectScreen?.(s);
  };
  const activeState = (state || stateMode || 'data').toString().toLowerCase();
  const handleSelectState = (m: string) => {
    setState?.(m.toLowerCase() as StateMode);
    onSelectStateMode?.(m as any);
  };
  const activeTheme = theme || themeMode || 'dark';
  const handleToggleTheme = () => {
    const next = activeTheme === 'dark' ? 'light' : 'dark';
    setTheme?.(next);
    onToggleTheme?.();
  };
  const screens: { id: ScreenId; label: string; phase: string }[] = [
    { id: 'splash', label: '1. Splash Screen', phase: 'Auth' },
    { id: 'login', label: '2. Login Screen', phase: 'Auth' },
    { id: 'signup', label: '3. Signup Screen', phase: 'Auth' },
    { id: 'forgot_password', label: '4. Forgot Password', phase: 'Auth' },
    { id: 'home', label: '5. Home Screen', phase: 'Main' },
    { id: 'profile', label: '6. Profile Screen', phase: 'Main' },
    { id: 'lobby', label: '7. Lobby Screen', phase: 'Game' },
    { id: 'room_waiting', label: '8. Room Waiting', phase: 'Game' },
    { id: 'game', label: '10. Game Screen', phase: 'Game' },
    { id: 'winner', label: '11. Winner Screen', phase: 'Game' },
    { id: 'rules', label: '12. Rules Screen', phase: 'Game' },
    { id: 'dice_showcase', label: '13. 3D Dice Widget', phase: 'Widget' },
    { id: 'spin', label: '14. Lucky Spin Wheel', phase: 'Game' },
    { id: 'snakes_ladders', label: '15. Snakes & Ladders', phase: 'Game' },
  ];

  const turnColors: Record<LudoColor, { label: string; bg: string }> = {
    red: { label: 'P1 Red', bg: 'bg-[#E63946]' },
    green: { label: 'P2 Green', bg: 'bg-[#2A9D8F]' },
    blue: { label: 'P3 Blue', bg: 'bg-[#457B9D]' },
    yellow: { label: 'P4 Yellow', bg: 'bg-[#F4A261]' },
  };

  return (
    <header className="w-full bg-[#12131C] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs z-50 select-none shadow-md">
      {/* Brand & Reset */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#E63946] text-white px-2.5 py-1 rounded-full font-heading font-bold tracking-wider text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>LUDOVERSE UI/UX</span>
        </div>
        <button
          onClick={onResetFlow}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 border border-white/10 transition-colors"
          title="Restart from Splash Screen"
        >
          <RotateCw className="w-3 h-3" />
          <span>Flow</span>
        </button>
      </div>

      {/* Screen Jump: Dropdown of all screens */}
      <div className="flex items-center gap-1.5">
        <span className="text-[#8D99AE] font-medium hidden sm:inline">Screen:</span>
        <select
          value={activeScreen}
          onChange={(e) => handleSelectScreen(e.target.value as ScreenId)}
          className="bg-[#1A1A2E] text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#E63946]"
        >
          {screens.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} ({s.phase})
            </option>
          ))}
        </select>
      </div>

      {/* State Switcher: DATA | EMPTY | LOADING | ERROR */}
      <div className="flex items-center gap-1 bg-[#1A1A2E] p-1 rounded-xl border border-slate-700">
        <span className="text-[#8D99AE] text-[10px] font-bold px-1 uppercase">State:</span>
        {(['DATA', 'EMPTY', 'LOADING', 'ERROR'] as ScreenStateMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleSelectState(mode)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              activeState === mode.toLowerCase()
                ? mode === 'DATA'
                  ? 'bg-[#06D6A0] text-slate-950 shadow-xs'
                  : mode === 'EMPTY'
                  ? 'bg-[#F4A261] text-slate-950 shadow-xs'
                  : mode === 'LOADING'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-[#EF476F] text-white shadow-xs'
                : 'text-[#8D99AE] hover:text-white'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* NEW: Turn Simulator & Dice Simulator (active on Game Screen or Dice Showcase) */}
      {(currentScreen === 'game' || currentScreen === 'dice_showcase') && (
        <div className="flex items-center gap-2 bg-[#1A1A2E] px-2 py-1 rounded-xl border border-slate-700">
          {/* Turn simulator */}
          {onCycleTurn && (
            <button
              onClick={onCycleTurn}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-200"
              title="Cycle Active Player (1-4)"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#06D6A0]" />
              <span className={`w-2 h-2 rounded-full ${turnColors[currentTurnColor]?.bg || 'bg-red-500'}`} />
              <span>{turnColors[currentTurnColor]?.label || 'P1'}</span>
            </button>
          )}

          {/* Dice simulator: force number 1-6 */}
          {onForceDiceValue && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
              <Dices className="w-3.5 h-3.5 text-[#F4A261]" />
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => onForceDiceValue(num)}
                  className="w-5 h-5 rounded bg-white/10 hover:bg-[#E63946] text-white text-[10px] font-bold flex items-center justify-center transition-colors"
                  title={`Force Dice ${num}`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Language, Theme & Device Frame */}
      <div className="flex items-center gap-2">
        <button
          onClick={cycleLanguage}
          className="px-2 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 flex items-center gap-1.5 text-xs text-indigo-200 font-bold transition-colors cursor-pointer shadow-xs"
          title={`Language: ${languages.find((l) => l.code === language)?.name} (Click to switch)`}
        >
          <span>{languages.find((l) => l.code === language)?.flag}</span>
          <span className="uppercase text-[11px]">{language}</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-slate-200 cursor-pointer"
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {themeMode === 'dark' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-[#F4A261]" />
              <span className="hidden sm:inline">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Light</span>
            </>
          )}
        </button>

        <div className="hidden lg:flex items-center gap-0.5 bg-[#1A1A2E] p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => onChangeDeviceFrame('iphone')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              deviceFrame === 'iphone' ? 'bg-white/20 text-white' : 'text-[#8D99AE]'
            }`}
          >
            iPhone 16
          </button>
          <button
            onClick={() => onChangeDeviceFrame('pixel')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              deviceFrame === 'pixel' ? 'bg-white/20 text-white' : 'text-[#8D99AE]'
            }`}
          >
            Pixel 9
          </button>
          <button
            onClick={() => onChangeDeviceFrame('fluid')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              deviceFrame === 'fluid' ? 'bg-white/20 text-white' : 'text-[#8D99AE]'
            }`}
          >
            Full
          </button>
        </div>
      </div>
    </header>
  );
};
