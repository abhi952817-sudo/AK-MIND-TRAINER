export type AdProvider = 'provider1' | 'provider2';
export type AdType = 'banner' | 'rewarded' | 'interstitial';

export interface AdEvent {
  type: AdType;
  provider: AdProvider;
  timestamp: number;
  reward?: number;
}

export interface AdManagerState {
  bannerVisible: boolean;
  rewardedReady: boolean;
  interstitialReady: boolean;
  currentProvider: AdProvider;
}
