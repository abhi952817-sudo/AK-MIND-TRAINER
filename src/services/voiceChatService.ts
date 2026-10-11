import { PlayerColor } from '../types/ludo';

export type VoiceState = 'disconnected' | 'connecting' | 'connected';

export interface VoiceParticipantState {
  color: PlayerColor;
  isSpeaking: boolean;
  isMuted: boolean;
}

class VoiceChatService {
  public state: VoiceState = 'disconnected';
  public isLocalMuted: boolean = false;
  private speakingListeners: Array<(states: Record<PlayerColor, boolean>) => void> = [];
  private stateListeners: Array<(state: VoiceState) => void> = [];
  private speakingInterval: number | null = null;

  public speakingMap: Record<PlayerColor, boolean> = {
    red: false,
    green: false,
    yellow: false,
    blue: false,
  };

  // Connect to room voice channel
  connectVoiceRoom(channelId: string) {
    this.state = 'connecting';
    this.notifyState();

    setTimeout(() => {
      this.state = 'connected';
      this.notifyState();
      this.startVoiceActivitySimulation();
    }, 800);
  }

  // Disconnect voice automatically upon leaving game room
  disconnectVoice() {
    this.state = 'disconnected';
    if (this.speakingInterval) {
      clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }
    this.speakingMap = { red: false, green: false, yellow: false, blue: false };
    this.notifySpeaking();
    this.notifyState();
  }

  toggleLocalMute(): boolean {
    this.isLocalMuted = !this.isLocalMuted;
    if (this.isLocalMuted) {
      this.speakingMap.red = false;
      this.notifySpeaking();
    }
    return this.isLocalMuted;
  }

  // Simulates realistic room speech activity (subtle audio indicator pulses around active players)
  private startVoiceActivitySimulation() {
    if (this.speakingInterval) clearInterval(this.speakingInterval);

    this.speakingInterval = window.setInterval(() => {
      if (this.state !== 'connected') return;

      const colors: PlayerColor[] = ['green', 'yellow', 'blue'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      if (Math.random() < 0.25) {
        this.speakingMap[randomColor] = true;
        this.notifySpeaking();

        setTimeout(() => {
          this.speakingMap[randomColor] = false;
          this.notifySpeaking();
        }, 1800);
      }
    }, 3000);
  }

  onSpeakingChange(listener: (states: Record<PlayerColor, boolean>) => void) {
    this.speakingListeners.push(listener);
    return () => {
      this.speakingListeners = this.speakingListeners.filter(l => l !== listener);
    };
  }

  onStateChange(listener: (state: VoiceState) => void) {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  private notifySpeaking() {
    this.speakingListeners.forEach(l => l({ ...this.speakingMap }));
  }

  private notifyState() {
    this.stateListeners.forEach(l => l(this.state));
  }
}

export const voiceChatService = new VoiceChatService();
