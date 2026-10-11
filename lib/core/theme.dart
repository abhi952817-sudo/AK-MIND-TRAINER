import 'package:flutter/material.dart';

class AppConstants {
  // LudoVerse Identity
  static const String appName = 'LudoVerse';
  static const String tagline = 'Play. Compete. Win.';

  // LudoVerse Color Palette
  static const Color primaryRed = Color(0xFFE63946);
  static const Color secondaryGreen = Color(0xFF2A9D8F);
  static const Color accentYellow = Color(0xFFF4A261);
  static const Color playerBlue = Color(0xFF457B9D);

  static const Color backgroundDark = Color(0xFF1A1A2E);
  static const Color backgroundLight = Color(0xFFF8F9FA);

  static const Color surfaceDark = Color(0xFF16213E);
  static const Color surfaceLight = Color(0xFFFFFFFF);

  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textPrimaryLight = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF8D99AE);

  static const Color error = Color(0xFFEF476F);
  static const Color success = Color(0xFF06D6A0);

  // Board Colors
  static const Color redHome = Color(0xFFE63946);
  static const Color greenHome = Color(0xFF2A9D8F);
  static const Color yellowHome = Color(0xFFF4A261);
  static const Color blueHome = Color(0xFF457B9D);
  static const Color boardPath = Color(0xFFFFFFFF);
  static const Color boardBorder = Color(0xFF1A1A2E);
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppConstants.backgroundDark,
      primaryColor: AppConstants.primaryRed,
      colorScheme: const ColorScheme.dark(
        primary: AppConstants.primaryRed,
        secondary: AppConstants.secondaryGreen,
        surface: AppConstants.surfaceDark,
        error: AppConstants.error,
      ),
      fontFamily: 'Inter',
      cardTheme: CardTheme(
        color: AppConstants.surfaceDark,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConstants.primaryRed,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Poppins',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppConstants.backgroundLight,
      primaryColor: AppConstants.primaryRed,
      colorScheme: const ColorScheme.light(
        primary: AppConstants.primaryRed,
        secondary: AppConstants.secondaryGreen,
        surface: AppConstants.surfaceLight,
        error: AppConstants.error,
      ),
      fontFamily: 'Inter',
      cardTheme: CardTheme(
        color: AppConstants.surfaceLight,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConstants.primaryRed,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Poppins',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
