import { calculateBoardDimensions } from '../src/utils/ludoEngine';

console.log('========================================');
console.log('RUNNING PHASE 6B RESPONSIVE SCALING TESTS');
console.log('========================================');

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

// Exactly the 10 viewports requested in Phase 6B objective with restored large board dimensions
const TARGET_VIEWPORTS = [
  { name: 'Small Phone 1', width: 320, height: 568, expectedPlinth: 304 },
  { name: 'Small Phone 2', width: 320, height: 640, expectedPlinth: 304 },
  { name: 'Normal Phone 1', width: 360, height: 640, expectedPlinth: 344 },
  { name: 'Normal Phone 2', width: 375, height: 667, expectedPlinth: 359 },
  { name: 'Normal Phone 3', width: 390, height: 844, expectedPlinth: 374 },
  { name: 'Normal Phone 4', width: 414, height: 896, expectedPlinth: 398 },
  { name: 'Tablet Portrait', width: 768, height: 1024, expectedPlinth: 540 },
  { name: 'Tablet Landscape', width: 1024, height: 768, expectedPlinth: 528 },
  { name: 'Desktop 720p Landscape', width: 1280, height: 720, expectedPlinth: 480 },
  { name: 'Desktop Standard', width: 1440, height: 900, expectedPlinth: 540 },
];

console.log('\nTest Suite 1: Height-Aware & Width-Aware Target Viewports');
TARGET_VIEWPORTS.forEach(({ name, width, height, expectedPlinth }) => {
  const dims = calculateBoardDimensions(width, height);

  assert(
    dims.plinthSize === expectedPlinth,
    `${name} (${width}x${height}) plinth size is ${expectedPlinth}px`,
    `Got ${dims.plinthSize}px, expected ${expectedPlinth}px`
  );

  assert(
    dims.totalStageWidth <= width,
    `${name} stage width (${dims.totalStageWidth}px) <= viewport width (${width}px)`,
    `Stage width ${dims.totalStageWidth}px exceeds viewport ${width}px`
  );

  assert(
    !dims.hasHorizontalOverflow,
    `${name} has no horizontal document overflow`
  );

  assert(
    !dims.hasVerticalOverflow,
    `${name} has no vertical document overflow (total + UI <= ${height}px)`
  );

  assert(
    dims.plinthSize > 0,
    `${name} has positive non-zero board dimensions`
  );
});

console.log('\nTest Suite 2: Boundary Safety and Non-Negative Constraints');
const boundaryWidths = [200, 240, 280, 500, 639, 640, 767, 1920, 2560];
boundaryWidths.forEach(w => {
  const dims = calculateBoardDimensions(w, 800);
  assert(dims.plinthSize > 0, `Width ${w}px produces positive plinth size (${dims.plinthSize}px)`);
  assert(dims.stagePadding >= 12, `Width ${w}px retains minimum stage padding (${dims.stagePadding}px)`);
  assert(!dims.hasHorizontalOverflow, `Width ${w}px has no horizontal overflow`);
});

console.log('\nTest Suite 3: Extreme Short Viewport Scaling');
const shortViewports = [
  { width: 800, height: 480 },
  { width: 1024, height: 600 },
  { width: 1366, height: 768 },
];
shortViewports.forEach(({ width, height }) => {
  const dims = calculateBoardDimensions(width, height);
  assert(
    !dims.hasVerticalOverflow,
    `Short viewport ${width}x${height} prevents vertical overflow`
  );
  assert(
    dims.plinthSize <= height - 216,
    `Plinth size (${dims.plinthSize}px) respects available height`
  );
});

console.log('========================================');
console.log(`PHASE 6B TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
