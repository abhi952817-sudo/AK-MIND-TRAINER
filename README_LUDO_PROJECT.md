# AK MIND TRAINER — Ludo Project Structure & Setup Guide

> This is a project guide for the existing repository. It is not a replacement for the app's existing `README.md`, and it does not change or generate application code.

## 1. Repository

GitHub repository:
https://github.com/abhi952817-sudo/AK-MIND-TRAINER

Default branch observed during inspection: `main`

## 2. Where to put these documentation files

Upload both files to the **root of the repository** — the same level where `package.json`, `index.html`, and the existing `README.md` are located.

```text
AK-MIND-TRAINER/                 ← repository root
├── README.md                    ← existing README; do not overwrite it
├── README_LUDO_PROJECT.md       ← this guide; add this new file
├── LUDO_MASTER_SPEC.md          ← master requirements; add this new file
├── package.json
├── index.html
├── vite.config.ts               ← verify in repository before assuming it exists
├── src/
├── tests/
└── ...
```

The tree above is a guide to the root-level placement. The exact complete tree should be generated from GitHub before treating this as a full inventory.

### Upload from a mobile browser
1. Open the repository link above and sign in to GitHub.
2. Open the `main` branch.
3. At the repository root, tap **Add file** → **Upload files**.
4. Select `README_LUDO_PROJECT.md` and `LUDO_MASTER_SPEC.md` from your phone.
5. Keep both filenames exactly as shown.
6. Enter a commit message such as `docs: add Ludo project guide and master specification`.
7. Commit to `main` only if you are comfortable doing so. If the repository offers a branch option, a separate documentation branch is safer.
8. Open each file in GitHub and verify the content appears correctly.

**Important:** The assistant's GitHub connection returned a permission error when trying to write files, so these files have been prepared for download but have not been committed to the repository by the assistant.

## 3. Existing project stack

The repository currently uses:
- React
- TypeScript
- Vite
- Tailwind CSS

Do not rewrite the project in Flutter or replace the existing app template unless a future audit identifies a real blocker and the owner approves it.

## 4. Existing Ludo source files found during inspection

```text
src/
├── games/
│   └── ludo/
│       ├── engine.ts
│       ├── rules.ts
│       ├── types.ts
│       ├── board.ts
│       ├── bot.ts
│       ├── useLudo.ts
│       ├── octagonalEngine.ts
│       ├── octagonalBoard.ts
│       ├── useOctagonalLudo.ts
│       ├── LudoBoard.tsx
│       ├── LudoToken.tsx
│       └── OctagonalLudoBoard.tsx
│
└── components/
    └── ludoverse/
        ├── HomeScreen.tsx
        ├── GameScreen.tsx
        ├── Dice3DCube.tsx
        ├── LobbyScreen.tsx
        ├── RoomWaitingScreen.tsx
        ├── ChatOverlay.tsx
        ├── WinnerScreen.tsx
        └── ...other existing UI components
```

This is a list of inspected paths, not a claim that these files are complete or bug-free. Read the current source and run tests before changing it. Other project files and games may exist; do not remove them.

## 5. Existing test files found during inspection

```text
tests/
├── activeLudoEngine.test.ts
├── ludoEngine.test.ts
├── gameStateLifecycle.test.ts
├── tokenMovementAnimation.test.ts
├── playerConfiguration.test.ts
├── uiResponsiveness.test.ts
└── ludoverseDesignSystem.test.ts
```

Keep existing tests. Add or update tests when changing rules, turn order, board configurations, bots, animations, or multiplayer state.

## 6. What each documentation file is for

### `README_LUDO_PROJECT.md`
This file:
- explains where the project documentation belongs;
- shows the known Ludo source-file layout;
- describes how to upload the documents from a phone;
- provides a safe workflow for future code changes.

### `LUDO_MASTER_SPEC.md`
This file is the stable requirements contract. It records the agreed game direction, including:
- 2D board; only the dice may rotate in 3D;
- preserve the existing Home Screen and working features;
- offline solo play against bots as a requirement to implement and verify;
- planned larger player-count and team modes;
- temporary chat/voice bubbles;
- a future optional NEET Biology question mode using an isolated adapter;
- cross-platform direction for web, Android, iOS, and Mac;
- no unapproved cash/recharge/withdrawal features;
- tests and build evidence required after changes.

## 7. Cross-platform build direction

1. Keep the current React + TypeScript + Vite project as the shared codebase.
2. Confirm the existing web app builds and its tests pass.
3. Audit browser APIs, audio, networking, permissions, and responsive layouts.
4. Add Capacitor for Android packaging only after compatibility checks.
5. Use GitHub Actions to create an Android APK in the cloud and publish it as a workflow artifact.
6. Treat iOS and macOS builds as separate targets; an Android APK workflow does not create those builds.
7. For MacBook, support the browser build first. Evaluate a separately installed Mac app later.

Never commit signing passwords, API secrets, service-account keys, or private credentials to GitHub.

## 8. Safe coding-agent instructions

Before an agent edits the project, ask it to:
1. Read `README.md`, `README_LUDO_PROJECT.md`, and `LUDO_MASTER_SPEC.md`.
2. Inspect the current files and tests; do not assume this guide is the complete repository tree.
3. List proposed file changes and explain why each is needed.
4. Preserve the Home Screen and unrelated games.
5. Make small, reviewable patches.
6. Run the available lint, test, and production-build scripts.
7. Report exact results and known limitations; never claim success without logs.
8. Avoid duplicate Ludo engines or competing sources of truth.
9. Do not add payments, withdrawals, recharge payouts, or a real-money economy unless separately approved.

## 9. Recommended next phases

- Phase 1: Complete recursive repository inventory and map existing files to requirements.
- Phase 2: Run baseline lint, tests, and production build; record failures before edits.
- Phase 3: Audit the standard four-player game, bots, and offline behavior.
- Phase 4: Fix verified gameplay defects with regression tests.
- Phase 5: Audit online rooms, turn synchronization, reconnection, chat, and voice.
- Phase 6: Implement and test additional player-count/team variants one at a time.
- Phase 7: Add the optional question mode through a separate adapter after normal Ludo is stable.
- Phase 8: Add and test cloud Android APK builds.
- Phase 9: Separately validate iOS and Mac targets.

Do not guess a final file count until Phase 1 is complete. Prefer reusing suitable files and adding only necessary ones.
