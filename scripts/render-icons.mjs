/**
 * Иконки PWA и приложений из public/logo.svg.
 * Запуск: npm run icons (нужен Playwright: npx playwright install chromium).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(ROOT, 'public/logo.svg'), 'utf8');

// name, размер, отступ (буквы и так помещаются в безопасный круг maskable-иконки), фон
const ICONS = [
  ['icon-192.png', 192, 0, 'transparent'],
  ['icon-512.png', 512, 0, 'transparent'],
  ['icon-maskable-512.png', 512, 0, '#5a5cfb'],
  ['apple-touch-icon.png', 180, 0, '#5a5cfb'],
];

const browser = await chromium.launch();
for (const [name, size, pad, bg] of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - pad * 2));
  const sized = svg.replace(/width="\d+" height="\d+"/, `width="${inner}" height="${inner}"`);
  // Для maskable и Apple убираем скругление: система скругляет иконку сама.
  const content = name.includes('maskable') || name.startsWith('apple') ? sized.replace('rx="116"', 'rx="0"') : sized;
  await page.setContent(
    `<html><body style="margin:0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${bg}">${content}</body></html>`,
  );
  await page.screenshot({ path: resolve(ROOT, 'public/icons', name), omitBackground: bg === 'transparent' });
  await page.close();
  console.log(`public/icons/${name} — ${size}px`);
}
await browser.close();
