/**
 * Генерация статичных SEO-страниц для топ-слов немецкого и английского языков (/word/de/<lemma>, /word/en/<lemma>)
 * и генерация актуального sitemap.xml (Часть 19).
 * Ограничение: не более 6000 файлов (в пределах лимита Cloudflare Pages 20 000).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');
const TARGET_DIR = fs.existsSync(DIST_DIR) ? path.join(DIST_DIR, 'word') : path.join(PUBLIC_DIR, 'word');

const SITE_URL = 'https://yai-translator.pages.dev';

function isLexiconRef(entry) {
  return Boolean(entry && typeof entry === 'object' && 'lemma' in entry && entry.lemma && !entry.pos);
}

function getCefrBadge(rank) {
  if (!rank) return '~B1';
  if (rank <= 1000) return '~A1';
  if (rank <= 2000) return '~A2';
  if (rank <= 4000) return '~B1';
  if (rank <= 8000) return '~B2';
  return '~C1+';
}

function getGenderBadge(g) {
  if (!g) return '';
  if (g === 'der') return '<span class="gender der">der</span>';
  if (g === 'die') return '<span class="gender die">die</span>';
  if (g === 'das') return '<span class="gender das">das</span>';
  return `<span class="gender other">${g}</span>`;
}

function sanitizeFileName(str) {
  return str.replace(/[\\/:*?"<>|]/g, '_').replace(/\.+$/, '').trim();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function collectTopWords(lang, limit = 2000) {
  const dir = path.join(PUBLIC_DIR, 'lex', lang);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const words = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const chunk = JSON.parse(content);
      for (const [key, entry] of Object.entries(chunk)) {
        if (!isLexiconRef(entry)) {
          // Исключаем пустые или спец-ключи
          if (key.length >= 2 && /^[\p{L}\p{N}][\p{L}\p{N} '-]*$/u.test(key) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(key)) {
            const hasTr = entry.tr && (entry.tr.ru?.length || entry.tr.en?.length || entry.tr.de?.length);
            const rank = entry.fr || 999999;
            words.push({ lemma: key, entry, rank, hasTr: Boolean(hasTr) });
          }
        }
      }
    } catch {
      // Игнорируем битые чанки
    }
  }

  // Сортируем: сначала с переводом, затем по популярности (rank)
  words.sort((a, b) => {
    if (a.hasTr && !b.hasTr) return -1;
    if (!a.hasTr && b.hasTr) return 1;
    return a.rank - b.rank;
  });

  const seen = new Set();
  return words.filter(word => { const key = word.lemma.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, limit);
}

function renderWordHtml(word, lang) {
  const lemma = word.lemma;
  const entry = word.entry;
  const rank = entry.fr || 0;
  const level = getCefrBadge(rank);
  const ipa = entry.ipa || entry.ipaUk || entry.ipaUs || '';
  const gender = entry.g || '';
  const translationsRu = entry.tr?.ru || [];
  const translationsEn = entry.tr?.en || [];
  const transSummary = translationsRu.length > 0 ? translationsRu.slice(0, 3).join(', ') : lemma;

  const title = `${escapeHtml(lemma)} — перевод, транскрипция, примеры и формы | YAi Translator`;
  const desc = `Слово «${escapeHtml(lemma)}» (${lang}): перевод на русский: ${escapeHtml(transSummary)}. ${gender ? `Род: ${gender}. ` : ''}Уровень ${level}. Примеры предложений, транскрипция и карточка слова.`;

  const canonicalUrl = `${SITE_URL}/word/${lang}/${encodeURIComponent(lemma)}/`;
  const appTranslateUrl = `/?q=${encodeURIComponent(lemma)}&from=${lang}&to=${lang === 'de' ? 'ru' : 'ru'}`;

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image" content="${SITE_URL}/icons/icon-512.png" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>
    :root {
      --bg: #f6f7fb; --card: #ffffff; --ink: #141821; --muted: #667085;
      --accent: #3b6ef6; --accent-soft: #e8efff; --line: #e2e6f0;
      --der: #2f6fed; --die: #e0455f; --das: #1f9d63;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0e1117; --card: #151a23; --ink: #e8ecf5; --muted: #97a1b5;
        --accent: #6d92ff; --accent-soft: #1c2740; --line: #262e3d;
        --der: #6d92ff; --die: #ff7387; --das: #4fd196;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--ink); line-height: 1.5; padding: 1rem; }
    .container { max-width: 680px; margin: 2rem auto; }
    header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .logo { font-weight: 700; font-size: 1.25rem; color: var(--accent); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.04); margin-bottom: 1.5rem; }
    .word-header { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
    h1 { font-size: 2rem; font-weight: 700; }
    .ipa { color: var(--muted); font-family: monospace; font-size: 1rem; }
    .badge { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 6px; background: var(--accent-soft); color: var(--accent); }
    .gender { font-weight: 700; text-transform: lowercase; font-size: 1rem; margin-right: 0.25rem; }
    .gender.der { color: var(--der); }
    .gender.die { color: var(--die); }
    .gender.das { color: var(--das); }
    .gender.other { color: var(--muted); }
    .section-title { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.5rem; }
    .translations { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .translations li { background: var(--accent-soft); color: var(--ink); font-weight: 500; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.95rem; }
    .btn-action { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; background: var(--accent); color: #fff; font-weight: 600; font-size: 1rem; padding: 0.85rem; border-radius: 12px; text-decoration: none; transition: opacity 0.2s; }
    .btn-action:hover { opacity: 0.9; }
    .nav-links { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; font-size: 0.85rem; }
    .nav-links a { color: var(--muted); text-decoration: none; }
    .nav-links a:hover { color: var(--accent); }
    footer { text-align: center; font-size: 0.75rem; color: var(--muted); margin-top: 2rem; }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": "${escapeHtml(lemma)}",
    "description": "${escapeHtml(transSummary)}",
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "YAi Translator Dictionary"
    }
  }
  </script>
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 8 6 6M5 14l6-6M13 5h6M19 5v6M14 19l5-5"/></svg>
        YAi Translator
      </a>
      <a href="/dictionary" style="font-size: 0.85rem; color: var(--accent); text-decoration: none; font-weight: 500;">Словарь</a>
    </header>

    <article class="card">
      <div class="word-header">
        ${getGenderBadge(gender)}
        <h1>${escapeHtml(lemma)}</h1>
        ${ipa ? `<span class="ipa">[${escapeHtml(ipa)}]</span>` : ''}
        <span class="badge">${level}</span>
      </div>

      <div class="section-title">Перевод на русский</div>
      <ul class="translations">
        ${
          translationsRu.length > 0
            ? translationsRu.map((tr) => `<li>${escapeHtml(tr)}</li>`).join('')
            : `<li>${escapeHtml(transSummary)}</li>`
        }
      </ul>

      ${
        translationsEn.length > 0
          ? `
      <div class="section-title">English translation</div>
      <ul class="translations">
        ${translationsEn.map((tr) => `<li>${escapeHtml(tr)}</li>`).join('')}
      </ul>`
          : ''
      }

      <a href="${appTranslateUrl}" class="btn-action">
        Открыть в переводчике ➔
      </a>
    </article>

    <div class="nav-links">
      <a href="/">Переводчик</a> ·
      <a href="/dictionary">Словарь</a> ·
      <a href="/learn">Учёба</a> ·
      <a href="/grammar">Грамматика</a> ·
      <a href="/phrasebook">Разговорник</a>
    </div>

    <footer>
      Данные: Wiktextract / Kaikki.org (CC-BY-SA), Tatoeba (CC-BY).<br />
      © YAi Translator — бесплатный словарь и переводчик.
    </footer>
  </div>
</body>
</html>`;
}

function generateSitemap(wordsDe, wordsEn) {
  const mainUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/dictionary`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE_URL}/learn`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE_URL}/grammar`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE_URL}/phrasebook`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${SITE_URL}/letter`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${SITE_URL}/resources`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/apps`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/about`, priority: '0.6', changefreq: 'monthly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  for (const page of mainUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${page.loc}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="ru" href="${page.loc}" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="de" href="${page.loc}?lang=de" />\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${page.loc}?lang=en" />\n`;
    xml += `  </url>\n`;
  }

  for (const item of wordsDe) {
    const wordUrl = `${SITE_URL}/word/de/${encodeURIComponent(item.lemma)}/`;
    xml += `  <url>\n`;
    xml += `    <loc>${wordUrl}</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const item of wordsEn) {
    const wordUrl = `${SITE_URL}/word/en/${encodeURIComponent(item.lemma)}/`;
    xml += `  <url>\n`;
    xml += `    <loc>${wordUrl}</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

export function buildSeoPages() {
  console.log('\n> Building SEO Static Pages and Sitemap...');
  const startTime = Date.now();

  const wordsDe = collectTopWords('de', 2000);
  const wordsEn = collectTopWords('en', 2000);

  console.log(`  Found top words: ${wordsDe.length} DE, ${wordsEn.length} EN (total: ${wordsDe.length + wordsEn.length})`);

  let count = 0;

  // Генерируем страницы слов
  for (const item of wordsDe) {
    const safeName = sanitizeFileName(item.lemma);
    if (!safeName) continue;
    const wordDir = path.join(TARGET_DIR, 'de', safeName);
    fs.mkdirSync(wordDir, { recursive: true });
    const html = renderWordHtml(item, 'de');
    fs.writeFileSync(path.join(wordDir, 'index.html'), html, 'utf-8');
    count++;
  }

  for (const item of wordsEn) {
    const safeName = sanitizeFileName(item.lemma);
    if (!safeName) continue;
    const wordDir = path.join(TARGET_DIR, 'en', safeName);
    fs.mkdirSync(wordDir, { recursive: true });
    const html = renderWordHtml(item, 'en');
    fs.writeFileSync(path.join(wordDir, 'index.html'), html, 'utf-8');
    count++;
  }

  // Генерируем sitemap.xml в public/ и dist/
  const sitemapXml = generateSitemap(wordsDe, wordsEn);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[success] Generated ${count} SEO word pages and sitemap.xml in ${duration}s`);
}

// Прямой запуск
if (process.argv[1] && process.argv[1].endsWith('build-seo-pages.mjs')) {
  buildSeoPages();
}
