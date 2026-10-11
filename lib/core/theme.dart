import 'package:flutter/material.dart';

/// Shared visual tokens for AK MIND TRAINER.
/// Ludo-specific colors remain in core/constants.dart.
class ThemePalette {
  ThemePalette._();

  static const Color primary = Color(0xFFE63946);
  static const Color secondary = Color(0xFF2A9D8F);
  static const Color accent = Color(0xFFF4A261);

  static const Color backgroundDark = Color(0xFF1A1A2E);
  static const Color surfaceDark = Color(0xFF16213E);

  static const Color backgroundLight = Color(0xFFF8F9FA);
  static const Color surfaceLight = Color(0xFFFFFFFF);

  static const Color textDark = Color(0xFF1A1A2E);
  static const Color textMuted = Color(0xFF8D99AE);

  static const Color error = Color(0xFFEF476F);
  static const Color success = Color(0xFF06D6A0);
}

class AppTheme {
  AppTheme._();

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: ThemePalette.backgroundDark,
      primaryColor: ThemePalette.primary,

      colorScheme: const ColorScheme.dark(
        primary: ThemePalette.primary,
        secondary: ThemePalette.secondary,
        surface: ThemePalette.surfaceDark,
        error: ThemePalette.error,
      ),

      appBarTheme: const AppBarTheme(
        backgroundColor: ThemePalette.backgroundDark,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),

      cardTheme: CardTheme(
        color: ThemePalette.surfaceDark,
        elevation: 2,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ThemePalette.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 12,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ThemePalette.surfaceDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Colors.white12,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: ThemePalette.secondary,
            width: 1.5,
          ),
        ),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: ThemePalette.backgroundLight,
      primaryColor: ThemePalette.primary,

      colorScheme: const ColorScheme.light(
        primary: ThemePalette.primary,
        secondary: ThemePalette.secondary,
        surface: ThemePalette.surfaceLight,
        error: ThemePalette.error,
      ),

      appBarTheme: const AppBarTheme(
        backgroundColor: ThemePalette.backgroundLight,
        foregroundColor: ThemePalette.textDark,
        elevation: 0,
        centerTitle: false,
      ),

      cardTheme: CardTheme(
        color: ThemePalette.surfaceLight,
        elevation: 1,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ThemePalette.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 12,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ThemePalette.surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: Color(0xFFE5E7EB),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: ThemePalette.secondary,
            width: 1.5,
          ),
        ),
      ),
    );
  }
}
