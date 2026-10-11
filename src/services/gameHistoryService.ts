import { PlayerColor } from '../types/ludo';

export interface GameHistoryRecord {
  id: string;
  date: number; // timestamp
  roomCode: string;
  winnerName: string;
  winnerColor: PlayerColor;
  isUserWinner: boolean;
  totalTurns: number;
  durationSeconds: number;
  playerCount: number;
  opponentNames: string[];
}

const STORAGE_KEY = 'ak_ludo_game_history_v1';

const INITIAL_SEED_RECORDS: GameHistoryRecord[] = [
  {
    id: 'seed_1',
    date: Date.now() - 1000 * 60 * 35, // 35 mins ago
    roomCode: 'AK7812',
    winnerName: 'Abhishek',
    winnerColor: 'red',
    isUserWinner: true,
    totalTurns: 34,
    durationSeconds: 245,
    playerCount: 4,
    opponentNames: ['Priya', 'Rohit', 'Anam'],
  },
  {
    id: 'seed_2',
    date: Date.now() - 1000 * 60 * 150, // 2.5 hours ago
    roomCode: 'LUDO77',
    winnerName: 'Priya',
    winnerColor: 'green',
    isUserWinner: false,
    totalTurns: 42,
    durationSeconds: 310,
    playerCount: 4,
    opponentNames: ['Abhishek', 'Rohit', 'Anam'],
  },
  {
    id: 'seed_3',
    date: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    roomCode: 'QUICK92',
    winnerName: 'Abhishek',
    winnerColor: 'red',
    isUserWinner: true,
    totalTurns: 28,
    durationSeconds: 198,
    playerCount: 4,
    opponentNames: ['Rohit', 'Priya', 'Anam'],
  },
  {
    id: 'seed_4',
    date: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    roomCode: 'AK3104',
    winnerName: 'Rohit',
    winnerColor: 'blue',
    isUserWinner: false,
    totalTurns: 39,
    durationSeconds: 280,
    playerCount: 4,
    opponentNames: ['Abhishek', 'Priya', 'Anam'],
  },
];

class GameHistoryService {
  private history: GameHistoryRecord[] = [];
  private listeners: Array<(records: GameHistoryRecord[]) => void> = [];

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.history = JSON.parse(data);
      } else {
        this.history = INITIAL_SEED_RECORDS;
        this.save();
      }
    } catch {
      this.history = INITIAL_SEED_RECORDS;
    }
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
      this.notify();
    } catch {
      // Ignore quota errors
    }
  }

  private notify(): void {
    this.listeners.forEach(fn => fn([...this.history]));
  }

  public getHistory(): GameHistoryRecord[] {
    return [...this.history];
  }

  public addRecord(record: GameHistoryRecord): void {
    // Prepend newest match
    this.history = [record, ...this.history].slice(0, 50); // Keep last 50 matches
    this.save();
  }

  public clearHistory(): void {
    this.history = [];
    this.save();
  }

  public subscribe(listener: (records: GameHistoryRecord[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.history]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getStats() {
    const total = this.history.length;
    const wins = this.history.filter(h => h.isUserWinner).length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const totalTurnsPlayed = this.history.reduce((sum, h) => sum + h.totalTurns, 0);
    const avgTurns = total > 0 ? Math.round(totalTurnsPlayed / total) : 0;

    return {
      totalMatches: total,
      wins,
      losses: total - wins,
      winRate,
      totalTurns: totalTurnsPlayed,
      avgTurns,
    };
  }
}

export const gameHistoryService = new GameHistoryService();
