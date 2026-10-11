# AK Ludo — Firebase Setup & Deployment Guide

This document describes how to provision, configure, and secure Firebase Firestore and Realtime Database for **AK Ludo**.

---

## 1. Firebase Project Creation
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `ak-ludo-prod` (or your preferred name).
3. Enable **Google Analytics** (optional, recommended for AdMob tracking).

---

## 2. Authentication Setup
1. In the left navigation, click **Build > Authentication**.
2. Click **Get Started** and enable the following sign-in providers:
   - **Anonymous**: For instant one-tap guest play.
   - **Google**: For cross-device profile syncing and leaderboards.
   - **Email/Password** (optional).

---

## 3. Cloud Firestore Database
1. Go to **Build > Firestore Database** > **Create Database**.
2. Select your production region (e.g. `us-central1` or `asia-south1`).
3. Start in **Production mode**.
4. Deploy the rules from `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy composite indexes from `firestore.indexes.json`:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Collections Structure
- `/users/{userId}`: User document containing career stats, currency, and win rate.
- `/rooms/{roomId}`: Authoritative room configuration, status, host ID, and participants list.
- `/rooms/{roomId}/messages/{messageId}`: Real-time room chat with auto-expiration timestamp (`expiresAt`).
- `/leaderboard/{docId}`: Read-only global ranking document.

---

## 4. Firebase Realtime Database (RTDB)
Used for sub-100ms authoritative turns, dice synchronization, and player presence.

1. Go to **Build > Realtime Database** > **Create Database**.
2. Deploy the rules from `database.rules.json`:
   ```bash
   firebase deploy --only database
   ```

### Realtime Database Nodes
- `/games/{roomId}/turn`: Color of the currently active player.
- `/games/{roomId}/diceValue`: Authoritative dice result (1–6).
- `/games/{roomId}/tokens`: Real-time token coordinates.
- `/presence/{roomId}/{userId}`: Active presence heartbeat (`online` / `offline`).

---

## 5. Firebase Cloud Storage
Used for temporary 10-second voice notes.
1. Go to **Build > Storage** > **Get Started**.
2. Configure lifecycle rule to delete objects in `rooms/*/voice/*` older than 1 day.
