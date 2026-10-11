export interface AdConfig {
  preGameAdEnabled: boolean;
  rewardedAdCoins: number;
}

class CentralAdService {
  private isPreGameAdLoaded: boolean = true;
  private isPostGameAdLoaded: boolean = true;
  public isOffline: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOffline = false; });
      window.addEventListener('offline', () => { this.isOffline = true; });
    }
  }

  // Pre-game interstitial check: resolves within max 3.5 seconds
  async requestPreGameAd(onShowAd: (dismissCallback: () => void) => void): Promise<void> {
    if (this.isOffline || !this.isPreGameAdLoaded) {
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      let resolved = false;

      const finish = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      // Hard safety timeout: ad never stalls match launch > 3.5 seconds
      const timeoutId = setTimeout(() => {
        finish();
      }, 3500);

      onShowAd(() => {
        clearTimeout(timeoutId);
        finish();
      });
    });
  }

  // Post-game ad opportunity
  requestPostGameAd(onShowAd: (dismissCallback: () => void) => void): Promise<void> {
    if (this.isOffline) return Promise.resolve();

    return new Promise<void>(resolve => {
      onShowAd(() => {
        resolve();
      });
    });
  }
}

export const adService = new CentralAdService();
