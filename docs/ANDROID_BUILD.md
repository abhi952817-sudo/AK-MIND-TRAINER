# AK Ludo — Android Production Build Guide

This document describes how to generate release keystores, build the signed release APK, and produce the Google Play App Bundle (`.aab`).

---

## 1. Prerequisites
- Android Studio Hedgehog (2023.1.1) or higher
- Flutter 3.16+ SDK
- Java JDK 17

---

## 2. Generate Release Keystore
Generate an upload keystore using `keytool`:

```bash
keytool -genkey -v -keystore android/app/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Create `android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=upload-keystore.jks
```

---

## 3. Configure Google AdMob App ID
Ensure your production AdMob Application ID is configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-YOUR_ADMOB_APP_ID"/>
```

---

## 4. Build Commands

### Clean Cache & Dependencies
```bash
flutter clean
flutter pub get
```

### Build Signed APK (For Direct Distribution / Testing)
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

### Build App Bundle (For Google Play Store Release)
```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`
