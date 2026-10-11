# AK Ludo — Production Release Checklist

Review and sign off on each item before publishing the production build to Google Play Store and Apple App Store.

---

## 1. Security & Anti-Cheat
- [x] **Server-Authoritative Dice**: Dice generation uses `Random.secure()` / server validation; clients cannot inject custom values.
- [x] **Turn Authority**: Firestore/RTDB rules prevent players from moving when it is not their active color turn.
- [x] **Collision Validation**: Strict safe-cell checks (`safeCellIndices: [0, 8, 13, 21, 26, 34, 39, 47]`) and home stretch bounding.
- [x] **Anti-Spam Cooldown**: Enforced via server timestamps (`cooldownUntil`); device clock changes cannot bypass rate limits.
- [x] **Message Sanitization**: Multilingual profanity filters in Hindi and English with length caps (≤120 characters).
- [x] **No Hardcoded Secrets**: Client apps contain zero private API keys or admin service account tokens.

---

## 2. Audio & Performance
- [x] **Local Compressed Audio**: Sound effects and scene background music are cached with minimal battery drain.
- [x] **Voice Auto-Sever**: Real-time voice chat disconnects automatically when returning home or leaving match.
- [x] **3D Hardware Acceleration**: CSS 3D transforms (`transform-gpu`) / Flutter hardware rendering enabled in manifests.
- [x] **Offline & Weak Network Guard**: Match start proceeds smoothly even if pre-game ad fails or internet flickers.

---

## 3. Store Compliance & AdMob
- [x] Pre-game interstitial ad is displayed only before match entry with a maximum 3.5s timeout.
- [x] Active gameplay is never interrupted with full-screen ads.
- [x] Microphone permission disclosure configured in `AndroidManifest.xml` and `Info.plist`.
- [x] SKAdNetwork keys specified for iOS App Tracking Transparency.
