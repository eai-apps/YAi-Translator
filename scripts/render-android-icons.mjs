/**
 * Генерация иконок Android всех плотностей и баннера Android TV 320x180.
 * Использует Playwright (если доступен) либо System.Drawing на Windows.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = resolve(ROOT, 'public/logo.svg');
const resDir = resolve(ROOT, 'android/app/src/main/res');

async function renderWithPlaywright() {
  const { chromium } = await import('playwright');
  const svg = readFileSync(svgPath, 'utf8');
  const browser = await chromium.launch();

  // Баннер Android TV 320x180
  const bannerPage = await browser.newPage({ viewport: { width: 320, height: 180 } });
  const sizedLogo = svg.replace(/width="\d+" height="\d+"/, 'width="130" height="130"');
  await bannerPage.setContent(
    `<html><body style="margin:0;width:320px;height:180px;display:flex;align-items:center;justify-content:center;background:#151a23">${sizedLogo}</body></html>`,
  );
  await bannerPage.screenshot({ path: resolve(resDir, 'drawable/tv_banner.png') });
  await bannerPage.screenshot({ path: resolve(resDir, 'drawable-xhdpi/tv_banner.png') });
  await bannerPage.close();
  console.log('Created TV banner 320x180 with Playwright');

  const densities = [
    { name: 'mdpi', size: 48, fg: 108 },
    { name: 'hdpi', size: 72, fg: 162 },
    { name: 'xhdpi', size: 96, fg: 216 },
    { name: 'xxhdpi', size: 144, fg: 324 },
    { name: 'xxxhdpi', size: 192, fg: 432 },
  ];

  for (const d of densities) {
    const page = await browser.newPage({ viewport: { width: d.size, height: d.size } });
    const sLogo = svg.replace(/width="\d+" height="\d+"/, `width="${d.size}" height="${d.size}"`);
    await page.setContent(
      `<html><body style="margin:0;width:${d.size}px;height:${d.size}px;display:flex;align-items:center;justify-content:center;background:transparent">${sLogo}</body></html>`,
    );
    const folder = resolve(resDir, `mipmap-${d.name}`);
    await page.screenshot({ path: resolve(folder, 'ic_launcher.png'), omitBackground: true });
    await page.screenshot({ path: resolve(folder, 'ic_launcher_round.png'), omitBackground: true });
    await page.close();

    // Foreground для адаптивных иконок
    const fgPage = await browser.newPage({ viewport: { width: d.fg, height: d.fg } });
    const fgLogo = svg.replace(/width="\d+" height="\d+"/, `width="${d.fg}" height="${d.fg}"`).replace('rx="116"', 'rx="0"');
    await fgPage.setContent(
      `<html><body style="margin:0;width:${d.fg}px;height:${d.fg}px;display:flex;align-items:center;justify-content:center;background:transparent">${fgLogo}</body></html>`,
    );
    await fgPage.screenshot({ path: resolve(folder, 'ic_launcher_foreground.png'), omitBackground: true });
    await fgPage.close();
    console.log(`Generated Android mipmap-${d.name} (${d.size}px)`);
  }

  await browser.close();
}

async function main() {
  try {
    await renderWithPlaywright();
  } catch (_e) {
    console.log('Playwright not available, falling back to System.Drawing on Windows...');
    const psScript = resolve(ROOT, 'scripts/render-android-res.ps1');
    if (existsSync(psScript)) {
      const res = spawnSync('powershell', ['-ExecutionPolicy', 'Bypass', '-File', psScript], {
        stdio: 'inherit',
      });
      if (res.status !== 0) {
        throw new Error(`Failed to render icons via PowerShell: exit code ${res.status}`);
      }
    } else {
      throw new Error('No icon rendering engine available');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
