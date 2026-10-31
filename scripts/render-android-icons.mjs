/**
 * Иконки Android всех плотностей и баннер Android TV 320×180 из public/logo.svg.
 * Запуск: npm run icons:android (нужен Playwright: npx playwright install chromium).
 *
 * Адаптивная иконка (Android 8+) = фон (градиент логотипа) + передний план (только буквы).
 * Буквы уменьшены, чтобы поместиться в «безопасный круг» (66 из 108 dp) — иначе лаунчер их обрежет.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RES = resolve(ROOT, 'android/app/src/main/res');
const svg = readFileSync(resolve(ROOT, 'public/logo.svg'), 'utf8');

const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)[0];
// Всё, что после фона-прямоугольника, — буквы и искра.
const glyphs = svg.slice(svg.indexOf('/>', svg.indexOf('<rect')) + 2, svg.lastIndexOf('</svg>'));
// Центр букв в координатах логотипа 512×512.
const CX = 268;
const CY = 264;

const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">${defs}${body}</svg>`;
const centered = (scale) => `<g transform="translate(256 256) scale(${scale}) translate(${-CX} ${-CY})">${glyphs}</g>`;

const ART = {
  // Старые лаунчеры (до Android 8): скруглённый квадрат и круг.
  ic_launcher: wrap(`<rect width="512" height="512" rx="116" fill="url(#bg)"/>${centered(0.84)}`),
  ic_launcher_round: wrap(`<circle cx="256" cy="256" r="256" fill="url(#bg)"/>${centered(0.78)}`),
  // Адаптивная иконка: слои без скругления, система сама задаёт форму.
  ic_launcher_background: wrap('<rect width="512" height="512" fill="url(#bg)"/>'),
  ic_launcher_foreground: wrap(centered(0.58)),
};

// Плотность → размер обычной иконки (48 dp) и слоя адаптивной (108 dp).
const DENSITIES = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };

const browser = await chromium.launch();

async function shot(markup, width, height, path, background = 'transparent') {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(
    `<html><body style="margin:0;width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;background:${background}">${markup}</body></html>`,
  );
  await page.screenshot({ path, omitBackground: background === 'transparent' });
  await page.close();
}

for (const [density, [icon, layer]] of Object.entries(DENSITIES)) {
  const dir = resolve(RES, `mipmap-${density}`);
  for (const [name, markup] of Object.entries(ART)) {
    const size = name.includes('ground') ? layer : icon;
    await shot(`<div style="width:${size}px;height:${size}px">${markup}</div>`, size, size, resolve(dir, `${name}.png`));
  }
  console.log(`mipmap-${density}: ${icon}px / ${layer}px`);
}

// Баннер Android TV 320×180: логотип слева, название справа, фон — тёмный как у сплэша.
const banner = `<div style="display:flex;align-items:center;gap:16px;font-family:Inter,system-ui,sans-serif">
  <div style="width:112px;height:112px">${wrap(`<rect width="512" height="512" rx="116" fill="url(#bg)"/>${centered(0.84)}`)}</div>
  <div style="color:#fff;font-size:26px;font-weight:700;line-height:1.1">YAi<br><span style="color:#b9c6ff;font-weight:600">Translator</span></div>
</div>`;
for (const dir of ['drawable', 'drawable-xhdpi']) {
  await shot(banner, 320, 180, resolve(RES, dir, 'tv_banner.png'), '#0e1117');
}
console.log('tv_banner.png — 320×180');

// Заставка при запуске (вместо стандартной картинки Capacitor): логотип по центру на тёмном фоне.
const SPLASH = {
  drawable: [480, 320],
  'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
  'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
};
for (const [dir, [w, h]] of Object.entries(SPLASH)) {
  const size = Math.round(Math.min(w, h) * 0.32);
  const logo = wrap(`<rect width="512" height="512" rx="116" fill="url(#bg)"/>${centered(0.84)}`);
  await shot(`<div style="width:${size}px;height:${size}px">${logo}</div>`, w, h, resolve(RES, dir, 'splash.png'), '#0e1117');
}
console.log('splash.png — 11 размеров');

await browser.close();
