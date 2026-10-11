# AK Ludo — iOS Production Build & Release Guide

This document describes how to configure, sign, and build **AK Ludo** for iPhone and iPad devices using Xcode.

---

## 1. Prerequisites
- macOS Sonoma or Ventura
- Xcode 15 or higher
- Apple Developer Account ($99/year)
- CocoaPods (`brew install cocoapods` or `sudo gem install cocoapods`)

---

## 2. CocoaPods Setup
Navigate to the `ios` directory and install pods:
```bash
cd ios
pod repo update
pod install
cd ..
```

---

## 3. Configure App ID & Signing in Xcode
1. Open the project in Xcode:
   ```bash
   open ios/Runner.xcworkspace
   ```
2. In the project navigator, click **Runner**.
3. Under the **Signing & Capabilities** tab:
   - Check **Automatically manage signing**.
   - Select your registered **Apple Developer Team**.
   - Bundle Identifier: `com.akmindtrainer.game`.

---

## 4. Permissions & Privacy Keys
Already configured in `ios/Runner/Info.plist`:
- `NSMicrophoneUsageDescription`: Microphone access for real-time voice chat with friends.
- `GADApplicationIdentifier`: Google AdMob iOS App ID.
- `SKAdNetworkItems`: SKAdNetwork attribution identifiers for iOS 14+ ad compliance.

---

## 5. Build Commands

### Clean Build Cache
```bash
flutter clean
flutter pub get
```

### Build IPA Archive for TestFlight / App Store
```bash
flutter build ipa --release
```
Output: `build/ios/archive/Runner.xcarchive`

### Upload to App Store Connect
Use Xcode Organizer (`Window > Organizer`) or Transporter app to validate and distribute the `.ipa` directly to TestFlight and App Store Connect.
