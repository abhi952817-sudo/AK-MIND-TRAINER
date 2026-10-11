import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService {
  static final AdService _instance = AdService._internal();
  factory AdService() => _instance;
  AdService._internal();

  InterstitialAd? _preGameInterstitialAd;
  InterstitialAd? _postGameInterstitialAd;
  RewardedAd? _rewardedAd;

  bool _isPreGameAdReady = false;
  bool _isPostGameAdReady = false;
  bool _isRewardedAdReady = false;

  bool isAdDisabledForMatch = false;

  // Google Test Ad Unit IDs
  static String get interstitialAdUnitId {
    if (kIsWeb) return '';
    if (Platform.isAndroid) {
      return 'ca-app-pub-3940256099942544/1033173712';
    } else if (Platform.isIOS) {
      return 'ca-app-pub-3940256099942544/4411468910';
    }
    return '';
  }

  static String get rewardedAdUnitId {
    if (kIsWeb) return '';
    if (Platform.isAndroid) {
      return 'ca-app-pub-3940256099942544/5224354917';
    } else if (Platform.isIOS) {
      return 'ca-app-pub-3940256099942544/1712485313';
    }
    return '';
  }

  Future<void> initialize() async {
    if (!kIsWeb) {
      try {
        await MobileAds.instance.initialize();
        loadPreGameAd();
        loadPostGameAd();
        loadRewardedAd();
      } catch (e) {
        debugPrint('AdMob initialization error: $e');
      }
    }
  }

  void loadPreGameAd() {
    if (kIsWeb) return;
    InterstitialAd.load(
      adUnitId: interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _preGameInterstitialAd = ad;
          _isPreGameAdReady = true;
        },
        onAdFailedToLoad: (error) {
          _preGameInterstitialAd = null;
          _isPreGameAdReady = false;
        },
      ),
    );
  }

  void loadPostGameAd() {
    if (kIsWeb) return;
    InterstitialAd.load(
      adUnitId: interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _postGameInterstitialAd = ad;
          _isPostGameAdReady = true;
        },
        onAdFailedToLoad: (error) {
          _postGameInterstitialAd = null;
          _isPostGameAdReady = false;
        },
      ),
    );
  }

  void loadRewardedAd() {
    if (kIsWeb) return;
    RewardedAd.load(
      adUnitId: rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
          _isRewardedAdReady = true;
        },
        onAdFailedToLoad: (error) {
          _rewardedAd = null;
          _isRewardedAdReady = false;
        },
      ),
    );
  }

  /// Displays pre-game ad with a hard timeout guarantee so the match is never permanently blocked
  Future<void> showPreGameAd({required VoidCallback onProceed}) async {
    if (kIsWeb || !_isPreGameAdReady || _preGameInterstitialAd == null) {
      onProceed();
      loadPreGameAd();
      return;
    }

    final completer = Completer<void>();
    bool hasProceeded = false;

    void proceedOnce() {
      if (!hasProceeded) {
        hasProceeded = true;
        onProceed();
        if (!completer.isCompleted) completer.complete();
      }
    }

    // Safety timeout: if ad hangs for > 3.5 seconds, force proceed into match
    Timer(const Duration(milliseconds: 3500), proceedOnce);

    _preGameInterstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        loadPreGameAd();
        proceedOnce();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        loadPreGameAd();
        proceedOnce();
      },
    );

    try {
      await _preGameInterstitialAd!.show();
    } catch (_) {
      proceedOnce();
    }
  }

  /// Displays post-game ad without interrupting active gameplay
  void showPostGameAd({VoidCallback? onComplete}) {
    if (kIsWeb || !_isPostGameAdReady || _postGameInterstitialAd == null) {
      onComplete?.call();
      loadPostGameAd();
      return;
    }

    _postGameInterstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        loadPostGameAd();
        onComplete?.call();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        loadPostGameAd();
        onComplete?.call();
      },
    );

    try {
      _postGameInterstitialAd!.show();
    } catch (_) {
      onComplete?.call();
    }
  }
}
