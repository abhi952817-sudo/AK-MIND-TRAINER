# Implementation Plan: Full Board Parity, Ergonomics & Multi-Player Refinement (4P to 10P)

This plan outlines the next phase of development for the **AK MIND TRAINER — Ludoverse** engine, ensuring seamless gameplay, visual parity across all player counts (4P Square, 5P Pentagon, 6P Hexagon, 8P Octagon, 9P Enneagon, 10P Decagon), and mobile touch ergonomics.

---

## 1. Universal Player HUD & Token Progress Parity
- **Consistent Player Status Bars**: Extend the player HUD status bar currently on 5P to all boards (4P, 6P, 8P, 9P, 10P), showing:
  - Player avatar/initials with assigned hex color & engraved symbol.
  - Active turn indicator with smooth pulse animation.
  - Live token home completion counter (e.g., `(2/4)`).
  - Bot badge vs. human player badge.

---

## 2. Dynamic Viewport Scaling & Auto-Zoom for High-Density Boards (8P, 9P, 10P)
- **Viewport Ergonomics**: On mobile screens, 8P, 9P, and 10P boards have many track cells and tokens in close proximity.
  - Add smooth touch zoom/pan toggle (`1x` / `1.5x` / `2x`) for dense boards.
  - Add active sector auto-focus so the viewport subtly shifts attention toward the player currently rolling or moving.

---

## 3. Visual & Audio Polish
- **Path Highlighting**: When hovering or tapping an eligible token, display the exact forward path tiles illuminated in the player's primary color with step numbers.
- **Sound & Haptics Sync**: Ensure all 23 classic audio events (dice roll, bonus six, safe star entry, capture, victory fanfare) trigger reliably across all polygonal game variants.

---

## 4. Multi-Player Lobby & Setup Path Finalization
- Enable quick-switching and custom seat configuration directly from the match setup modal for all 6 board geometries.
- Preserve AI bot difficulty settings ('easy', 'normal', 'hard') into polygonal state loops.

---

## 5. Verification & Testing
- Validate all board layouts in responsive mobile and desktop viewports.
- Run `compile_applet` and test suite to ensure 0 TypeScript or runtime regressions.
