import 'package:flutter/material.dart';

enum PlayerColor { red, green, yellow, blue }

enum TokenState { home, active, safe, finished }

enum GamePhase { waiting, rolling, moving, finished }

class AppConstants {
  static const String appName = 'AK Ludo';
  static const int boardDimension = 15;
  static const int turnTimeoutSeconds = 15;

  // Premium Ludo Board Color Palette
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

  static const Color boardBackground = Color(0xFF0A0F1D);
  static const Color cardDark = Color(0xFF161F36);
  static const Color goldAccent = Color(0xFFFFD700);

  // Standard 52-step track indices + star safe cells
  static const List<int> safeCellIndices = [0, 8, 13, 21, 26, 34, 39, 47];

  // Start indexes for each player on standard track
  static const Map<PlayerColor, int> startStepIndex = {
    PlayerColor.red: 0,
    PlayerColor.green: 13,
    PlayerColor.yellow: 26,
    PlayerColor.blue: 39,
  };
}
