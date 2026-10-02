// Draws the app icons (public/icons/*.png and, once `cap add android` has run, the
// Android launcher icons and splash) without any image dependency.
// The geometry mirrors public/icons/icon-192.svg (a 192-unit house on an indigo
// tile). Run: npm run icons
import { deflateSync } from 'node:zlib';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/icons');
const BG = [0x4f, 0x46, 0xe5];
const WHITE = [255, 255, 255];
const SS = 4; // supersamples per axis, for smooth edges

// The house, in a 192-unit box (see icon-192.svg).
const inTriangle = (x, y) => y >= 44 && y <= 96 && Math.abs(x - 96) <= ((y - 44) / 52) * 56;
const inBody = (x, y) => x >= 56 && x <= 136 && y >= 92 && y <= 144;
const inDoor = (x, y) => x >= 84 && x <= 108 && y >= 108 && y <= 144;
const inHouse = (x, y) => (inTriangle(x, y) || inBody(x, y)) && !inDoor(x, y);

// Background tile: 'rounded' (transparent corners, normal icons), 'circle'
// (legacy round launcher), 'full' (full-bleed square: maskable/Apple/splash, where
// the OS applies its own mask) or 'none' (transparent, for adaptive foregrounds).
function inTile(tile, x, y, w, h) {
  if (tile === 'full') return true;
  if (tile === 'circle') return Math.hypot(x - w / 2, y - h / 2) <= Math.min(w, h) / 2;
  const m = Math.min(w, h), r = (40 / 192) * m;
  return !(x < 0 || y < 0 || x > w || y > h ||
    Math.hypot(Math.max(r - x, 0, x - (w - r)), Math.max(r - y, 0, y - (h - r))) > r);
}

// `glyph` is the house box as a fraction of the shorter side.
function render(w, h, { tile, glyph = 1 }) {
  const scale = (glyph * Math.min(w, h)) / 192; // pixels per house unit
  const raw = Buffer.alloc(h * (w * 4 + 1)); // each row: filter byte + RGBA
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let a = 0, r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;
          const house = inHouse((x - w / 2) / scale + 96, (y - h / 2) / scale + 96);
          if (!house && !(tile !== 'none' && inTile(tile, x, y, w, h))) continue;
          const c = house ? WHITE : BG;
          a++; r += c[0]; g += c[1]; b += c[2];
        }
      }
      const i = py * (w * 4 + 1) + 1 + px * 4;
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
function png(w, h, opts) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(render(w, h, opts), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const write = (path, w, h, opts) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, png(w, h, opts)); console.log('wrote', path.replace(OUT + '/', '')); };

for (const [name, size, tile] of [
  ['icon-192.png', 192, 'rounded'],
  ['icon-512.png', 512, 'rounded'],
  ['icon-maskable-512.png', 512, 'full'],
  ['apple-touch-icon.png', 180, 'full'],
]) write(join(OUT, name), size, size, { tile });

// Android launcher icons and splash, if the native project has been added.
const RES = join(dirname(fileURLToPath(import.meta.url)), '../android/app/src/main/res');
if (existsSync(RES)) {
  const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(DENSITY)) {
    const dir = join(RES, `mipmap-${d}`);
    write(join(dir, 'ic_launcher.png'), 48 * k, 48 * k, { tile: 'rounded' });
    write(join(dir, 'ic_launcher_round.png'), 48 * k, 48 * k, { tile: 'circle' });
    // Adaptive foreground: 108dp canvas, only the inner ~61% circle is always visible.
    write(join(dir, 'ic_launcher_foreground.png'), 108 * k, 108 * k, { tile: 'none', glyph: 0.95 });
    // Notification (status bar) icon: Android tints it, so only the white shape matters.
    write(join(RES, `drawable-${d}`, 'ic_stat_home.png'), 24 * k, 24 * k, { tile: 'none', glyph: 1.4 });
    write(join(RES, `drawable-port-${d}`, 'splash.png'), 320 * k, 480 * k, { tile: 'full', glyph: 0.35 });
    write(join(RES, `drawable-land-${d}`, 'splash.png'), 480 * k, 320 * k, { tile: 'full', glyph: 0.35 });
  }
  write(join(RES, 'drawable', 'splash.png'), 480, 320, { tile: 'full', glyph: 0.35 });
  writeFileSync(join(RES, 'values', 'ic_launcher_background.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#4F46E5</color>\n</resources>\n');
}
