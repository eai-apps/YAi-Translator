/**
 * Генератор PNG-иконок для PWA без сторонних библиотек.
 * Запуск: npm run icons
 * Рисует скруглённый квадрат с синим градиентом и белую букву Y (как в логотипе).
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/icons');

// Контур буквы Y в системе координат 48×48 (совпадает с SVG-логотипом).
const Y_POLYGON = [
  [13, 13],
  [18, 13],
  [24, 22],
  [30, 13],
  [35, 13],
  [26.5, 25.5],
  [26.5, 36],
  [21.5, 36],
  [21.5, 25.5],
];

const GRADIENT_FROM = [91, 140, 255];
const GRADIENT_TO = [47, 86, 216];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // бит на канал
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // фильтр None
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function insideRoundedRect(x, y, size, radius) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  const r = Math.min(radius, size / 2);
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function lerp(from, to, t) {
  return from.map((value, index) => Math.round(value + (to[index] - value) * t));
}

/** Рисует иконку: fullBleed — для maskable (фон без прозрачных краёв). */
function renderIcon(size, { fullBleed = false, logoScale = 0.72 } = {}) {
  const pixels = new Uint8Array(size * size * 4);
  const samples = 4;
  const radius = fullBleed ? 0 : size * 0.27;

  // Логотип масштабируем и центрируем.
  const scale = (size * logoScale) / 48;
  const offset = (size - 48 * scale) / 2;
  const polygon = Y_POLYGON.map(([x, y]) => [x * scale + offset, y * scale + offset]);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = px + (sx + 0.5) / samples;
          const y = py + (sy + 0.5) / samples;

          if (!insideRoundedRect(x, y, size, radius)) continue;

          let color;
          if (pointInPolygon(x, y, polygon)) {
            color = [255, 255, 255];
          } else {
            const t = Math.min(1, Math.max(0, (x + y) / (2 * size)));
            color = lerp(GRADIENT_FROM, GRADIENT_TO, t);
          }
          r += color[0];
          g += color[1];
          b += color[2];
          a += 255;
        }
      }

      const total = samples * samples;
      const index = (py * size + px) * 4;
      pixels[index] = a === 0 ? 0 : Math.round(r / (a / 255));
      pixels[index + 1] = a === 0 ? 0 : Math.round(g / (a / 255));
      pixels[index + 2] = a === 0 ? 0 : Math.round(b / (a / 255));
      pixels[index + 3] = Math.round(a / total);
    }
  }

  return encodePng(size, size, pixels);
}

mkdirSync(OUT_DIR, { recursive: true });
const icons = [
  ['icon-192.png', renderIcon(192)],
  ['icon-512.png', renderIcon(512)],
  ['icon-maskable-512.png', renderIcon(512, { fullBleed: true, logoScale: 0.58 })],
  ['apple-touch-icon.png', renderIcon(180, { fullBleed: true, logoScale: 0.66 })],
];

for (const [name, buffer] of icons) {
  writeFileSync(resolve(OUT_DIR, name), buffer);
  console.log(`public/icons/${name} — ${buffer.length} байт`);
}
