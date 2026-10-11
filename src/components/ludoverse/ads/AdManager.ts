import { AdEvent, AdProvider, AdType } from '../../../types/ads';

class AdManagerClass {
  private events: AdEvent[] = [];
  private currentProvider: AdProvider = 'provider1';
  private spinCounter = 0;
  private static readonly INTERSTITIAL_EVERY = 6;
  private static readonly BANNER_EVERY = 2;

  /** Log ad event (design-mode, no real SDK) */
  log(type: AdType, reward?: number) {
    const event: AdEvent = {
      type,
      provider: this.currentProvider,
      timestamp: Date.now(),
      reward,
    };
    this.events.push(event);
    // Alternate provider for simulation
    this.currentProvider = this.currentProvider === 'provider1' ? 'provider2' : 'provider1';
    console.log('[AdManager]', event);
    return event;
  }

  /** Called after each spin. Returns what ad to show. */
  onSpin(): { showBanner: boolean; showInterstitial: boolean } {
    this.spinCounter++;
    return {
      showBanner: this.spinCounter % AdManagerClass.BANNER_EVERY === 0,
      showInterstitial: this.spinCounter % AdManagerClass.INTERSTITIAL_EVERY === 0,
    };
  }

  resetSpinCounter() {
    this.spinCounter = 0;
  }

  getEvents() {
    return [...this.events];
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  /** Simulate availability check */
  isRewardedReady(): boolean {
    return true;
  }

  isBannerReady(): boolean {
    return true;
  }

  isInterstitialReady(): boolean {
    return true;
  }
}

export const AdManager = new AdManagerClass();
