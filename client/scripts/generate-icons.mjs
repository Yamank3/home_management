// Draws the app icons (public/icons/*.png) without any image dependency.
// The geometry mirrors public/icons/icon-192.svg (a 192-unit house on an indigo
// tile). Run: npm run icons
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/icons');
const BG = [0x4f, 0x46, 0xe5];
const WHITE = [255, 255, 255];
const SS = 4; // supersamples per axis, for smooth edges

// Shapes in 192-unit space.
const inRoundRect = (x, y, r) =>
  x >= 0 && x <= 192 && y >= 0 && y <= 192 &&
  !(Math.hypot(Math.max(r - x, 0, x - (192 - r)), Math.max(r - y, 0, y - (192 - r))) > r);
const inTriangle = (x, y) => y >= 44 && y <= 96 && Math.abs(x - 96) <= ((y - 44) / 52) * 56;
const inBody = (x, y) => x >= 56 && x <= 136 && y >= 92 && y <= 144;
const inDoor = (x, y) => x >= 84 && x <= 108 && y >= 108 && y <= 144;
const inHouse = (x, y) => (inTriangle(x, y) || inBody(x, y)) && !inDoor(x, y);

// rounded: transparent corners (normal icons). !rounded: full-bleed square, which
// maskable and Apple icons need because the OS applies its own mask.
function render(size, rounded) {
  const raw = Buffer.alloc(size * (size * 4 + 1)); // each row: filter byte + RGBA
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let a = 0, r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = ((px + (sx + 0.5) / SS) / size) * 192;
          const y = ((py + (sy + 0.5) / SS) / size) * 192;
          if (rounded && !inRoundRect(x, y, 40)) continue;
          const c = inHouse(x, y) ? WHITE : BG;
          a++; r += c[0]; g += c[1]; b += c[2];
        }
      }
      const i = py * (size * 4 + 1) + 1 + px * 4;
      if (a) { raw[i] = r / a; raw[i + 1] = g / a; raw[i + 2] = b / a; }
      raw[i + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return raw;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, rounded) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(render(size, rounded), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size, rounded] of [
  ['icon-192.png', 192, true],
  ['icon-512.png', 512, true],
  ['icon-maskable-512.png', 512, false],
  ['apple-touch-icon.png', 180, false],
]) {
  writeFileSync(join(OUT, name), png(size, rounded));
  console.log('wrote', name);
}
