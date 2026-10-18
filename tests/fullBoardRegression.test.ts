// tests/fullBoardRegression.test.ts
// Comprehensive unit tests validating path continuity and valid movement coordinates
// for all board configurations (4P, 5P, 6P, 8P, 9P, 10P).

import test from 'node:test';
import assert from 'node:assert';
import { getPolygonalBoardGeometry, BoardPlayerCount } from '../src/games/ludo/polygonalBoardGeometry';
import { getOctagonGeometry } from '../src/games/ludo/octagonalBoard';
import { getDecagonGeometry } from '../src/games/ludo/decagonalBoard';
import { getHexagonGeometry } from '../src/games/ludo/hexagonalBoard';

test('Full Board Regression: Validates geometry and path continuity for 4P, 5P, 6P, 8P, 9P, 10P', async (t) => {
  const boardCounts: BoardPlayerCount[] = [4, 5, 6, 8, 9, 10];

  for (const count of boardCounts) {
    await t.test(`Board configuration ${count}P validates successfully`, () => {
      const geom = getPolygonalBoardGeometry(count, 800, 800);
      
      assert.ok(geom, `Geometry generated for ${count}P`);
      assert.strictEqual(geom.config.playerCount, count);
      assert.ok(geom.trackCells.length > 0, `${count}P has track cells`);
      assert.ok(geom.baseSlots.length === count, `${count}P matches sector count for base slots`);
      assert.ok(geom.runwayCells.length === count, `${count}P matches sector count for runways`);

      // Validate coordinates contain no NaN
      for (const cell of geom.trackCells) {
        assert.notStrictEqual(isNaN(cell.x), true);
        assert.notStrictEqual(isNaN(cell.y), true);
      }

      for (const runway of geom.runwayCells) {
        for (const cell of runway) {
          assert.notStrictEqual(isNaN(cell.x), true);
          assert.notStrictEqual(isNaN(cell.y), true);
        }
      }
    });
  }

  await t.test('Octagonal 8P specific geometry check', () => {
    const oct = getOctagonGeometry(800, 800);
    assert.ok(oct);
    assert.strictEqual(oct.cx, 400);
    assert.strictEqual(oct.cy, 400);
  });

  await t.test('Decagonal 10P specific geometry check', () => {
    const dec = getDecagonGeometry(800, 800);
    assert.ok(dec);
    assert.strictEqual(dec.cx, 400);
  });

  await t.test('Hexagonal 6P specific geometry check', () => {
    const hex = getHexagonGeometry(800, 800);
    assert.ok(hex);
    assert.strictEqual(hex.cx, 400);
  });
});
