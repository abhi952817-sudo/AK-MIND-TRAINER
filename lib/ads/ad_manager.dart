import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Single authoritative advertisement manager for AK MIND TRAINER
/// Enforces:
/// 1. Home banner ad support with safe collapsible fallback.
/// 2. Active gameplay timer tracking (ignoring pauses/background).
/// 3. Persistence of accumulated active playtime across app restarts.
/// 4. Interstitial ad trigger at natural breaks after >= 2 active gameplay hours (7,200s).
/// 5. Rewarded/video ad trigger at natural breaks after >= 4 active gameplay hours (14,400s).
/// 6. Strict rule: NEVER interrupts an active match.
/// 7. Graceful offline/error handling with safe fallback continuation.
class AdManager {
  static final AdManager _instance = AdManager._internal();
  factory AdManager() => _instance;
  AdManager._internal();

  static const String _prefKeyActivePlaySeconds = 'ak_mind_trainer_active_play_seconds';
  static const String _prefKeyLastInterstitialTrigger = 'ak_mind_trainer_last_interstitial_trigger';
  static const String _prefKeyLastVideoTrigger = 'ak_mind_trainer_last_video_trigger';

  // Thresholds in seconds:
  // 2 hours = 7,200 seconds
  static const int kTwoHoursSeconds = 7200;
  // 4 hours = 14,400 seconds
  static const int kFourHoursSeconds = 14400;

  // Google AdMob Standard Official Test Unit IDs
  static String get bannerAdUnitId {
    if (kIsWeb) return '';
    if (Platform.isAndroid) {
      return 'ca-app-pub-3940256099942544/6300978111';
    } else if (Platform.isIOS) {
      return 'ca-app-pub-3940256099942544/2934735716';
    }
    return '';
  }

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

  // Ad objects
  InterstitialAd? _interstitialAd;
  RewardedAd? _rewardedVideoAd;

  bool _isInterstitialReady = false;
  bool _isRewardedVideoReady = false;
  bool _isShowingAd = false;

  // Active match tracking
  bool _isMatchActive = false;
  DateTime? _matchStartTime;
  Timer? _gameplayTicker;
  int _accumulatedActivePlaySeconds = 0;
  int _lastInterstitialTriggerSeconds = 0;
  int _lastVideoTriggerSeconds = 0;

  bool get isMatchActive => _isMatchActive;
  int get accumulatedActivePlaySeconds => _accumulatedActivePlaySeconds;

  Future<void> initialize() async {
    await _loadPersistedState();

    if (!kIsWeb) {
      try {
        await MobileAds.instance.initialize();
        loadInterstitialAd();
        loadRewardedVideoAd();
      } catch (e) {
        debugPrint('[AdManager] AdMob initialize error: $e');
      }
    }
  }

