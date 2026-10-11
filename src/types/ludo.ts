export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface Token {
  id: number;
  color: PlayerColor;
  step: number; // -1 = base, 0..50 = main track, 51..55 = home stretch, 56 = finished in home
  isSafe: boolean;
  isFinished: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  isBot: boolean;
  tokens: Token[];
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export type GamePhase =
  | 'LOBBY'
  | 'STARTING'
  | 'PLAYER_TURN'
  | 'ROLLING'
  | 'MOVE_SELECTION'
  | 'MOVING'
  | 'RESOLVING'
  | 'GAME_OVER';

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  maxPlayers: number;
  status: RoomStatus;
  phase: GamePhase;
  turnIndex: number;
  sessionId: string;
  players: Player[];
  currentTurnColor: PlayerColor;
  diceValue: number;
  hasRolledDice: boolean;
  turnTimeRemaining: number;
  winnerId: string | null;
  consecutiveSixes: number;
}

export interface Coordinates {
  row: number;
  col: number;
}

export interface MoveExecutionResult {
  updatedRoom: GameRoom;
  captured: boolean;
  capturedTokens: Array<{ playerId: string; color: PlayerColor; tokenId: number }>;
  reachedHome: boolean;
  bonusTurn: boolean;
  success: boolean;
  reason?: string;
}

export interface DiceRollResult {
  updatedRoom: GameRoom;
  diceValue: number;
  movableTokens: Token[];
  isThreeSixesPenalty: boolean;
  hasLegalMoves: boolean;
}

export interface ActiveTokenMovement {
  playerColor: PlayerColor;
  tokenId: number;
  currentVisualStep: number;
  isCapturing?: boolean;
  capturedTokens?: Array<{ playerId: string; color: PlayerColor; tokenId: number }>;
  reachedHome?: boolean;
}
