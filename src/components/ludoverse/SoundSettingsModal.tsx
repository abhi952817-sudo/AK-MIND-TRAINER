import React, { useState, useEffect } from 'react';
import { soundEngine, CLASSIC_SOUND_EVENTS, AudioSettings, SoundEventDescriptor } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import { useI18n } from '../../utils/i18n';

interface SoundSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({ open, onClose }) => {
  const { language, setLanguage, t, languages } = useI18n();
  const [settings, setSettings] = useState<AudioSettings>(() => soundEngine.getSettings());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dice' | 'token' | 'game' | 'ui'>('all');
  const [activeTestingId, setActiveTestingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      soundEngine.playModalOpen();
      setSettings(soundEngine.getSettings());
    }
  }, [open]);

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  if (!open) return null;

  const handleClose = () => {
    soundEngine.playModalClose();
    onClose();
  };

  const handleMasterChange = (val: number) => {
    soundEngine.playSliderTick();
    soundEngine.setMasterVolume(val);
  };

  const handleSfxChange = (val: number) => {
    soundEngine.playSliderTick();
    soundEngine.setSfxVolume(val);
  };

  const handleBgmChange = (val: number) => {
    soundEngine.playSliderTick();
    soundEngine.setBgmVolume(val);
  };

  const handleAmbientChange = (val: number) => {
    soundEngine.playSliderTick();
    soundEngine.setAmbientVolume(val);
  };

  const handleToggleSfx = () => {
    soundEngine.playToggleSwitch();
    soundEngine.toggleSfx();
  };

  const handleToggleBgm = () => {
    soundEngine.playToggleSwitch();
    soundEngine.toggleBgm();
  };

  const handleToggleAmbient = () => {
    soundEngine.playToggleSwitch();
    soundEngine.toggleAmbientMute();
  };

  const handleToggleHaptics = () => {
    soundEngine.playToggleSwitch();
    const next = !settings.hapticsEnabled;
    soundEngine.updateSettings({ hapticsEnabled: next });
    if (next) haptics.light();
  };

  const handleTestSound = (event: SoundEventDescriptor) => {
    setActiveTestingId(event.id);
    event.action();
    if (settings.hapticsEnabled) {
      haptics.light();
    }
    setTimeout(() => {
      setActiveTestingId((curr) => (curr === event.id ? null : curr));
    }, 400);
  };

  const filteredEvents = CLASSIC_SOUND_EVENTS.filter((e) => {
    if (categoryFilter === 'all') return true;
    return e.category === categoryFilter;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-settings-title"
    >
      <div
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Header Contract */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <div>
              <h2 id="audio-settings-title" className="text-base font-semibold text-white tracking-tight">
                {t('settingsTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('audioSettings')} • {t('languageSettings')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 0: Language Selector (i18n) */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-indigo-500/30 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <span>🌐</span>
                <span>{t('selectLanguage')}</span>
              </span>
              <span className="text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/40">
                {languages.find((l) => l.code === language)?.nativeName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {languages.map((l) => {
                const isSelected = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      soundEngine.playButtonTap();
                      haptics.light();
                      setLanguage(l.code);
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400 shadow-md scale-[1.02]'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span>{l.nativeName}</span>
                    {isSelected && <span className="text-emerald-300 text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Volume Levels & Sliders */}
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{t('volumeControls')}</span>
              <span className="text-xs text-slate-400">Real-time dynamic synthesis</span>
            </div>

            {/* Master Volume Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{t('masterVolume')}</span>
                <span className="font-mono tabular-nums text-amber-400 font-semibold">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={settings.masterVolume}
                onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* SFX Volume Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{t('sfxVolume')}</span>
                <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                  {settings.sfxMuted ? t('mute') : `${Math.round(settings.sfxVolume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                disabled={settings.sfxMuted}
                value={settings.sfxVolume}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className={`w-full h-2 bg-slate-800 rounded-lg appearance-none accent-emerald-500 ${
                  settings.sfxMuted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
            </div>

            {/* Music (BGM) Volume Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{t('bgmVolume')}</span>
                <span className="font-mono tabular-nums text-sky-400 font-semibold">
                  {settings.bgmMuted ? t('mute') : `${Math.round(settings.bgmVolume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                disabled={settings.bgmMuted}
                value={settings.bgmVolume}
                onChange={(e) => handleBgmChange(parseFloat(e.target.value))}
                className={`w-full h-2 bg-slate-800 rounded-lg appearance-none accent-sky-500 ${
                  settings.bgmMuted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
            </div>

            {/* Ambient Table Atmosphere Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{t('ambientVolume')}</span>
                <span className="font-mono tabular-nums text-indigo-400 font-semibold">
                  {settings.ambientMuted ? t('mute') : `${Math.round(settings.ambientVolume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                disabled={settings.ambientMuted}
                value={settings.ambientVolume}
                onChange={(e) => handleAmbientChange(parseFloat(e.target.value))}
                className={`w-full h-2 bg-slate-800 rounded-lg appearance-none accent-indigo-500 ${
                  settings.ambientMuted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
            </div>
          </div>

          {/* Section 2: Quick Mute & Haptics Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={handleToggleSfx}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                settings.sfxMuted
                  ? 'bg-red-950/30 border-red-800/60 text-red-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:border-emerald-500/50'
              }`}
            >
              <span className="text-lg">{settings.sfxMuted ? '🔇' : '🎲'}</span>
              <span className="text-xs font-medium">{t('sfxVolume')}</span>
              <span className="text-[10px] text-slate-400">{settings.sfxMuted ? t('off') : t('on')}</span>
            </button>

            <button
              onClick={handleToggleBgm}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                settings.bgmMuted
                  ? 'bg-red-950/30 border-red-800/60 text-red-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:border-sky-500/50'
              }`}
            >
              <span className="text-lg">{settings.bgmMuted ? '🎵' : '🎶'}</span>
              <span className="text-xs font-medium">{t('bgmVolume')}</span>
              <span className="text-[10px] text-slate-400">{settings.bgmMuted ? t('off') : t('on')}</span>
            </button>

            <button
              onClick={handleToggleAmbient}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                settings.ambientMuted
                  ? 'bg-red-950/30 border-red-800/60 text-red-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:border-indigo-500/50'
              }`}
            >
              <span className="text-lg">{settings.ambientMuted ? '🪵' : '✨'}</span>
              <span className="text-xs font-medium">{t('ambientVolume')}</span>
              <span className="text-[10px] text-slate-400">{settings.ambientMuted ? t('off') : t('on')}</span>
            </button>

            <button
              onClick={handleToggleHaptics}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                !settings.hapticsEnabled
                  ? 'bg-red-950/30 border-red-800/60 text-red-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:border-amber-500/50'
              }`}
            >
              <span className="text-lg">{settings.hapticsEnabled ? '📳' : '📴'}</span>
              <span className="text-xs font-medium">{t('hapticsVibration')}</span>
              <span className="text-[10px] text-slate-400">{settings.hapticsEnabled ? t('on') : t('off')}</span>
            </button>
          </div>

          {/* Section 3: Interactive 23-Event Soundboard Test Grid */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">{t('soundboard23')}</h3>
                <p className="text-xs text-slate-400">Test every synthesized event individually</p>
              </div>

              {/* Functional Category Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto overflow-x-auto no-scrollbar">
                {(['all', 'dice', 'token', 'game', 'ui'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      soundEngine.playButtonTap();
                      setCategoryFilter(cat);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredEvents.map((evt) => {
                const isActive = activeTestingId === evt.id;
                return (
                  <button
                    key={evt.id}
                    onClick={() => handleTestSound(evt)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-400 scale-[0.98]'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                        {String(evt.number).padStart(2, '0')}.
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 truncate">{evt.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{evt.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{evt.category}</span>
                      <span className="text-xs text-amber-400">{isActive ? '🔊' : '▶'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Contract */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90 shrink-0 text-xs text-slate-400">
          <span>AK MIND TRAINER Sound Engine</span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors cursor-pointer"
          >
            {t('readyToPlay')}
          </button>
        </div>
      </div>
    </div>
  );
};
