# Multi-Player Ludo Board Master Development & Design Plan (4P to 10P)
// Based on the supplied reference image (1792051840188.png)

## 1. Objective
Achieve 100% visual fidelity and mechanical perfection across all 6 board layouts (4-Player Square, 5-Player Pentagon, 6-Player Hexagon, 8-Player Octagon, 9-Player Enneagon, and 10-Player Decagon) matching the physical board design shown in the reference image.

---

## 2. Architectural Blueprint & File Mapping

### A. Geometry & Coordinate Models (`src/games/ludo/`)
- **4P Classic**: `board.ts` & `LudoBoard.tsx`
- **5P & 9P Polygonal**: `polygonalBoardGeometry.ts` & `PolygonalLudoBoard.tsx`
- **6P Hexagonal**: `hexagonalBoard.ts` & `HexagonalLudoBoard.tsx`
- **8P Octagonal**: `octagonalBoard.ts` & `OctagonalLudoBoard.tsx`
- **10P Decagonal**: `decagonalBoard.ts` & `DecagonalLudoBoard.tsx`

---

## 3. Step-by-Step Implementation & Styling Tasks

### Task 1: Board Frame & 3D Beveled Edge Styling
- Implement consistent dark outer framing with subtle 3D beveled borders for all polygonal SVGs.
- Ensure neutral silver-gray outer backdrops (`#B8C2CC` or `#0A0E17`) matching professional board aesthetics.

### Task 2: Sector Color Harmonization & Numbering
- Enforce exact sector color palettes (Blue, Cyan, Teal, Green, Lime, Yellow, Orange, Red, Magenta, Purple).
- Display crisp sector labels (`01`, `02`, ..., `10`) near each base yard.

### Task 3: Central Triumph Hub ("HOME" / "STOP")
- Render precise central polygonal home triumph zones with radiant gradients and bold "HOME" typography.
- Ensure safe apex stars (`★`) and runway arrow indicators are aligned radially.

### Task 4: Lobby & Match Setup Flow
- Update `LobbyScreen.tsx` to visually represent all board shapes with thumbnail indicators.
- Ensure smooth transition from lobby selection to `GameScreen.tsx` with correct `polyBoardType` and `teamMode`.

---

## 4. Verification & Testing Strategy
- Run automated regression tests in `tests/fullBoardRegression.test.ts`.
- Verify compile and type safety using `compile_applet` and `lint_applet`.
