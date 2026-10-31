/**
 * Проверка склонения прилагательных (src/lib/adjectiveForms.ts) скриптом node.
 * Запуск: node scripts/test-adjective-forms.mjs
 */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outfile = path.join(root, 'node_modules', '.cache', 'adjective-forms-test.mjs');
mkdirSync(path.dirname(outfile), { recursive: true });

await build({
  entryPoints: [path.join(root, 'src', 'lib', 'adjectiveForms.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  logLevel: 'silent',
});

const adjectives = await import(`${pathToFileURL(outfile).href}?v=${Date.now()}`);

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  if (actual === expected) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`✗ ${name}: получили ${JSON.stringify(actual)}, ждали ${JSON.stringify(expected)}`);
  }
}

/** Ячейка «падеж + род/число» из таблицы. */
function cell(rows, grammaticalCase, column) {
  return rows.find((row) => row.grammaticalCase === grammaticalCase)[column].text;
}

// Сильное склонение без артикля: окончания определённого артикля.
const strong = adjectives.buildDeclension('schön', 'strong');
check('strong Nom. м.', cell(strong, 'nominative', 'masculine'), 'schöner');
check('strong Nom. ср.', cell(strong, 'nominative', 'neuter'), 'schönes');
check('strong Nom. ж.', cell(strong, 'nominative', 'feminine'), 'schöne');
check('strong Nom. мн.', cell(strong, 'nominative', 'plural'), 'schöne');
check('strong Akk. м.', cell(strong, 'accusative', 'masculine'), 'schönen');
check('strong Dat. м.', cell(strong, 'dative', 'masculine'), 'schönem');
check('strong Dat. ж.', cell(strong, 'dative', 'feminine'), 'schöner');
check('strong Gen. мн.', cell(strong, 'genitive', 'plural'), 'schöner');

// Слабое склонение с der/die/das.
const weak = adjectives.buildDeclension('schön', 'weak');
check('weak Nom. м.', cell(weak, 'nominative', 'masculine'), 'der schöne');
check('weak Nom. ср.', cell(weak, 'nominative', 'neuter'), 'das schöne');
check('weak Akk. м.', cell(weak, 'accusative', 'masculine'), 'den schönen');
check('weak Akk. ж.', cell(weak, 'accusative', 'feminine'), 'die schöne');
check('weak Dat. мн.', cell(weak, 'dative', 'plural'), 'den schönen');
check('weak Gen. м.', cell(weak, 'genitive', 'masculine'), 'des schönen');

// Смешанное склонение с ein/eine/ein.
const mixed = adjectives.buildDeclension('schön', 'mixed');
check('mixed Nom. м.', cell(mixed, 'nominative', 'masculine'), 'ein schöner');
check('mixed Nom. ср.', cell(mixed, 'nominative', 'neuter'), 'ein schönes');
check('mixed Nom. ж.', cell(mixed, 'nominative', 'feminine'), 'eine schöne');
check('mixed Akk. м.', cell(mixed, 'accusative', 'masculine'), 'einen schönen');
check('mixed Dat. ж.', cell(mixed, 'dative', 'feminine'), 'einer schönen');
check('mixed Gen. ср.', cell(mixed, 'genitive', 'neuter'), 'eines schönen');
check('mixed Nom. мн. (без артикля)', cell(mixed, 'nominative', 'plural'), 'schönen');

// Основа из уже склонённой формы: «gerechte» → gerecht.
const gerechtRows = adjectives.buildDeclension('gerechte', 'strong');
check('основа из «gerechte»', cell(gerechtRows, 'nominative', 'masculine'), 'gerechter');

// Степени сравнения (правильное прилагательное строится кодом).
const comparison = adjectives.buildComparison('schön');
check('сравнительная', comparison.comparative, 'schöner');
check('превосходная', comparison.superlative, 'am schönsten');
// Умлаут (alt → älter) знает только словарь: готовые формы из карточки принимаются как есть.
const withForms = adjectives.buildComparison('alt', { comparative: 'älter', superlative: 'am ältesten' });
check('готовая сравнительная из карточки', withForms.comparative, 'älter');
check('готовая превосходная из карточки', withForms.superlative, 'am ältesten');

console.log(`\nСклонение прилагательных: ${passed} проверок пройдено, ${failed} не пройдено.`);
process.exit(failed === 0 ? 0 : 1);
