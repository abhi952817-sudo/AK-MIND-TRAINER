# Implementation Plan: Critical Engine Fixes, Blockade Correction & 10-Point Classic Ludo Verification

Based on the thorough codebase audit against the **Ludo Master Specification** and GitHub repository findings, this plan prioritizes fixing real code discrepancies, eliminating audio duplication, correcting blockade rules, and executing a rigorous 10-point verification checklist—without unnecessary rewrites or breaking working visual designs.

---

## 1. Fix Duel (2-Player) Turn Advancement Bug (Critical)
- **Problem**: In `GameScreen.tsx`, `TWO_PLAYERS` contains Player 0 (Blue) and Player 2 (Green, Marcus). In `engine.ts`, `findNextActivePlayer()` computes `(current + 1) % players.length`. For a 2-player game, `(0 + 1) % 2 = 1`. Index 1 does not exist in `TWO_PLAYERS`, leaving Marcus's tokens (`playerIndex: 2`) unselectable and stalling the turn loop.
- **Solution**: Refactor `findNextActivePlayer()` to locate the current player in the `players` roster by index and cycle to the next valid participant:
  ```ts
  const currentPos = players.findIndex(p => p.index === current);
  const nextPos = (currentPos >= 0 ? currentPos + 1 : 0) % players.length;
  let next = players[nextPos].index;
  ```
  This guarantees turn alternation (`0 → 2 → 0 → 2`) regardless of whether player indices are contiguous.

---

## 2. Eliminate Double Dice Sound Triggers (High Priority)
- **Problem**: Both `useLudo.ts` (and polygonal hooks) and `Dice3DCube.tsx` call `soundEngine.playDiceRattle()`, `soundEngine.playDiceLand()`, and `soundEngine.playDiceSixBonus()` / `soundEngine.playSixSound()`, triggering duplicate overlapping sound effects on every roll.
- **Solution**: Centralize dice audio management strictly within the game hooks (`useLudo.ts`, `usePolygonalLudo.ts`). Make `Dice3DCube.tsx` purely responsible for 3D physics rendering and visual animations, removing redundant internal audio invocations.

---

## 3. Correct Same-Player Blockade Logic in `rules.ts` (Medium Priority)
- **Problem**: `getEnemyBlockadeTrackIndices()` in `src/games/ludo/rules.ts` tallies all opponent tokens on a tile together into a single counter. If Player 1 (Red) and Player 2 (Green) each have 1 token on safe cell 8, it incorrectly registers an opponent blockade.
- **Solution**: A blockade strictly requires 2 or more tokens belonging to the **same** opponent player (or same allied team in team mode). Update `getEnemyBlockadeTrackIndices()`:
  ```ts
  // Key by: `${trackIdx}-${token.playerIndex}` (or `${trackIdx}-${teamId}` in team mode)
  // Only add trackIdx to blockades if a single opponent entity has count >= 2
  ```
- **Regression Tests**: Add automated tests verifying that tokens of two different opponents sharing a safe star cell do NOT form a blockade.

---

## 4. Synchronize `board.ts` Color Comments (Documentation & Maintenance)
- **Problem**: `board.ts` comments describe Player 0 as Red, 1 as Green, 2 as Yellow, 3 as Blue, whereas `LudoBoard.tsx` and the actual grid coordinates render Player 0 as Blue (`[6, 1]`), 1 as Red (`[1, 8]`), 2 as Green (`[8, 13]`), and 3 as Yellow (`[13, 6]`). The coordinate math is correct, but outdated comments invite future misconfigurations.
- **Solution**: Update the comments and annotations in `src/games/ludo/board.ts` to strictly reflect `0=Blue, 1=Red, 2=Green, 3=Yellow` without touching the verified coordinate arrays.

---

## 5. Engine Consolidation & Test Coverage Clarity
- **Status**: The active application UI exclusively uses `src/games/ludo/engine.ts` and `useLudo.ts`. The legacy file `src/utils/ludoEngine.ts` is only referenced by older test files.
- **Action**: Ensure all new unit and regression tests target `src/games/ludo/engine.ts` and `src/games/ludo/rules.ts`. Mark `src/utils/ludoEngine.ts` as legacy to avoid confusion.

---

## 6. Execution of the 10-Point Classic Ludo Verification Checklist
Run comprehensive automated tests and manual verification against all 10 core criteria:
1. **Dice 6 Base Exit**: Only rolling a 6 unlocks tokens from home base.
2. **Four Color Paths**: Blue, Red, Green, and Yellow complete their exact 52-cell track and 6-cell home runways.
3. **Safe Cells & Captures**: Stars prevent captures; standard landing captures enemy and returns them to base.
4. **Home Runway & Exact Finish**: Tokens enter the center triumph only on exact roll numbers without overshooting.
5. **Bonus Roll & 3 Consecutive Sixes**: Rolling a 6 grants a bonus roll; rolling 3 consecutive sixes forfeits the turn.
6. **Blockade & Pass Restriction**: Legitimate same-player blockades block enemy passage; multi-opponent safe cells do not block.
7. **Turn Timers & Auto-Pass**: Timer expiration and zero legal moves smoothly advance the turn.
8. **Victory & Match Reset**: 4 tokens home triggers victory fanfare and clean rematch state.
9. **Offline Bot AI**: Bots make strategic moves on their turns without interfering with human selections.
10. **Touch & Viewport Scaling**: 2D wooden board with 3D dice cube scales cleanly on mobile viewports.

---

## 7. Build & Compilation Verification
- Run `npm test` and `compile_applet` to verify 100% build pass with 0 errors.
