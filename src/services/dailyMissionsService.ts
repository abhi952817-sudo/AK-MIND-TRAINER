export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: 'win_games' | 'capture_tokens' | 'roll_sixes' | 'play_matches';
  target: number;
  progress: number;
  coinReward: number;
  diamondReward: number;
  claimed: boolean;
}

const STORAGE_KEY = 'ak_ludo_daily_missions';
const RESET_DATE_KEY = 'ak_ludo_missions_reset_date';

const DEFAULT_MISSIONS: Omit<DailyMission, 'progress' | 'claimed'>[] = [
  {
    id: 'mission_win_2',
    title: 'Board Master',
    description: 'Win 2 matches against opponents',
    type: 'win_games',
    target: 2,
    coinReward: 800,
    diamondReward: 25,
  },
  {
    id: 'mission_capture_5',
    title: 'Token Hunter',
    description: 'Capture 5 opponent pawns on the track',
    type: 'capture_tokens',
    target: 5,
    coinReward: 600,
    diamondReward: 20,
  },
  {
    id: 'mission_roll_sixes_5',
    title: 'Lucky Roller',
    description: 'Roll a 6 on the 3D dice 5 times',
    type: 'roll_sixes',
    target: 5,
    coinReward: 400,
    diamondReward: 15,
  },
  {
    id: 'mission_play_3',
    title: 'Ludo Enthusiast',
    description: 'Complete 3 games in any mode',
    type: 'play_matches',
    target: 3,
    coinReward: 500,
    diamondReward: 15,
  },
];

class DailyMissionsService {
  private getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  // Get current daily missions (resets if new calendar day)
  public getMissions(): DailyMission[] {
    const today = this.getTodayString();
    const lastReset = localStorage.getItem(RESET_DATE_KEY);

    if (lastReset !== today) {
      // New day: Reset missions fresh!
      return this.resetMissions(today);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DailyMission[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback on corrupt JSON
    }

    return this.resetMissions(today);
  }

  private resetMissions(today: string): DailyMission[] {
    const fresh: DailyMission[] = DEFAULT_MISSIONS.map(m => ({
      ...m,
      progress: 0,
      claimed: false,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.setItem(RESET_DATE_KEY, today);
    return fresh;
  }

  private saveMissions(missions: DailyMission[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  }

  // Record progress for a specific mission type
  public recordProgress(
    type: 'win_games' | 'capture_tokens' | 'roll_sixes' | 'play_matches',
    amount: number = 1
  ): { updated: boolean; newlyCompleted: DailyMission[] } {
    const missions = this.getMissions();
    let updated = false;
    const newlyCompleted: DailyMission[] = [];

    const modified = missions.map(m => {
      if (m.type === type && m.progress < m.target) {
        const newProgress = Math.min(m.target, m.progress + amount);
        updated = true;
        if (newProgress >= m.target && m.progress < m.target) {
          newlyCompleted.push({ ...m, progress: newProgress });
        }
        return { ...m, progress: newProgress };
      }
      return m;
    });

    if (updated) {
      this.saveMissions(modified);
    }

    return { updated, newlyCompleted };
  }

  // Claim reward for a mission
  public claimReward(missionId: string): { success: boolean; coins: number; diamonds: number } {
    const missions = this.getMissions();
    const mission = missions.find(m => m.id === missionId);

    if (!mission || mission.claimed || mission.progress < mission.target) {
      return { success: false, coins: 0, diamonds: 0 };
    }

    mission.claimed = true;
    this.saveMissions(missions);

    return {
      success: true,
      coins: mission.coinReward,
      diamonds: mission.diamondReward,
    };
  }

  // Claim all eligible completed missions
  public claimAllRewards(): { success: boolean; coins: number; diamonds: number; claimedCount: number } {
    const missions = this.getMissions();
    let totalCoins = 0;
    let totalDiamonds = 0;
    let claimedCount = 0;

    const modified = missions.map(m => {
      if (!m.claimed && m.progress >= m.target) {
        totalCoins += m.coinReward;
        totalDiamonds += m.diamondReward;
        claimedCount++;
        return { ...m, claimed: true };
      }
      return m;
    });

    if (claimedCount > 0) {
      this.saveMissions(modified);
      return { success: true, coins: totalCoins, diamonds: totalDiamonds, claimedCount };
    }

    return { success: false, coins: 0, diamonds: 0, claimedCount: 0 };
  }

  // Check if any missions have unclaimed rewards ready
  public hasUnclaimedRewards(): boolean {
    const missions = this.getMissions();
    return missions.some(m => !m.claimed && m.progress >= m.target);
  }

  // Time remaining until midnight reset
  public getTimeUntilReset(): string {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diffMs = tomorrow.getTime() - now.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${mins}m`;
  }
}

export const dailyMissionsService = new DailyMissionsService();
