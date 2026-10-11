import { PlayerColor } from './ludo';

export type ChatMessageType = 'text' | 'emoji' | 'voice';

export interface FloatingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColor;
  type: ChatMessageType;
  text?: string;
  emoji?: string;
  audioBlobUrl?: string;
  audioDuration?: number;
  createdAt: number; // Server timestamp in ms
  expiresAt: number; // Server timestamp in ms
}

export interface ChatConfig {
  displayDurationSeconds: 10 | 20 | 30 | 60;
  cooldownSeconds: number; // default 30
}
