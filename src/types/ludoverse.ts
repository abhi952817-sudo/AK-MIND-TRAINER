// LudoVerse Types & Design System Definitions

export type ScreenId =
  | 'splash'
  | 'login'
  | 'signup'
  | 'forgot'
  | 'forgot_password'
  | 'home'
  | 'profile'
  | 'lobby'
  | 'room'
  | 'room_waiting'
  | 'game'
  | 'winner'
  | 'rules'
  | 'dice_showcase'
  | 'spin'
  | 'snakes'
  | 'snakes_ladders';

export type StateMode = 'data' | 'empty' | 'loading' | 'error';
export type ScreenStateMode = 'DATA' | 'EMPTY' | 'LOADING' | 'ERROR' | StateMode;
export type ThemeMode = 'dark' | 'light';
export type DeviceMode = 'iphone' | 'pixel' | 'full';
export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type LudoColor = PlayerColor;
export type TokenPosition = 
  | { state: 'base' }        // in home base
  | { state: 'track'; steps: number }  // 0..56 on the path
  | { state: 'won' };        // reached center

export interface User {
  uid: string;
  id?: string;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
}

export interface UserProfile {
  id: string;
  uid?: string;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
  stats?: {
    gamesPlayed: number | null;
    won: number | null;
    rank: number | null;
  };
}

export interface Room {
  code: string;
  hostUid: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

export interface ActiveRoomSummary {
  id: string;
  code: string;
  hostName: string | null;
  currentPlayers: number;
  maxPlayers: 2 | 4;
  isPrivate: boolean;
}

export interface Player {
  uid: string;
  name: string;
  color: PlayerColor;
  isReady: boolean;
  isHost: boolean;
}

export interface RoomPlayer {
  id: string;
  name: string | null;
  photoUrl: string | null;
  color: PlayerColor;
  isReady: boolean;
  isHost: boolean;
}

export interface ChatMessage {
  id: string;
  senderName?: string | null;
  senderId?: string;
  senderAvatar?: string | null;
  senderColor?: PlayerColor;
  text: string;
  time?: number;
  timestamp: number;
  isMine?: boolean;
}

export interface GameWinnerStats {
  winnerId: string;
  winnerName: string | null;
  winnerAvatar: string | null;
  winnerColor: PlayerColor;
  moves: number | null;
  timeSeconds: number | null;
  kills: number | null;
}

export const COLORS = {
  blue: '#006CA5',
  red: '#E85A0C',
  green: '#1E8335',
  yellow: '#FFD800',
  boardBg: '#E8BD8C',
  woodBorder: '#DEB887',
  woodDark: '#3A2312',
  cellBg: '#FFFFFF',
  cellBorder: '#1A1A1A',
  bgDark: '#1A1A2E',
  surfaceDark: '#16213E',
  bgLight: '#F8F9FA',
  surfaceLight: '#FFFFFF',
  textSecondary: '#8D99AE',
  error: '#EF476F',
  success: '#06D6A0',
} as const;

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  blue: COLORS.blue,
  red: COLORS.red,
  green: COLORS.green,
  yellow: COLORS.yellow,
};
