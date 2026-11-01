/**
 * Генерация экранов запуска iOS PWA (apple-touch-startup-image) для популярных размеров iPhone и iPad.
 * Сохраняет PNG в public/splash/.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/splash');
mkdirSync(OUT_DIR, { recursive: true });

const svg = readFileSync(resolve(ROOT, 'public/logo.svg'), 'utf8');
const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)[0];
const glyphs = svg.slice(svg.indexOf('/>', svg.indexOf('<rect')) + 2, svg.lastIndexOf('</svg>'));
const CX = 268;
const CY = 264;

const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">${defs}${body}</svg>`;
const centered = (scale) => `<g transform="translate(256 256) scale(${scale}) translate(${-CX} ${-CY})">${glyphs}</g>`;
const logoSvg = wrap(`<rect width="512" height="512" rx="116" fill="url(#bg)"/>${centered(0.84)}`);

/** Популярные устройства iOS: имя, ширина, высота */
export const IOS_SPLASH_SIZES = [
  { name: 'apple-splash-1290-2796.png', w: 1290, h: 2796, label: 'iPhone 16/15/14 Pro Max' },
  { name: 'apple-splash-1179-2556.png', w: 1179, h: 2556, label: 'iPhone 16/15 Pro, 15, 14 Pro' },
  { name: 'apple-splash-1284-2778.png', w: 1284, h: 2778, label: 'iPhone 14 Plus, 13/12 Pro Max' },
  { name: 'apple-splash-1170-2532.png', w: 1170, h: 2532, label: 'iPhone 14, 13, 13 Pro, 12' },
  { name: 'apple-splash-1242-2688.png', w: 1242, h: 2688, label: 'iPhone 11 Pro Max, XS Max' },
  { name: 'apple-splash-828-1792.png', w: 828, h: 1792, label: 'iPhone 11, XR' },
  { name: 'apple-splash-750-1334.png', w: 750, h: 1334, label: 'iPhone SE 2/3, iPhone 8' },
  { name: 'apple-splash-2048-2732.png', w: 2048, h: 2732, label: 'iPad Pro 12.9"' },
  { name: 'apple-splash-1668-2388.png', w: 1668, h: 2388, label: 'iPad Pro 11"' },
];

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'msedge' });
  } catch {
    return await chromium.launch();
  }
}

async function renderSplash() {
  console.log('Генерация iOS PWA экранов запуска (apple-touch-startup-image)...');
  const browser = await launchBrowser();

  for (const { name, w, h, label } of IOS_SPLASH_SIZES) {
    const iconSize = Math.round(Math.min(w, h) * 0.28);
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: ${w}px;
            height: ${h}px;
            background: #0e1117;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #ffffff;
            overflow: hidden;
          }
          .logo-box {
            width: ${iconSize}px;
            height: ${iconSize}px;
            filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.45));
          }
          .title {
            margin-top: ${Math.round(iconSize * 0.16)}px;
            font-size: ${Math.round(iconSize * 0.24)}px;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          .tagline {
            margin-top: ${Math.round(iconSize * 0.06)}px;
            font-size: ${Math.round(iconSize * 0.12)}px;
            color: #97a1b5;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="logo-box">${logoSvg}</div>
        <div class="title">YAi Translator</div>
        <div class="tagline">Переводчик · Словарь · Учёба</div>
      </body>
    </html>`;

    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html);
    const outPath = resolve(OUT_DIR, name);
    await page.screenshot({ path: outPath, type: 'png' });
    await page.close();
    console.log(`[OK] ${name} (${w}×${h}) — ${label}`);
  }

  await browser.close();
  console.log('Все заставки iOS успешно сгенерированы в public/splash/!\n');
}

renderSplash().catch((err) => {
  console.error('Ошибка генерации заставок iOS:', err);
  process.exit(1);
});
