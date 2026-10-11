# AK Ludo — Premium 3D Cross-Platform Online Multiplayer

**AK Ludo** is an authoritative cross-platform 3D Ludo game with real-time multiplayer, WebRTC voice chat, server-guarded floating chat, dynamic 3D visuals, and Google AdMob monetization.

---

## 🏆 Key Features

### 1. Authoritative Multiplayer Engine
- **Server-Authoritative Dice & Turns**: Dice outcomes are calculated server-side or via cryptographically secure pseudo-random generators (`Random.secure()`).
- **Path & Collision Validation**: Standard 52-cell track with 8 safe star milestone squares (`(8,2)`, `(6,12)`, `(2,6)`, `(12,8)` + 4 base exits).
- **Matchmaking & Rooms**: 6-character room codes (`ABCDEF`), 2, 3, or 4 player configurations, host authority, and smart AI bot fillers.
- **Heartbeat & Disconnection Handling**: Automatic turn forfeit / auto-pass upon player timeout (15-second radial timer).

### 2. Premium 3D Visual Experience
- **Perspective & Depth**: 3D wooden plinth with metallic gold trim and optional isometric perspective view tilt.
- **Glossy Spherical Tokens**: Specular reflection highlights, metallic rims, and dynamic drop shadows that shrink and blur as tokens hop into the air.
- **3D Animated Dice**: Physical rolling animation, wobbles, and pip shadows.
- **Particle & Combat Effects**: Token capture screen crunch, star sparkle safe cell chimes, and full-screen victory confetti.

### 3. Real-Time Floating Chat & Voice Messages
- **Avatar-Anchored Speech Bubbles**: Text, emoji, and voice notes emerge directly from the sending player's avatar.
- **Configurable Bubble Lifetime**: Host can choose between 10s, 20s, 30s, or 60s message duration.
- **Server-Authoritative Anti-Spam Cooldown**: 30-second cooldown prevents flooding and cannot be bypassed by changing device clocks.
- **Multilingual Support & Moderation**: Hindi + English banter presets with built-in profanity masking.
- **Voice Notes**: Up to 10-second voice clips with inline waveform visualization and progress bars.

### 4. Audio & Real-Time Voice Chat
- **Scene-Aware Soundtracks**: Home, Lobby, Gameplay, and Victory themes.
- **Haptics & SFX**: Dice rattling, token hops, capture impacts, safe star chimes, turn alert notifications, and 5-second countdown clock ticks.
- **WebRTC Voice Chat**: Live room voice channel with speaking aura rings around active avatars and automatic disconnection when leaving the match.

### 5. AdMob Architecture
- **Pre-Game Interstitial Sponsor**: Displayed strictly before match entry with a maximum 3.5s timeout guarantee.
- **Gameplay Integrity**: Active matches are never interrupted with full-screen ads.
- **Post-Game Bonus Opportunities**: Non-intrusive rewards after match completion.

---

## 📁 Repository Structure

```
├── lib/                             # Flutter / Dart Mobile Codebase
│   ├── ads/                         # Central AdMob Service
│   ├── audio/                       # Audio Manager & Synthesizer
│   ├── chat/                        # Floating Chat & Message Models
│   ├── core/                        # Coordinates, Constants, Theme
│   ├── firebase/                    # Firestore & RTDB Services
│   ├── models/                      # Player, Room, Token Models
│   ├── screens/                     # Home, Lobby, and Game Screens
│   ├── services/                    # Authoritative Game & Presence Engine
│   ├── voice/                       # WebRTC Voice Chat Service
│   └── main.dart                    # Mobile App Entrypoint
├── src/                             # Interactive Web Applet
│   ├── components/                  # Board3D, Dice3D, PlayerPod, Chat, Ads
│   ├── services/                    # Web Central AdService & VoiceChatService
│   ├── types/                       # TypeScript Game & Chat Definitions
│   ├── utils/                       # Web Audio Synthesizer & Ludo Engine
│   └── App.tsx                      # Web Interactive Game Engine
├── android/                         # Android Manifest & Native Configurations
├── ios/                             # iOS Info.plist & CocoaPods Specs
├── firestore.rules                  # Firestore Security Rules
├── firestore.indexes.json           # Composite Database Indexes
├── database.rules.json              # Realtime Database Security Rules
├── pubspec.yaml                     # Flutter Dependencies Specification
└── docs/                            # Deployment & Release Documentation
```

---

## 🚀 Running the Project

### Web Application
```bash
npm install
npm run dev     # Starts local server on http://localhost:3000
npm run build   # Compiles production bundle
```

### Mobile Application (Flutter)
```bash
flutter pub get
flutter run
flutter build apk --release       # Production Android APK
flutter build appbundle --release # Google Play Store Bundle
flutter build ipa --release       # Apple App Store Archive
```
