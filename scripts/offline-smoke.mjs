/** Проверка настоящего Service Worker: прогрев слова, отключение сети, перезагрузка и переходы. */
import { chromium } from 'playwright';
import { preview } from 'vite';
import { writeFileSync } from 'node:fs';

const server = await preview({ preview: { host: '127.0.0.1', port: 4174, strictPort: true } });
let browser;
try { browser = await chromium.launch({ channel: 'msedge' }); }
catch { browser = await chromium.launch(); }
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  await context.addInitScript(() => {
    localStorage.setItem('yai.seenVersion', '"1.0.0"');
    localStorage.setItem('yai.uiLanguage', '"ru"');
  });
  await context.route('**/api/**', async route => {
    const p = new URL(route.request().url()).pathname;
    let result = {}, status = 200;
    if (p === '/api/auth/me' || p === '/api/word-of-day' || p === '/api/dict') { status = 401; result = { error: { code: 'UNAUTHORIZED', message: 'Test guest' } }; }
    else if (p === '/api/site-settings') result = { version: '1.0.0', wordCardAuto: false };
    else if (p === '/api/grammar/topics') result = { items: [], langs: ['de', 'en'] };
    else if (p === '/api/health') result = { providers: { deepl: true }, limits: {} };
    else if (p === '/api/translate') result = { translatedText: 'дом', alternatives: [], detectedLang: null, provider: 'deepl', cached: true };
    else if (p === '/api/check') result = { correctedText: 'Haus', isCorrect: true, corrections: [], provider: 'languagetool' };
    else if (p === '/api/compare') result = { items: [] };
    else if (p === '/api/ai-models' || p === '/api/dict-sources') result = { items: [] };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(result) });
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174/?q=Haus&from=de&to=ru');
  await page.waitForFunction(() => document.querySelector('main')?.textContent?.includes('дом'));
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForTimeout(2000);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const card = await caches.match(new Request(location.origin + '/cards/de-ru/ha.json'));
    return { names, card: Boolean(card) };
  });
  if (!cached.card) throw new Error('Haus card was not cached by the Service Worker');
  await context.unrouteAll({ behavior: 'wait' });
  await context.setOffline(true);
  const checks = [];
  await page.reload();
  await page.waitForTimeout(1400);
  if (!(await page.locator('main').innerText()).includes('Haus')) throw new Error('Offline reload lost the card');
  checks.push('reload Haus card');
  for (const path of ['/dictionary', '/learn/cards', '/phrasebook']) {
    await page.goto('http://127.0.0.1:4174' + path);
    await page.waitForTimeout(1000);
    const text = await page.locator('main').innerText();
    if (text.trim().length < 10) throw new Error(`Empty offline page: ${path}`);
    checks.push(path);
  }
  if (errors.length) throw new Error(JSON.stringify(errors));
  writeFileSync('store/screenshots/offline-verification.json', JSON.stringify({ serviceWorker: true, networkDisabled: true, cached, checks, errors }, null, 2));
  console.log(`Offline verified: ${checks.join(', ')}`);
} finally {
  await browser.close(); await new Promise(resolve => server.httpServer.close(resolve));
}
