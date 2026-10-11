import 'package:flutter/material.dart';

/// Ludo token colors.
enum PlayerColor {
  red,
  green,
  yellow,
  blue,
}

/// State of an individual token.
enum TokenState {
  home,
  active,
  safe,
  finished,
}

/// Current phase of a match.
enum GamePhase {
  waiting,
  rolling,
  moving,
  finished,
}

/// Game modes supported by the app.
enum LudoPlayMode {
  individual,
  team,
}

/// Shared application and Ludo constants.
class AppConstants {
  AppConstants._();

  // Application identity.
  static const String appName = 'AK MIND TRAINER';

  static const String gameName = 'Ludo';

  static const String tagline = 'Play. Compete. Win.';

  // Standard four-player Ludo board.
  static const int boardDimension = 15;

  static const int turnTimeoutSeconds = 15;

  static const int tokensPerPlayer = 4;

  static const int standardTrackLength = 52;

  // Supported player counts.
  // Actual board layouts and game rules must be implemented separately.
  static const List<int> supportedPlayerCounts = <int>[
    3,
    4,
    5,
    6,
    9,
    10,
  ];

  // Standard Ludo colors.
  static const Color redPrimary = Color(0xFFE53935);
  static const Color redLight = Color(0xFFFF6F60);
  static const Color redDark = Color(0xFFAB000D);

  static const Color greenPrimary = Color(0xFF43A047);
  static const Color greenLight = Color(0xFF76D275);
  static const Color greenDark = Color(0xFF00701A);

  static const Color yellowPrimary = Color(0xFFFDD835);
  static const Color yellowLight = Color(0xFFFFEB3B);
  static const Color yellowDark = Color(0xFFC6A700);

  static const Color bluePrimary = Color(0xFF1E88E5);
  static const Color blueLight = Color(0xFF6AB7FF);
  static const Color blueDark = Color(0xFF005CB2);

  // Shared application colors.
  static const Color boardBackground = Color(0xFF0A0F1D);

  static const Color cardDark = Color(0xFF161F36);

  static const Color goldAccent = Color(0xFFFFD700);

  static const Color backgroundDark = Color(0xFF1A1A2E);

  static const Color backgroundLight = Color(0xFFF8F9FA);

  // Safe cells for the standard 52-step board.
  static const List<int> safeCellIndices = <int>[
    0,
    8,
    13,
    21,
    26,
    34,
    39,
    47,
  ];

  // Starting positions for the standard four-player board.
  static const Map<PlayerColor, int> startStepIndex =
      <PlayerColor, int>{
    PlayerColor.red: 0,
    PlayerColor.green: 13,
    PlayerColor.yellow: 26,
    PlayerColor.blue: 39,
  };

  /// Checks whether a player count is listed as supported.
  ///
  /// This only validates the selection. It does not mean that
  /// the corresponding board and game rules are already implemented.
  static bool isSupportedPlayerCount(int count) {
    return supportedPlayerCounts.contains(count);
  }
}
