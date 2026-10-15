// src/utils/audio.ts
// Comprehensive Web Audio API Synthesizer for AK MIND TRAINER
// Features all 23 classic Ludo sound events, background music synthesis,
// volume management, and persistent audio settings.

export type MusicTheme = 'home' | 'lobby' | 'gameplay' | 'lounge' | 'victory';

export interface AudioSettings {
  masterVolume: number; // 0.0 to 1.0
  sfxVolume: number;    // 0.0 to 1.0
  bgmVolume: number;    // 0.0 to 1.0
  ambientVolume: number;// 0.0 to 1.0
  sfxMuted: boolean;
  bgmMuted: boolean;
  ambientMuted: boolean;
  hapticsEnabled: boolean;
}

export interface SoundEventDescriptor {
  id: string;
  number: number;
  name: string;
  category: 'dice' | 'token' | 'game' | 'ui';
  description: string;
  action: () => void;
}

export const PRIMARY_STORAGE_KEY = 'ak_audio_settings';
export const LEGACY_STORAGE_KEY = 'ak_mind_trainer_audio_settings';
const STORAGE_KEY = PRIMARY_STORAGE_KEY;

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  public masterVolume: number = 0.9;
  public sfxVolume: number = 0.85;
  public bgmVolume: number = 0.65;
  public ambientVolume: number = 0.6;

  public sfxMuted: boolean = false;
  public bgmMuted: boolean = false;
  public ambientMuted: boolean = false;
  public voiceChatEnabled: boolean = true;
  public hapticsEnabled: boolean = true;

  private bgmInterval: number | null = null;
  private ambientInterval: number | null = null;
  public currentTheme: MusicTheme = 'home';

  private listeners: Array<(settings: AudioSettings) => void> = [];

  constructor() {
    this.loadSettings();
  }

  // Initialize or resume AudioContext safely upon user gesture
  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Effective output volumes taking master multiplier into account
  public get effectiveSfxVol(): number {
    return this.sfxMuted ? 0 : this.masterVolume * this.sfxVolume;
  }

  public get effectiveBgmVol(): number {
    return this.bgmMuted ? 0 : this.masterVolume * this.bgmVolume;
  }

  public get effectiveAmbientVol(): number {
    return this.ambientMuted ? 0 : this.masterVolume * this.ambientVolume;
  }

  public getSettings(): AudioSettings {
    return {
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume,
      bgmVolume: this.bgmVolume,
      ambientVolume: this.ambientVolume,
      sfxMuted: this.sfxMuted,
      bgmMuted: this.bgmMuted,
      ambientMuted: this.ambientMuted,
      hapticsEnabled: this.hapticsEnabled,
    };
  }

  public updateSettings(partial: Partial<AudioSettings>) {
    if (partial.masterVolume !== undefined) this.masterVolume = Math.max(0, Math.min(1, partial.masterVolume));
    if (partial.sfxVolume !== undefined) this.sfxVolume = Math.max(0, Math.min(1, partial.sfxVolume));
    if (partial.bgmVolume !== undefined) this.bgmVolume = Math.max(0, Math.min(1, partial.bgmVolume));
    if (partial.ambientVolume !== undefined) this.ambientVolume = Math.max(0, Math.min(1, partial.ambientVolume));
    if (partial.sfxMuted !== undefined) this.sfxMuted = Boolean(partial.sfxMuted);
    if (partial.bgmMuted !== undefined) {
      this.bgmMuted = Boolean(partial.bgmMuted);
      if (this.bgmMuted) {
        this.stopBgm();
      } else {
        this.startThemeBgm(this.currentTheme);
      }
    }
    if (partial.ambientMuted !== undefined) {
      this.ambientMuted = Boolean(partial.ambientMuted);
      if (this.ambientMuted) {
        this.stopAmbientSounds();
      } else {
        this.startAmbientSounds();
      }
    }
    if (partial.hapticsEnabled !== undefined) this.hapticsEnabled = Boolean(partial.hapticsEnabled);

    this.saveSettings();
    this.notifyListeners();
  }

  public subscribe(cb: (settings: AudioSettings) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    const s = this.getSettings();
    this.listeners.forEach((cb) => {
      try {
        cb(s);
      } catch {}
    });
  }

  public setMasterVolume(val: number) {
    this.updateSettings({ masterVolume: val });
  }

  public setSfxVolume(val: number) {
    this.updateSettings({ sfxVolume: val });
  }

  public setBgmVolume(val: number) {
    this.updateSettings({ bgmVolume: val });
  }

  public setAmbientVolume(val: number) {
    this.updateSettings({ ambientVolume: val });
  }

  public toggleSfx(): boolean {
    this.updateSettings({ sfxMuted: !this.sfxMuted });
    return this.sfxMuted;
  }

  public toggleBgm(): boolean {
    this.updateSettings({ bgmMuted: !this.bgmMuted });
    return this.bgmMuted;
  }

  public toggleAmbientMute(): boolean {
    this.updateSettings({ ambientMuted: !this.ambientMuted });
    return this.ambientMuted;
  }

  public toggleVoiceChat(): boolean {
    this.voiceChatEnabled = !this.voiceChatEnabled;
    return this.voiceChatEnabled;
  }

  public saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      const data = this.getSettings();
      const raw = JSON.stringify(data);
      // Persist to both primary and legacy keys simultaneously
      localStorage.setItem(PRIMARY_STORAGE_KEY, raw);
      localStorage.setItem(LEGACY_STORAGE_KEY, raw);
      // Backwards compatibility with previous individual volume keys
      localStorage.setItem('ak_ludo_sfx_vol', String(Math.round(this.sfxVolume * 100)));
      localStorage.setItem('ak_ludo_bgm_vol', String(Math.round(this.bgmVolume * 100)));
      localStorage.setItem('ak_ludo_ambient_vol', String(Math.round(this.ambientVolume * 100)));
    } catch {}
  }

  public loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      // Check primary key first, fallback to legacy key
      const saved = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.masterVolume === 'number') this.masterVolume = parsed.masterVolume;
        if (typeof parsed.sfxVolume === 'number') this.sfxVolume = parsed.sfxVolume;
        if (typeof parsed.bgmVolume === 'number') this.bgmVolume = parsed.bgmVolume;
        if (typeof parsed.ambientVolume === 'number') this.ambientVolume = parsed.ambientVolume;
        if (typeof parsed.sfxMuted === 'boolean') this.sfxMuted = parsed.sfxMuted;
        if (typeof parsed.bgmMuted === 'boolean') this.bgmMuted = parsed.bgmMuted;
        if (typeof parsed.ambientMuted === 'boolean') this.ambientMuted = parsed.ambientMuted;
        if (typeof parsed.hapticsEnabled === 'boolean') this.hapticsEnabled = parsed.hapticsEnabled;
      } else {
        // Fallback to legacy individual keys if present
        const sfx = localStorage.getItem('ak_ludo_sfx_vol');
        const bgm = localStorage.getItem('ak_ludo_bgm_vol');
        const amb = localStorage.getItem('ak_ludo_ambient_vol');
        if (sfx) this.sfxVolume = Number(sfx) / 100;
        if (bgm) this.bgmVolume = Number(bgm) / 100;
        if (amb) this.ambientVolume = Number(amb) / 100;
      }
    } catch {}
  }

  private createNoiseBuffer(duration: number = 0.8): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // =========================================================================
  // THE 23 CLASSIC LUDO SOUND EVENTS
  // =========================================================================

  // 1. Initial touch/tap on dice cube before roll begins
  playDiceTap() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

    gain.gain.setValueAtTime(0.22 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 2. Realistic dice rattling and tumbling sound
  playDiceRattle() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const delay = i * 0.065 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 + Math.random() * 260, now + delay);
      osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.05);

      gain.gain.setValueAtTime((0.26 - i * 0.028) * this.effectiveSfxVol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
    }
  }

  // Alias for legacy calls
  playDiceRoll() {
    this.playDiceRattle();
  }

  // 3. Impact sound when dice settles on its face
  playDiceLand() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

    gain.gain.setValueAtTime(0.35 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  playDiceLanding() {
    this.playDiceLand();
  }

  // 4. Euphoric high-pitch bonus chime on rolling a 6
  playDiceSixBonus() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [880, 1174.66, 1479.98, 1760]; // A5, D6, F#6, A6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.055;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playSixSound() {
    this.playDiceSixBonus();
  }

  // 5. Token released from yard base onto the starting track
  playTokenRelease() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [330, 440, 550, 660];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  // 6. Snappy step click for box-by-box movement
  playTokenHop() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.07);

    gain.gain.setValueAtTime(0.3 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Token settling on final destination tile
  playTokenLand() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);

    gain.gain.setValueAtTime(0.25 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 7. Resonant bell chime upon landing on a starred safe cell
  playSafeZoneLand() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25 * this.effectiveSfxVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    });
  }

  playSafeChime() {
    this.playSafeZoneLand();
  }

  // 8. Entering colored home runway corridor
  playHomeEntry() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.24 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  // 9. Full bell triumph when a token reaches the center triangle
  playTokenHomeTriumph() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  playTokenFinish() {
    this.playTokenHomeTriumph();
  }

  // 10. Dramatic dual-tone strike when capturing an opponent
  playTokenCapture() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

    gain.gain.setValueAtTime(0.45 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.33);
  }

  playCapture() {
    this.playTokenCapture();
  }

  // 11. Descending whistle as captured token returns home
  playTokenBaseReturn() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.36);

    gain.gain.setValueAtTime(0.26 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playReturnToBase() {
    this.playTokenBaseReturn();
  }

  // 12. Turn start alert prompt bell
  playTurnStartAlert(isHuman: boolean = true) {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHuman ? 587.33 : 392, now);
    if (isHuman) {
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    }

    gain.gain.setValueAtTime((isHuman ? 0.28 : 0.12) * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isHuman ? 0.16 : 0.08));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isHuman ? 0.18 : 0.1));
  }

  playTurnStart(isHuman: boolean = true) {
    this.playTurnStartAlert(isHuman);
  }

  // 13. Turn timer warning pulse (final 5 seconds)
  playTurnWarningTick() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

    gain.gain.setValueAtTime(0.22 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playCountdownTick() {
    this.playTurnWarningTick();
  }

  playTurnWarning() {
    this.playTurnWarningTick();
  }

  // 14. Turn timeout buzz if timer expires
  playTurnTimeoutBuzz() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);

    gain.gain.setValueAtTime(0.28 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // 15. Quiet gentle blips while AI computes moves
  playBotThinking() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 520, 600];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    });
  }

  // 16. Clean UI button click
  playButtonTap() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.18 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 17. Soft upward whoosh when opening modal
  playModalOpen() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);

    gain.gain.setValueAtTime(0.16 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 18. Soft downward whoosh when closing modal
  playModalClose() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    gain.gain.setValueAtTime(0.14 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // 19. Mechanical toggle switch snap
  playToggleSwitch() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

    gain.gain.setValueAtTime(0.2 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // 20. Subtle granular tick during slider adjustment
  playSliderTick() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.02);

    gain.gain.setValueAtTime(0.09 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // 21. Warm opening chord when entering the arena
  playGameStartChime() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const chord = [392.0, 493.88, 587.33, 783.99]; // G major triad (G4, B4, D5, G5)
    const now = this.ctx.currentTime;

    chord.forEach((freq, idx) => {
      const t = now + idx * 0.04;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.24 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  // 22. Triumphant victory fanfare on game win
  playVictoryFanfare() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.14 }, // C5
      { f: 659.25, d: 0.14 }, // E5
      { f: 783.99, d: 0.14 }, // G5
      { f: 1046.5, d: 0.38 }, // C6
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.5 },  // C6
    ];

    let t = this.ctx.currentTime;
    melody.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.35 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.05;
    });
  }

  playVictory() {
    this.playVictoryFanfare();
  }

  // 23. Gentle closing cadence when game concludes
  playGameOverCadence() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const cadence = [
      { f: 659.25, d: 0.2 }, // E5
      { f: 587.33, d: 0.2 }, // D5
      { f: 523.25, d: 0.4 }, // C5
    ];

    let t = this.ctx.currentTime;
    cadence.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.22 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.1;
    });
  }

  // Miscellaneous helper sound effects
  playMessageReceived() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

    gain.gain.setValueAtTime(0.2 * this.effectiveSfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playVoiceMessageReceived() {
    if (this.effectiveSfxVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 660, 880];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2 * this.effectiveSfxVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  // Realistic table shuffling / ambient sound
  playTableShuffle() {
    if (this.effectiveAmbientVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.42;
    const noise = this.createNoiseBuffer(duration);
    if (!noise) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);
    filter.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    const peakVol = 0.16 * this.effectiveAmbientVol;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakVol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  playWoodClick() {
    if (this.effectiveAmbientVol <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

    const vol = 0.09 * this.effectiveAmbientVol;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  startAmbientSounds() {
    if (this.ambientInterval || this.ambientMuted) return;
    if (typeof window === 'undefined') return;
    this.initCtx();

    setTimeout(() => {
      if (!this.ambientMuted) this.playTableShuffle();
    }, 1200);

    this.ambientInterval = window.setInterval(() => {
      if (this.ambientMuted) return;
      const roll = Math.random();
      if (roll < 0.6) {
        this.playTableShuffle();
      } else {
        this.playWoodClick();
      }
    }, 8000 + Math.random() * 4000);
  }

  stopAmbientSounds() {
    if (this.ambientInterval) {
      if (typeof window !== 'undefined') {
        window.clearInterval(this.ambientInterval);
      } else {
        clearInterval(this.ambientInterval);
      }
      this.ambientInterval = null;
    }
  }

  // =========================================================================
  // BACKGROUND MUSIC BY SCENE
  // =========================================================================

  setSceneMusic(theme: MusicTheme) {
    this.currentTheme = theme;
    this.stopBgm();
    if (!this.bgmMuted && this.effectiveBgmVol > 0) {
      this.startThemeBgm(theme);
    }
  }

  private startThemeBgm(theme: MusicTheme) {
    if (this.bgmInterval || this.bgmMuted || this.effectiveBgmVol <= 0) return;
    this.initCtx();

    let chords: number[][];
    let intervalTime = 2400;

    switch (theme) {
      case 'lounge':
      case 'gameplay':
        chords = [
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [164.81, 196.0, 246.94, 293.66], // Em7
          [146.83, 220.0, 261.63, 329.63], // Dm9
          [130.81, 196.0, 246.94, 329.63], // Cmaj9
          [220.0, 261.63, 329.63, 392.0],  // Am9
        ];
        intervalTime = 3200;
        break;
      case 'home':
        chords = [
          [261.63, 329.63, 392.0], // C
          [220.0, 261.63, 329.63], // Am
          [174.61, 220.0, 261.63], // F
          [196.0, 246.94, 293.66], // G
        ];
        intervalTime = 2400;
        break;
      case 'lobby':
        chords = [
          [293.66, 369.99, 440.0], // D
          [329.63, 392.0, 493.88], // Em
          [261.63, 329.63, 392.0], // C
          [196.0, 246.94, 293.66], // G
        ];
        intervalTime = 2000;
        break;
      case 'victory':
        chords = [
          [261.63, 329.63, 392.0, 523.25],
          [293.66, 369.99, 440.0, 587.33],
        ];
        intervalTime = 1400;
        break;
    }

    let chordIdx = 0;
    if (typeof window === 'undefined') {
      // In headless test environments without AudioContext, no interval needed
      return;
    }

    this.bgmInterval = window.setInterval(() => {
      if (this.bgmMuted || !this.ctx || this.effectiveBgmVol <= 0) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(theme === 'lounge' || theme === 'gameplay' ? 900 : 1800, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        const noteVol = (theme === 'lounge' || theme === 'gameplay' ? 0.04 : 0.03) * this.effectiveBgmVol;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(noteVol, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + intervalTime / 1000 - 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + intervalTime / 1000 - 0.1);
      });
    }, intervalTime);
  }

  stopBgm() {
    if (this.bgmInterval) {
      if (typeof window !== 'undefined') {
        window.clearInterval(this.bgmInterval);
      } else {
        clearInterval(this.bgmInterval);
      }
      this.bgmInterval = null;
    }
  }
}

export const soundEngine = new SoundSynthesizer();

// The 23 Classic Sound Events Descriptor List for Settings UI & Soundboard
export const CLASSIC_SOUND_EVENTS: SoundEventDescriptor[] = [
  { id: 'dice_tap', number: 1, name: 'Dice Tap', category: 'dice', description: 'Touch before roll', action: () => soundEngine.playDiceTap() },
  { id: 'dice_rattle', number: 2, name: 'Dice Rattle', category: 'dice', description: 'Tumbling 3D shake', action: () => soundEngine.playDiceRattle() },
  { id: 'dice_land', number: 3, name: 'Dice Landing', category: 'dice', description: 'Impact on board', action: () => soundEngine.playDiceLand() },
  { id: 'dice_six_bonus', number: 4, name: 'Six Bonus', category: 'dice', description: 'Bonus turn fanfare', action: () => soundEngine.playDiceSixBonus() },
  { id: 'token_release', number: 5, name: 'Yard Release', category: 'token', description: 'Token enters track', action: () => soundEngine.playTokenRelease() },
  { id: 'token_hop', number: 6, name: 'Box Hop Step', category: 'token', description: 'Box-by-box step', action: () => soundEngine.playTokenHop() },
  { id: 'safe_zone', number: 7, name: 'Safe Zone', category: 'token', description: 'Star tile protection', action: () => soundEngine.playSafeZoneLand() },
  { id: 'home_entry', number: 8, name: 'Home Lane Entry', category: 'token', description: 'Colored corridor', action: () => soundEngine.playHomeEntry() },
  { id: 'token_triumph', number: 9, name: 'Center Triumph', category: 'token', description: 'Token finishes home', action: () => soundEngine.playTokenHomeTriumph() },
  { id: 'token_capture', number: 10, name: 'Capture Strike', category: 'token', description: 'Knockout opponent', action: () => soundEngine.playTokenCapture() },
  { id: 'token_return', number: 11, name: 'Return to Base', category: 'token', description: 'Captured token reset', action: () => soundEngine.playTokenBaseReturn() },
  { id: 'turn_start', number: 12, name: 'Turn Alert', category: 'game', description: 'Your turn notification', action: () => soundEngine.playTurnStartAlert(true) },
  { id: 'warning_tick', number: 13, name: 'Countdown Tick', category: 'game', description: 'Timer urgency tick', action: () => soundEngine.playTurnWarningTick() },
  { id: 'timeout_buzz', number: 14, name: 'Timeout Buzz', category: 'game', description: 'Turn expired', action: () => soundEngine.playTurnTimeoutBuzz() },
  { id: 'bot_thinking', number: 15, name: 'Bot Pondering', category: 'game', description: 'AI strategy calculation', action: () => soundEngine.playBotThinking() },
  { id: 'button_tap', number: 16, name: 'Button Tap', category: 'ui', description: 'Clean interface click', action: () => soundEngine.playButtonTap() },
  { id: 'modal_open', number: 17, name: 'Modal Open', category: 'ui', description: 'Dialog appearance', action: () => soundEngine.playModalOpen() },
  { id: 'modal_close', number: 18, name: 'Modal Close', category: 'ui', description: 'Dialog dismissal', action: () => soundEngine.playModalClose() },
  { id: 'toggle_switch', number: 19, name: 'Toggle Switch', category: 'ui', description: 'Option on/off snap', action: () => soundEngine.playToggleSwitch() },
  { id: 'slider_tick', number: 20, name: 'Slider Drag Tick', category: 'ui', description: 'Granular volume adjustment', action: () => soundEngine.playSliderTick() },
  { id: 'game_start', number: 21, name: 'Match Start', category: 'game', description: 'Warm arena entrance', action: () => soundEngine.playGameStartChime() },
  { id: 'victory_fanfare', number: 22, name: 'Victory Fanfare', category: 'game', description: 'Game champion anthem', action: () => soundEngine.playVictoryFanfare() },
  { id: 'game_over', number: 23, name: 'Game Cadence', category: 'game', description: 'Match concluded', action: () => soundEngine.playGameOverCadence() },
];
