# Implementation Plan: Cross-Platform Structure (Web PWA, Android, iOS/macOS)

## 1. Scope & Goals — Status: Completed ✅
Established a production-grade cross-platform configuration and asset structure supporting:
- **Web**: Progressive Web App (PWA) compliance with `vite-plugin-pwa`, Web App Manifest (`manifest.json`), 192px/512px/maskable splash icons, and offline caching.
- **Android**: Android Gradle project configuration (`android/build.gradle`, `android/app/build.gradle`, `android/settings.gradle`, `AndroidManifest.xml`), and permission declarations (Internet, Network State, Vibration, Audio).
- **iOS & macOS**: iOS bundle configuration (`ios/Runner/Info.plist`), macOS bundle & project configurations (`macos/Runner/Info.plist`, `AppInfo.xcconfig`), responsive touch & pointer handling, and SafeArea support.

---

## 2. Technical Architecture & Components

### A. Progressive Web App (PWA) & Web Manifest (`public/manifest.json` & `index.html`) ✅
1. **Web App Manifest**:
   - App name: "AK Mind Trainer - LudoVerse"
   - Short name: "LudoVerse" (≤ 12 chars)
   - Icons: `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, and `icon.svg`.
   - Theme color: `#161824`, background color: `#0F111A`, display: `standalone`.
2. **Viewport & PWA Meta Tags**:
   - `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`
   - Apple Touch Icon, mobile web app capabilities, and status bar translucency.
3. **In-App PWA Install UI**:
   - `usePWAInstall` hook detecting standalone mode, Android/Chromium `beforeinstallprompt`, and iOS Safari Add-to-Home-Screen.
   - `PWAInstallButton` mounted in `HomeScreen` greeting row with iOS guidance modal.
   - `OfflineIndicator` toast for offline network status.

### B. Android Configuration (`android/`) ✅
1. **Gradle Build Files**:
   - `android/settings.gradle`
   - `android/build.gradle` (Gradle 8.2 & Google Services)
   - `android/app/build.gradle` (compileSdk 34, minSdk 21, targetSdk 34)
2. **AndroidManifest.xml**:
   - Package name: `com.akmindtrainer.game`
   - Permissions: INTERNET, ACCESS_NETWORK_STATE, VIBRATE, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS.
   - Screen orientation: portrait with multi-window resize support.

### C. iOS & macOS Configuration (`ios/` & `macos/`) ✅
1. **iOS (`ios/Runner/Info.plist`)**:
   - Display name "AK MIND TRAINER", microphone permissions for in-game multiplayer chat, status bar appearance.
2. **macOS (`macos/Runner/Info.plist` & `macos/Runner/Configs/AppInfo.xcconfig`)**:
   - Bundle identifier `com.akmindtrainer.ludoverse.macos`, minimum macOS deployment target, microphone access description.
3. **Desktop & Touch Input Optimization**:
   - Keyboard listener (Space to roll dice, Esc for menu) on macOS/Web desktop.
   - Safe area padding `pb-[env(safe-area-inset-bottom)]`.

---

## 3. Verification & Testing ✅
- Added `tests/crossPlatformPwa.test.ts` covering platform detection, manifest validation, asset presence, Android Gradle configs, and iOS/macOS bundle plists.
- Verified all 12 test suites pass (`npm test`).
- Verified TypeScript compilation and ESLint (`npm run lint`, `compile_applet`).
