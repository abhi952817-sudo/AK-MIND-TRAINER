export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  tokensCaptured: number;
  sixesRolled: number;
  tokensFinished: number;
  currentStreak: number;
  maxStreak: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: 'dice' | 'combat' | 'victories' | 'mastery';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  icon: string;
  target: number;
  getStat: (stats: PlayerStats) => number;
  rarity: string;
  accentColor: string;
  glowColor: string;
}

const STATS_STORAGE_KEY = 'ak_ludo_player_cumulative_stats';

const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 48,
  gamesWon: 30,
  tokensCaptured: 68,
  sixesRolled: 142,
  tokensFinished: 84,
  currentStreak: 2,
  maxStreak: 5,
};

export const BADGES_LIST: Badge[] = [
  {
    id: 'master_roller',
    title: 'Master Roller',
    description: 'Roll a 6 on the 3D dice 100 times in matches',
    category: 'dice',
    tier: 'gold',
    icon: '🎲',
    target: 100,
    getStat: s => s.sixesRolled,
    rarity: 'Rare',
    accentColor: 'from-amber-400 to-yellow-600',
    glowColor: 'rgba(245, 158, 11, 0.5)',
  },
  {
    id: 'capture_king',
    title: 'Capture King',
    description: 'Send 50 opponent pawns back to their home yard',
    category: 'combat',
    tier: 'diamond',
    icon: '⚔️',
    target: 50,
    getStat: s => s.tokensCaptured,
    rarity: 'Epic',
    accentColor: 'from-rose-500 to-red-600',
    glowColor: 'rgba(244, 63, 94, 0.5)',
  },
  {
    id: 'grand_champion',
    title: 'Grand Champion',
    description: 'Claim victory in 25 full match games',
    category: 'victories',
    tier: 'gold',
    icon: '🏆',
    target: 25,
    getStat: s => s.gamesWon,
    rarity: 'Rare',
    accentColor: 'from-amber-300 to-amber-500',
    glowColor: 'rgba(251, 191, 36, 0.5)',
  },
  {
    id: 'home_runner',
    title: 'Home Runner',
    description: 'Guide 50 tokens into the center home triangle',
    category: 'mastery',
    tier: 'silver',
    icon: '⚡',
    target: 50,
    getStat: s => s.tokensFinished,
    rarity: 'Common',
    accentColor: 'from-emerald-400 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
  {
    id: 'unstoppable_streak',
    title: 'Unstoppable',
    description: 'Achieve a winning streak of 3 consecutive matches',
    category: 'victories',
    tier: 'gold',
    icon: '🔥',
    target: 3,
    getStat: s => s.maxStreak,
    rarity: 'Rare',
    accentColor: 'from-orange-500 to-red-500',
    glowColor: 'rgba(249, 115, 22, 0.5)',
  },
  {
    id: 'board_veteran',
    title: 'Board Veteran',
    description: 'Participate in 40 competitive games',
    category: 'mastery',
    tier: 'bronze',
    icon: '🛡️',
    target: 40,
    getStat: s => s.gamesPlayed,
    rarity: 'Common',
    accentColor: 'from-blue-400 to-indigo-600',
    glowColor: 'rgba(59, 130, 246, 0.5)',
  },
  {
    id: 'token_assassin',
    title: 'Token Assassin',
    description: 'Capture 100 opponent tokens across all career games',
    category: 'combat',
    tier: 'legendary',
    icon: '🎯',
    target: 100,
    getStat: s => s.tokensCaptured,
    rarity: 'Legendary',
    accentColor: 'from-purple-500 to-pink-600',
    glowColor: 'rgba(168, 85, 247, 0.5)',
  },
  {
    id: 'legendary_monarch',
    title: 'Ludo Monarch',
    description: 'Win 50 total matches to earn the royal crown',
    category: 'victories',
    tier: 'legendary',
    icon: '👑',
    target: 50,
    getStat: s => s.gamesWon,
    rarity: 'Legendary',
    accentColor: 'from-yellow-300 via-amber-400 to-yellow-600',
    glowColor: 'rgba(253, 224, 71, 0.6)',
  },
];

class PlayerStatsService {
  public getStats(): PlayerStats {
    try {
      const stored = localStorage.getItem(STATS_STORAGE_KEY);
      if (stored) {
        return { ...INITIAL_STATS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    this.saveStats(INITIAL_STATS);
    return INITIAL_STATS;
  }

  private saveStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }

  public recordSix() {
    const stats = this.getStats();
    stats.sixesRolled += 1;
    this.saveStats(stats);
  }

  public recordCapture() {
    const stats = this.getStats();
    stats.tokensCaptured += 1;
    this.saveStats(stats);
  }

  public recordTokenFinished() {
    const stats = this.getStats();
    stats.tokensFinished += 1;
    this.saveStats(stats);
  }

  public recordGameEnd(isWinner: boolean) {
    const stats = this.getStats();
    stats.gamesPlayed += 1;
    if (isWinner) {
      stats.gamesWon += 1;
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
      }
    } else {
      stats.currentStreak = 0;
    }
    this.saveStats(stats);
  }

  public getBadgesWithProgress() {
    const stats = this.getStats();
    return BADGES_LIST.map(badge => {
      const current = badge.getStat(stats);
      const isUnlocked = current >= badge.target;
      const progressPercent = Math.min(100, Math.round((current / badge.target) * 100));
      return {
        ...badge,
        current,
        isUnlocked,
        progressPercent,
      };
    });
  }

  public getUnlockedCount(): number {
    const stats = this.getStats();
    return BADGES_LIST.filter(b => b.getStat(stats) >= b.target).length;
  }
}

export const playerStatsService = new PlayerStatsService();
