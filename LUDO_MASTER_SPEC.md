# AK MIND TRAINER — Ludo Master Specification
Version: 1.0
Status: Stable requirements contract
Purpose: Preserve the agreed Ludo plan across future coding-agent sessions.

## 1. Non-negotiable rules
1. Work in the existing repository and inspect existing code before editing.
2. Do not replace the project with a fresh template, rewrite it in Flutter, or remove working features without explicit approval.
3. Preserve the existing Home Screen, navigation, login/signup screens, classic board, octagonal board, Ludo engine, dice, tokens, rules, winner screen, and other games/features unless an audit proves a specific change is necessary and the user approves it.
4. Make small, reviewable changes. Identify affected files and reasons before each phase; run tests and production build after changes.
5. Never claim a feature works, a build succeeded, or a bug is fixed without actual test/build evidence.
6. Never commit API keys, signing passwords, service-account keys, or other secrets.
7. Do not add cash rewards, recharge payouts, withdrawals, payment integrations, or real-money features unless explicitly requested and separately approved.
8. Keep this document as the stable requirements contract. If a requirement changes, add a dated decision note rather than silently changing the original intent.

## 2. Repository observations
Repository: `abhi952817-sudo/AK-MIND-TRAINER`

Current web stack: React + TypeScript + Vite + Tailwind CSS.

Existing Ludo modules under `src/games/ludo/` include:
- `engine.ts`, `rules.ts`, `types.ts`, `board.ts`, `bot.ts`
- `useLudo.ts`, `octagonalEngine.ts`, `octagonalBoard.ts`, `useOctagonalLudo.ts`
- `LudoBoard.tsx`, `LudoToken.tsx`, `OctagonalLudoBoard.tsx`

Existing UI includes `src/components/ludoverse/GameScreen.tsx`, `Dice3DCube.tsx`, `LobbyScreen.tsx`, `RoomWaitingScreen.tsx`, `ChatOverlay.tsx`, `HomeScreen.tsx`, `WinnerScreen.tsx`, and other screens.

Existing tests include `tests/activeLudoEngine.test.ts`, `tests/ludoEngine.test.ts`, `tests/gameStateLifecycle.test.ts`, `tests/tokenMovementAnimation.test.ts`, `tests/playerConfiguration.test.ts`, `tests/uiResponsiveness.test.ts`, and `tests/ludoverseDesignSystem.test.ts`.

These are repository-path observations, not proof every feature works. Always read the current implementation and run tests before modifying it.

## 3. Agreed Ludo design

### Board and visuals
- The Ludo board itself must be 2D.
- The dice may be a rotating 3D cube. Do not make the whole board 3D.
- Use four classic player colours for standard four-player Ludo.
- No floating profile bubbles fixed at the top of the screen.
- Chat and voice indicators should appear as temporary, avatar-associated/floating bubbles while messages or voice activity are present, then fade away according to the selected duration.
- Keep the layout responsive on small Android phones, larger phones, tablets, and desktop browsers.

### Player counts, bots and teams
- Standard four-player Ludo remains the baseline mode.
- Plan for room configuration options discussed by the user: 4, 5, 6, 9, and 10 players. Do not enable a variant until board geometry, turn order, colours, rules, and tests are implemented together.
- Team/jodi mode must define teammates, opponents, turn order, and win conditions explicitly; do not silently treat it as free-for-all.
- A solo user can play locally against bots. If a room has empty seats, bots may fill them only according to the host/settings; never replace a human who has joined.
- Clearly distinguish offline/local bot play from online room play. Do not claim online multiplayer works without verified server/realtime transport.

### Gameplay and reliability
- Test legal moves, six-to-exit, safe squares, captures, home-lane movement, exact finish, extra turns, blocked moves, skipped turns, turn timer, disconnections, rematches, and winner detection against the selected rules.
- Keep rules in engine/rules modules rather than duplicating them inside visual components.
- UI animation must not decide the authoritative game result.
- Prefer isolated modules/adapters and regression tests instead of changing a working core engine unnecessarily.

### Chat, voice, audio and ads
- Chat/voice must be optional and fail gracefully when permissions or network support are unavailable.
- Provide controls to mute/reduce sound and haptics; audio must not block a turn.
- Ads, if enabled, must not interrupt an active match. Use test ads during development.
- Existing coin/spin/ad UI must be audited before changes; it is not permission to introduce cash withdrawals, recharge payouts, or payments.

## 4. Future educational mode — only after normal Ludo is stable
- Add optional NEET Biology question mode.
- The host can turn it ON/OFF and choose chapters.
- Prefer a separate `quizEngine` / `gameRuleBridge` adapter so quiz logic does not corrupt normal Ludo rules.
- All four tokens belonging to a player must be able to trigger configured question spots according to the agreed board design.
- Discussed movement bonus: easy +1 step, medium +5 steps, hard +8 steps; one minute per question.
- Before final implementation, define how bonuses interact with captures, safe squares, exact finish, extra turns, and blocked moves.
- Normal Ludo must work unchanged when question mode is OFF.

## 5. Cross-platform direction
- Keep React + TypeScript as the shared UI/game code unless an audit identifies a hard blocker.
- First target: responsive web build.
- Android/iOS packaging may use Capacitor after checking browser APIs, audio, networking, permissions, and plugins.
- MacBook browser support uses the web build.
- A separately installed macOS app is a separate packaging target; evaluate Electron/Tauri after web/mobile is stable.
- An Android workflow does not automatically build/sign iOS and macOS apps. Test each target independently.
- Android APK can be built in GitHub Actions and uploaded as a workflow artifact. Never commit generated APKs or signing secrets.

## 6. Required implementation workflow
For every phase:
1. Inspect relevant files and existing tests.
2. List exact planned changes and risks.
3. Make the smallest viable patch.
4. Run `npm run lint`, `npm test`, and `npm run build` where applicable. Report pre-existing failures separately.
5. Add/update tests for new rules and regressions.
6. Run responsive UI checks and real-device/browser smoke tests when possible.
7. Report changed files, test results, build result, limitations, and rollback commit.
8. Keep Home Screen and unrelated games untouched unless explicitly authorized.

## 7. File-count and architecture rule
Do not invent an exact final file count before a recursive repository inventory and a file-to-requirement mapping. Reuse suitable existing files and add only necessary modules. Produce a file-by-file plan with columns: path, existing/new, responsibility, reason, dependencies, tests, phase. Avoid duplicate engines, duplicate game-state stores, and competing sources of truth.

## 8. Acceptance checklist
- Existing Home Screen and non-Ludo games still open.
- Standard four-player Ludo passes the existing engine/lifecycle tests.
- Board is 2D; only the dice uses 3D rotation.
- Solo offline bot play works without internet when selected.
- Online room features are marked complete only after real multi-device testing.
- Player-count/team modes are enabled only after rules, UI, engine, and tests agree.
- Chat/voice bubbles are temporary and do not permanently clutter the screen.
- Web production build passes.
- Android APK can be generated in the cloud and installed/tested.
- iOS and macOS support are reported separately with build/test evidence.
- No unapproved cash/recharge/withdrawal feature is added.

## 9. Decision log
- 2026-10-11: Preserve the existing React + TypeScript + Vite project; investigate shared cross-platform packaging instead of rewriting from scratch.
- 2026-10-11: Board is 2D; only the dice is 3D-animated.
- 2026-10-11: Offline play with bots and configurable larger player/team variants are requirements to plan and test, not features to falsely label as complete.