  Future<void> _loadPersistedState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _accumulatedActivePlaySeconds = prefs.getInt(_prefKeyActivePlaySeconds) ?? 0;
      _lastInterstitialTriggerSeconds = prefs.getInt(_prefKeyLastInterstitialTrigger) ?? 0;
      _lastVideoTriggerSeconds = prefs.getInt(_prefKeyLastVideoTrigger) ?? 0;
    } catch (e) {
      debugPrint('[AdManager] Error loading persisted timing state: $e');
    }
  }

  Future<void> _persistState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_prefKeyActivePlaySeconds, _accumulatedActivePlaySeconds);
      await prefs.setInt(_prefKeyLastInterstitialTrigger, _lastInterstitialTriggerSeconds);
      await prefs.setInt(_prefKeyLastVideoTrigger, _lastVideoTriggerSeconds);
    } catch (e) {
      debugPrint('[AdManager] Error saving timing state: $e');
    }
  }

  // --- Active Gameplay Time Tracking ---

  /// Called when a real Ludo match starts
  void onMatchStarted() {
    if (_isMatchActive) return;
    _isMatchActive = true;
    _matchStartTime = DateTime.now();

    _gameplayTicker?.cancel();
    _gameplayTicker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_isMatchActive) {
        _accumulatedActivePlaySeconds++;
        // Persist every 30 seconds
        if (_accumulatedActivePlaySeconds % 30 == 0) {
          _persistState();
        }
      }
    });
  }

  /// Called when app goes into background or match is paused
  void onGameplayPaused() {
    if (!_isMatchActive) return;
    _gameplayTicker?.cancel();
    _persistState();
  }

  /// Called when app returns to foreground with active match
  void onGameplayResumed() {
    if (!_isMatchActive) return;
    _gameplayTicker?.cancel();
    _gameplayTicker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_isMatchActive) {
        _accumulatedActivePlaySeconds++;
        if (_accumulatedActivePlaySeconds % 30 == 0) {
          _persistState();
        }
      }
    });
  }

  /// Called when match ends or user exits the game board
  Future<void> onMatchEnded() async {
    _isMatchActive = false;
    _gameplayTicker?.cancel();
    _matchStartTime = null;
    await _persistState();
  }

  // --- Ad Preloading ---

  void loadInterstitialAd() {
    if (kIsWeb) return;
    InterstitialAd.load(
      adUnitId: interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isInterstitialReady = true;
        },
        onAdFailedToLoad: (error) {
          _interstitialAd = null;
          _isInterstitialReady = false;
          debugPrint('[AdManager] Interstitial failed to load: $error');
        },
      ),
    );
  }

  void loadRewardedVideoAd() {
    if (kIsWeb) return;
    RewardedAd.load(
      adUnitId: rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedVideoAd = ad;
          _isRewardedVideoReady = true;
        },
        onAdFailedToLoad: (error) {
          _rewardedVideoAd = null;
          _isRewardedVideoReady = false;
          debugPrint('[AdManager] Rewarded ad failed to load: $error');
        },
      ),
    );
  }

  // --- Natural Break Ad Evaluation ---

  /// Evaluates and attempts to show qualified ads at a safe natural break (e.g. post match).
  /// Never interrupts match!
  Future<void> checkAndShowNaturalBreakAd({
    required VoidCallback onProceed,
  }) async {
    // Safety check 1: Never interrupt if match active or ad already showing
    if (_isMatchActive || _isShowingAd) {
      onProceed();
      return;
    }

    // Check 4-hour video ad condition first (higher milestone)
    final secondsSinceLastVideo = _accumulatedActivePlaySeconds - _lastVideoTriggerSeconds;
    if (_accumulatedActivePlaySeconds >= kFourHoursSeconds && secondsSinceLastVideo >= kFourHoursSeconds) {
      if (_isRewardedVideoReady && _rewardedVideoAd != null) {
        _showVideoAd(
          onFinished: () {
            _lastVideoTriggerSeconds = _accumulatedActivePlaySeconds;
            _persistState();
            onProceed();
          },
        );
        return;
      }
    }

    // Check 2-hour interstitial ad condition
    final secondsSinceLastInterstitial = _accumulatedActivePlaySeconds - _lastInterstitialTriggerSeconds;
    if (_accumulatedActivePlaySeconds >= kTwoHoursSeconds && secondsSinceLastInterstitial >= kTwoHoursSeconds) {
      if (_isInterstitialReady && _interstitialAd != null) {
        _showInterstitialAd(
          onFinished: () {
            _lastInterstitialTriggerSeconds = _accumulatedActivePlaySeconds;
            _persistState();
            onProceed();
          },
        );
        return;
      }
    }

    // No ad needed or ad unavailable: proceed immediately
    onProceed();
  }

  void _showInterstitialAd({required VoidCallback onFinished}) {
    if (_interstitialAd == null) {
      onFinished();
      return;
    }

    _isShowingAd = true;
    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _isShowingAd = false;
        _isInterstitialReady = false;
        loadInterstitialAd();
        onFinished();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _isShowingAd = false;
        _isInterstitialReady = false;
        loadInterstitialAd();
        onFinished();
      },
    );

    try {
      _interstitialAd!.show();
    } catch (e) {
      _isShowingAd = false;
      onFinished();
    }
  }

  void _showVideoAd({required VoidCallback onFinished}) {
    if (_rewardedVideoAd == null) {
      onFinished();
      return;
    }

    _isShowingAd = true;
    _rewardedVideoAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _isShowingAd = false;
        _isRewardedVideoReady = false;
        loadRewardedVideoAd();
        onFinished();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _isShowingAd = false;
        _isRewardedVideoReady = false;
        loadRewardedVideoAd();
        onFinished();
      },
    );

    try {
      _rewardedVideoAd!.show(
        onUserEarnedReward: (adWithoutView, reward) {
          // Video ad completed
        },
      );
    } catch (e) {
      _isShowingAd = false;
      onFinished();
    }
  }

  /// Create a banner ad with safe loading callback
  BannerAd createBannerAd({required Function(bool isLoaded) onLoadedStateChanged}) {
    return BannerAd(
      adUnitId: bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) => onLoadedStateChanged(true),
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          onLoadedStateChanged(false);
        },
      ),
    );
  }
}
