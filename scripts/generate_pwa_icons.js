import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate an uncompressed or zlib compressed valid RGBA PNG
function createPng(width, height, drawFn) {
  // 8-byte PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) per row
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(rowStride * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Deflate IDAT
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Ludo Logo drawing function
function drawLudoIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: Dark space purple/navy (#0F111A to #1E2337)
  const bgR = Math.floor(15 + (y / h) * 15);
  const bgG = Math.floor(17 + (y / h) * 18);
  const bgB = Math.floor(26 + (y / h) * 35);

  const radius = isMaskable ? w * 0.48 : w * 0.45;
  if (!isMaskable && dist > radius) {
    return [0, 0, 0, 0]; // Rounded outer border
  }

  // Golden circular rim
  if (dist > radius - w * 0.03 && dist <= radius) {
    return [245, 158, 11, 255]; // Amber gold rim
  }

  // 4 Quadrants of Ludo (Red, Green, Yellow, Blue)
  const pad = w * 0.08;
  const innerSize = (w - pad * 2) / 2;
  const relX = x - pad;
  const relY = y - pad;

  if (relX >= 0 && relX < innerSize * 2 && relY >= 0 && relY < innerSize * 2) {
    const isTop = relY < innerSize;
    const isLeft = relX < innerSize;
    const gap = w * 0.02;

    const inGap = (Math.abs(relX - innerSize) < gap) || (Math.abs(relY - innerSize) < gap);
    if (!inGap) {
      if (isTop && isLeft) return [239, 68, 68, 255]; // Red
      if (isTop && !isLeft) return [34, 197, 94, 255]; // Green
      if (!isTop && isLeft) return [234, 179, 8, 255]; // Yellow
      if (!isTop && !isLeft) return [59, 130, 246, 255]; // Blue
    }
  }

  // Center white star / dice pip
  if (dist < w * 0.08) {
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawLudoIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawLudoIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawLudoIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawLudoIcon(x, y, w, h, false)));
// Also make standard icon-192 and icon-512
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, (x, y, w, h) => drawLudoIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, (x, y, w, h) => drawLudoIcon(x, y, w, h, false)));

// Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1E2337"/>
      <stop offset="100%" stop-color="#0F111A"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="215" fill="none" stroke="#F59E0B" stroke-width="12"/>
  <!-- 4 Colored Quadrants -->
  <rect x="75" y="75" width="160" height="160" rx="24" fill="#EF4444"/>
  <rect x="277" y="75" width="160" height="160" rx="24" fill="#22C55E"/>
  <rect x="75" y="277" width="160" height="160" rx="24" fill="#EAB308"/>
  <rect x="277" y="277" width="160" height="160" rx="24" fill="#3B82F6"/>
  <!-- Central Emblem -->
  <circle cx="256" cy="256" r="44" fill="#FFFFFF" stroke="#0F111A" stroke-width="8"/>
  <polygon points="256,224 266,248 292,250 272,267 278,292 256,278 234,292 240,267 220,250 246,248" fill="#F59E0B"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
console.log('Successfully generated all PWA icons & SVGs in public/');
