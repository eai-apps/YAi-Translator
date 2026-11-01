/** Снимки настоящего собранного приложения. API-ответы демонстрационные, личные данные не используются. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { build } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, process.env.AUDIT_SHOTS_DIR || 'store/screenshots');
mkdirSync(OUT, { recursive: true });
const compiled = await build({ stdin: { contents: `export { STUDY_DECKS, wordOfDay } from './shared/decks'; export { getEnglishTopicSummaries, getEnglishTopicBody } from './shared/grammarEnglish';`, resolveDir: ROOT }, bundle: true, write: false, platform: 'node', format: 'esm' });
const data = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const server = await preview({ root: ROOT, preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
let browser;
try { browser = await chromium.launch({ channel: 'msedge' }); }
catch { browser = await chromium.launch(); }
const errors = [], checks = [];
const auditDir = resolve(ROOT, 'node_modules/.cache/audit-shots');
mkdirSync(auditDir, { recursive: true });

async function makeContext(viewport, deviceScaleFactor = 1, theme = 'dark', language = 'ru') {
  const context = await browser.newContext({ viewport, deviceScaleFactor, colorScheme: theme, serviceWorkers: 'block' });
  await context.addInitScript(({ theme, language }) => {
    localStorage.setItem('yai.theme', JSON.stringify(theme));
    localStorage.setItem('yai.uiLanguage', JSON.stringify(language));
    localStorage.setItem('yai.seenVersion', '"1.0.0"');
    localStorage.setItem('yai.sourceLang', '"de"'); localStorage.setItem('yai.targetLang', '"ru"');
  }, { theme, language });
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url()), p = url.pathname;
    let result = {}, status = 200;
    if (p === '/api/auth/me') { status = 401; result = { error: { code: 'UNAUTHORIZED', message: 'Demo guest' } }; }
    else if (p === '/api/site-settings') result = { version: '1.0.0', dailyLimit: 5, wordCardAuto: false, whatsNew: null };
    else if (p === '/api/health') result = { ok: true, version: '1.0.0', providers: { deepl: true, dict: true }, limits: { maxTextLength: 5000, freeRequestsPerDay: 5 } };
    else if (p === '/api/grammar/topics') result = { items: data.getEnglishTopicSummaries(), langs: ['de', 'en'] };
    else if (p === '/api/grammar/topic') {
      const slug = url.searchParams.get('slug'), topic = data.getEnglishTopicSummaries().find(v => v.slug === slug);
      result = { ...topic, body: data.getEnglishTopicBody(slug, language), links: [], source: 'admin', offlineReason: null };
    }
    else if (p === '/api/word-of-day') result = data.wordOfDay(new Date().toISOString().slice(0, 10));
    else if (p === '/api/translate') {
      const body = route.request().postDataJSON();
      result = { translatedText: /haus|house/i.test(body.text) ? 'дом' : 'Добрый день! Я хотел бы записаться на приём.', alternatives: [], detectedLang: null, provider: 'deepl', cached: true };
    }
    else if (p === '/api/compare') result = { items: [] };
    else if (p === '/api/check') result = { isCorrect: true, correctedText: route.request().postDataJSON().text, corrections: [], encouragement: '', provider: 'languagetool', cached: true };
    else if (p === '/api/word') {
      const cards = JSON.parse(readFileSync(resolve(ROOT, 'public/cards/de-ru/ha.json'), 'utf8'));
      result = { card: cards.haus, provider: 'dict', cached: true };
    }
    else if (p === '/api/letter') result = { sender: 'Bürgeramt (Demo)', summary: 'Подтвердите запись на приём.', deadline: '15.11.2026', hasDeadline: true, urgency: 'normal', steps: ['Подтвердите удобное время.', 'Возьмите удостоверение личности.'], replyTemplate: 'Sehr geehrte Damen und Herren, ich bestätige den Termin. Mit freundlichen Grüßen [Name]', provider: 'gemini' };
    else if (p === '/api/dict') { status = 404; result = { error: { code: 'NOT_FOUND', message: 'Demo' } }; }
    else if (p === '/api/ai-models') result = { items: [] };
    else if (p === '/api/dict-sources') result = { items: [] };
    else if (p === '/api/buy-links') result = { items: [] };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(result) });
  });
  return context;
}

async function open(context, pathname, screenshot) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push({ pathname, message: error.message }));
  await page.goto(`http://127.0.0.1:4173${pathname}`);
  await page.locator('main').waitFor();
  await page.waitForTimeout(1400);
  const content = await page.locator('main').innerText();
  if (content.trim().length < 10) errors.push({ pathname, message: 'Empty main content' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
  checks.push({ pathname, viewport: page.viewportSize(), overflow, contentLength: content.length });
  if (overflow) errors.push({ pathname, message: 'Horizontal page overflow' });
  if (screenshot) await page.screenshot({ path: resolve(screenshot.startsWith('audit-') ? auditDir : OUT, screenshot) });
  return page;
}

try {
  const phone = await makeContext({ width: 360, height: 640 }, 3);
  const scenes = [
    ['/?q=Guten%20Tag!%20Ich%20m%C3%B6chte%20einen%20Termin%20vereinbaren.&from=de&to=ru', 'phone_01_translate.png'],
    ['/?q=Haus&from=de&to=ru', 'phone_02_card.png'],
    ['/learn/decks', 'phone_03_study.png'], ['/phrasebook', 'phone_04_phrasebook.png'],
    ['/letter', 'phone_05_letter.png'], ['/conversation', 'phone_06_dialog.png'],
    ['/grammar?lang=en', 'phone_07_grammar.png'], ['/learn/progress', 'phone_08_offline.png'],
  ];
  for (const [pathname, filename] of scenes) {
    const page = await open(phone, pathname, filename);
    if (filename === 'phone_02_card.png') {
      await page.locator('article').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(OUT, filename) });
    }
    if (filename === 'phone_05_letter.png') {
      await page.locator('textarea').fill('Sehr geehrte Frau Muster, bitte bestätigen Sie Ihren Termin beim Bürgeramt bis zum 15.11.2026. Mit freundlichen Grüßen Ihr Bürgeramt.');
      const labels = JSON.parse(readFileSync(resolve(ROOT, 'src/locales/ru.json'), 'utf8'));
      await page.getByRole('button', { name: labels.letter.analyzeBtn }).click();
      await page.getByText('15.11.2026', { exact: true }).waitFor();
      await page.getByText('15.11.2026', { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(OUT, filename) });
    }
    await page.close();
  }
  await phone.close();
  const tv = await makeContext({ width: 1920, height: 1080 });
  for (const [pathname, filename] of [['/?q=Haus&from=de&to=ru', 'tv_01_translate.png'], ['/dictionary', 'tv_02_dictionary.png']]) {
    const page = await open(tv, pathname, filename);
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowRight');
    checks.push({ pathname, focusTag: await page.evaluate(() => document.activeElement?.tagName) });
    await page.close();
  }
  await tv.close();
  for (const theme of ['light', 'dark']) {
    const context = await makeContext({ width: 390, height: 844 }, 1, theme);
    for (const pathname of ['/', '/dictionary', '/learn/decks', '/phrasebook', '/letter', '/grammar?lang=en', '/profile', '/privacy', '/terms']) {
      const page = await open(context, pathname, `audit-${theme}-${pathname.split('?')[0].replaceAll('/', '-') || 'home'}.png`);
      await page.close();
    }
    await context.close();
  }
  writeFileSync(resolve(OUT, 'verification.json'), JSON.stringify({ demoApi: true, checks, errors }, null, 2));
  if (errors.length) throw new Error(JSON.stringify(errors));
  console.log(`Verified ${checks.length} real UI views; screenshots saved to ${OUT}`);
} finally {
  await browser.close(); await new Promise(resolve => server.httpServer.close(resolve));
}
