import fs from 'fs';

const ru = JSON.parse(fs.readFileSync('src/locales/ru.json', 'utf8'));
const de = JSON.parse(fs.readFileSync('src/locales/de.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

function getFlatKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const next = prefix ? prefix + '.' + k : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getFlatKeys(obj[k], next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

const ruK = new Set(getFlatKeys(ru));
const deK = new Set(getFlatKeys(de));
const enK = new Set(getFlatKeys(en));

console.log(`Total keys: RU = ${ruK.size}, DE = ${deK.size}, EN = ${enK.size}`);

const diffDeRu = [...ruK].filter(k => !deK.has(k));
const diffRuDe = [...deK].filter(k => !ruK.has(k));
const diffEnRu = [...ruK].filter(k => !enK.has(k));
const diffRuEn = [...enK].filter(k => !ruK.has(k));

let ok = true;
if (diffDeRu.length > 0) { console.error('RU not in DE:', diffDeRu); ok = false; }
if (diffRuDe.length > 0) { console.error('DE not in RU:', diffRuDe); ok = false; }
if (diffEnRu.length > 0) { console.error('RU not in EN:', diffEnRu); ok = false; }
if (diffRuEn.length > 0) { console.error('EN not in RU:', diffRuEn); ok = false; }

if (ok) {
  console.log('100% Locale Parity Achieved! All 3 locale files match identically in key structure.');
} else {
  process.exit(1);
}
