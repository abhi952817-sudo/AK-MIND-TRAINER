export type MusicTheme = 'home' | 'lobby' | 'gameplay' | 'lounge' | 'victory';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public sfxMuted: boolean = false;
  public bgmMuted: boolean = false;
  public ambientMuted: boolean = false;
  public voiceChatEnabled: boolean = true;

  public bgmVolume: number = 0.7;
  public ambientVolume: number = 0.65;
  public sfxVolume: number = 0.85;

  private bgmInterval: number | null = null;
  private ambientInterval: number | null = null;
  public currentTheme: MusicTheme = 'home';

  constructor() {
    // Load persisted volume levels from localStorage if available
    try {
      if (typeof window !== 'undefined') {
        const storedBgm = localStorage.getItem('ak_ludo_bgm_vol');
        const storedAmbient = localStorage.getItem('ak_ludo_ambient_vol');
        const storedSfx = localStorage.getItem('ak_ludo_sfx_vol');

        if (storedBgm !== null) this.bgmVolume = Number(storedBgm) / 100;
        if (storedAmbient !== null) this.ambientVolume = Number(storedAmbient) / 100;
        if (storedSfx !== null) this.sfxVolume = Number(storedSfx) / 100;
      }
    } catch {
      // Ignore storage errors
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setBgmVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('ak_ludo_bgm_vol', String(Math.round(this.bgmVolume * 100)));
    } catch {}
  }

  public setAmbientVolume(val: number) {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('ak_ludo_ambient_vol', String(Math.round(this.ambientVolume * 100)));
    } catch {}
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('ak_ludo_sfx_vol', String(Math.round(this.sfxVolume * 100)));
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

  // Realistic wooden table shuffling / token sliding sound
  playTableShuffle() {
    if (this.ambientMuted) return;
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
    const peakVol = 0.16 * this.ambientVolume;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakVol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Warm wooden surface resonance
    const woodOsc = this.ctx.createOscillator();
    const woodGain = this.ctx.createGain();
    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(160 + Math.random() * 30, now);
    woodOsc.frequency.exponentialRampToValueAtTime(75, now + duration * 0.7);

    woodGain.gain.setValueAtTime(0.06 * this.ambientVolume, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

    woodOsc.connect(woodGain);
    woodGain.connect(this.ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + duration * 0.75);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  // Subtle wooden token click on board surface
  playWoodClick() {
    if (this.ambientMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

    const vol = 0.09 * this.ambientVolume;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Start continuous ambient table atmosphere (table slides, token shuffles)
  startAmbientSounds() {
    if (this.ambientInterval || this.ambientMuted) return;
    this.initCtx();

    // Trigger initial table shuffle after brief delay
    setTimeout(() => {
      if (!this.ambientMuted) {
        this.playTableShuffle();
      }
    }, 1200);

    this.ambientInterval = window.setInterval(() => {
      if (this.ambientMuted) return;
      const roll = Math.random();
      if (roll < 0.6) {
        this.playTableShuffle();
      } else {
        this.playWoodClick();
      }
    }, 7000 + Math.random() * 3000);
  }

  // Stop ambient table atmosphere
  stopAmbientSounds() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  toggleAmbientMute(): boolean {
    this.ambientMuted = !this.ambientMuted;
    if (this.ambientMuted) {
      this.stopAmbientSounds();
    } else {
      this.startAmbientSounds();
    }
    return this.ambientMuted;
  }

  // Realistic dice rattling and tumbling sound
  playDiceRoll() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const delay = i * 0.07 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 240, now + delay);
      osc.frequency.exponentialRampToValueAtTime(70, now + delay + 0.06);

      gain.gain.setValueAtTime((0.28 - i * 0.03) * this.sfxVolume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.07);
    }
  }

  // Subtle impact sound when dice lands on board
  playDiceLand() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Crisp token hop sound
  playTokenHop() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.07);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Heavy capture crunch impact
  playCapture() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

    gain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.33);
  }

  // Safe zone magical chime
  playSafeChime() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    });
  }

  // Incoming chat message pop
  playMessageReceived() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Turn timer countdown tick
  playCountdownTick() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Incoming voice message blip
  playVoiceMessageReceived() {
    if (this.sfxMuted) return;
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

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  // Triumphant victory fanfare
  playVictory() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.5, d: 0.45 }, // C6
    ];

    let t = this.ctx.currentTime;
    melody.forEach(note => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.1;
    });
  }

  playVictoryFanfare() {
    this.playVictory();
  }

  // Switch dynamic background music by scene (Home, Lobby, Gameplay, Lounge, Victory)
  setSceneMusic(theme: MusicTheme) {
    this.currentTheme = theme;
    this.stopBgm();
    if (!this.bgmMuted) {
      this.startThemeBgm(theme);
    }
  }

  private startThemeBgm(theme: MusicTheme) {
    if (this.bgmInterval || this.bgmMuted) return;
    this.initCtx();

    // Scene-specific harmonic chord progressions
    let chords: number[][];
    let intervalTime = 2400;

    switch (theme) {
      case 'lounge':
      case 'gameplay':
        // Soft soothing jazz lounge chords (Fmaj7, Em7, Dm9, Cmaj9, Am9)
        chords = [
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [164.81, 196.0, 246.94, 293.66], // Em7
          [146.83, 220.0, 261.63, 329.63], // Dm9
          [130.81, 196.0, 246.94, 329.63], // Cmaj9
          [220.0, 261.63, 329.63, 392.0], // Am9
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
    this.bgmInterval = window.setInterval(() => {
      if (this.bgmMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach(f => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        // Warm electric piano/lounge filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(theme === 'lounge' || theme === 'gameplay' ? 900 : 1800, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        const noteVol = (theme === 'lounge' || theme === 'gameplay' ? 0.04 : 0.03) * this.bgmVolume;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(noteVol, now + 0.35); // Velvet lounge attack
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
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  toggleSfx(): boolean {
    this.sfxMuted = !this.sfxMuted;
    return this.sfxMuted;
  }

  toggleBgm(): boolean {
    this.bgmMuted = !this.bgmMuted;
    if (this.bgmMuted) {
      this.stopBgm();
    } else {
      this.startThemeBgm(this.currentTheme);
    }
    return this.bgmMuted;
  }

  toggleVoiceChat(): boolean {
    this.voiceChatEnabled = !this.voiceChatEnabled;
    return this.voiceChatEnabled;
  }
}

export const soundEngine = new SoundSynthesizer();
