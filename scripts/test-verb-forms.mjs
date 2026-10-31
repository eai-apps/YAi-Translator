/**
 * Проверка форм глагола (src/lib/verbForms.ts) на 10 глаголах маленьким скриптом node.
 * Запуск: node scripts/test-verb-forms.mjs
 * esbuild уже есть в зависимостях vite — отдельная установка не нужна.
 */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outfile = path.join(root, 'node_modules', '.cache', 'verb-forms-test.mjs');
mkdirSync(path.dirname(outfile), { recursive: true });

await build({
  entryPoints: [path.join(root, 'src', 'lib', 'verbForms.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  logLevel: 'silent',
});

const forms = await import(`${pathToFileURL(outfile).href}?v=${Date.now()}`);

const subjects = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
const rows = (values) => values.map((form, index) => ({ pronoun: subjects[index], form }));

// Данные для проверки: так бы их прислал ИИ в карточке (Präsens, Präteritum, Konjunktiv II, Imperativ).
const CASES = [
  {
    infinitive: 'machen',
    input: {
      praesens: rows(['mache', 'machst', 'macht', 'machen', 'macht', 'machen']),
      praeteritum: rows(['machte', 'machtest', 'machte', 'machten', 'machtet', 'machten']),
      perfekt: 'hat gemacht',
      auxiliary: 'haben',
      partizip2: 'gemacht',
      konjunktiv2: rows(['würde machen', 'würdest machen', 'würde machen', 'würden machen', 'würdet machen', 'würden machen']),
      imperativ: { du: 'mach', ihr: 'macht', sie: 'machen Sie' },
    },
    expect: {
      praeteritum3: 'machte',
      perfekt1: 'habe gemacht',
      plusquamperfekt3: 'hatte gemacht',
      futur1: ['werde machen', 'wirst machen', 'wird machen', 'werden machen', 'werdet machen', 'werden machen'],
      futur2: 'wird gemacht haben',
      konjunktiv1: ['mache', 'machest', 'mache', 'machen', 'machet', 'machen'],
      konjunktiv2first: 'würde machen',
      imperativDu: 'mach',
      partizip1: 'machend',
    },
  },
  {
    infinitive: 'holen',
    input: {
      praesens: rows(['hole', 'holst', 'holt', 'holen', 'holt', 'holen']),
      praeteritum: rows(['holte', 'holtest', 'holte', 'holten', 'holtet', 'holten']),
      perfekt: 'hat geholt',
      auxiliary: 'haben',
      partizip2: 'geholt',
      konjunktiv2: rows(['würde holen', 'würdest holen', 'würde holen', 'würden holen', 'würdet holen', 'würden holen']),
      imperativ: null,
    },
    expect: { praeteritum3: 'holte', perfekt1: 'habe geholt', plusquamperfekt3: 'hatte geholt', imperativDu: 'hol', partizip1: 'holend' },
  },
  {
    infinitive: 'gehen',
    input: {
      praesens: rows(['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen']),
      praeteritum: rows(['ging', 'gingst', 'ging', 'gingen', 'gingt', 'gingen']),
      perfekt: 'ist gegangen',
      auxiliary: 'sein',
      partizip2: 'gegangen',
      konjunktiv2: rows(['ginge', 'gingest', 'ginge', 'gingen', 'ginget', 'gingen']),
      imperativ: { du: 'geh', ihr: 'geht', sie: 'gehen Sie' },
    },
    expect: {
      praeteritum3: 'ging',
      perfekt1: 'bin gegangen',
      plusquamperfekt3: 'war gegangen',
      futur2: 'wird gegangen sein',
      konjunktiv2first: 'ginge',
      imperativDu: 'geh',
      partizip1: 'gehend',
    },
  },
  {
    infinitive: 'sein',
    input: { praesens: rows(['bin', 'bist', 'ist', 'sind', 'seid', 'sind']), praeteritum: rows(['war', 'warst', 'war', 'waren', 'wart', 'waren']), perfekt: 'ist gewesen', auxiliary: 'sein', partizip2: null, konjunktiv2: [], imperativ: null },
    expect: { praeteritum3: 'war', perfekt1: 'bin gewesen', partizip1: 'seiend', konjunktiv1: ['sei', 'seist', 'sei', 'seien', 'seiet', 'seien'], konjunktiv2first: 'wäre', partizip2: 'gewesen' },
  },
  {
    infinitive: 'haben',
    input: { praesens: rows(['habe', 'hast', 'hat', 'haben', 'habt', 'haben']), praeteritum: rows(['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten']), perfekt: 'hat gehabt', auxiliary: 'haben', partizip2: null, konjunktiv2: [], imperativ: null },
    expect: { praeteritum3: 'hatte', perfekt1: 'habe gehabt', partizip1: 'habend', konjunktiv2first: 'hätte', partizip2: 'gehabt' },
  },
  {
    infinitive: 'werden',
    input: { praesens: rows(['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden']), praeteritum: rows(['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden']), perfekt: 'ist geworden', auxiliary: 'sein', partizip2: null, konjunktiv2: [], imperativ: null },
    expect: { praeteritum3: 'wurde', perfekt1: 'bin geworden', partizip1: 'werdend', konjunktiv2first: 'würde', futur1: ['werde werden', 'wirst werden', 'wird werden', 'werden werden', 'werdet werden', 'werden werden'] },
  },
  {
    infinitive: 'können',
    input: { praesens: rows(['kann', 'kannst', 'kann', 'können', 'könnt', 'können']), praeteritum: rows(['konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten']), perfekt: 'hat gekonnt', auxiliary: 'haben', partizip2: null, konjunktiv2: [], imperativ: null },
    expect: { praeteritum3: 'konnte', perfekt1: 'habe gekonnt', partizip1: 'könnend', konjunktiv2first: 'könnte', partizip2: 'gekonnt' },
  },
  {
    infinitive: 'aufstehen',
    input: {
      praesens: rows(['stehe auf', 'stehst auf', 'steht auf', 'stehen auf', 'steht auf', 'stehen auf']),
      praeteritum: rows(['stand auf', 'standst auf', 'stand auf', 'standen auf', 'standet auf', 'standen auf']),
      perfekt: 'ist aufgestanden',
      auxiliary: 'sein',
      partizip2: 'aufgestanden',
      konjunktiv2: rows(['stünde auf', 'stündest auf', 'stünde auf', 'stünden auf', 'stündet auf', 'stünden auf']),
      imperativ: { du: 'steh auf', ihr: 'steht auf', sie: 'stehen Sie auf' },
    },
    expect: { praeteritum3: 'stand auf', perfekt1: 'bin aufgestanden', futur1: ['werde aufstehen', 'wirst aufstehen', 'wird aufstehen', 'werden aufstehen', 'werdet aufstehen', 'werden aufstehen'], konjunktiv2first: 'stünde auf', imperativDu: 'steh auf', partizip1: 'aufstehend' },
  },
  {
    infinitive: 'sich freuen',
    input: {
      praesens: rows(['freue mich', 'freust dich', 'freut sich', 'freuen uns', 'freut euch', 'freuen sich']),
      praeteritum: rows(['freute mich', 'freutest dich', 'freute sich', 'freuten uns', 'freutet euch', 'freuten sich']),
      perfekt: 'hat sich gefreut',
      auxiliary: 'haben',
      partizip2: 'gefreut',
      konjunktiv2: rows(['würde mich freuen', 'würdest dich freuen', 'würde sich freuen', 'würden uns freuen', 'würdet euch freuen', 'würden sich freuen']),
      imperativ: { du: 'freu dich', ihr: 'freut euch', sie: 'freuen Sie sich' },
    },
    expect: {
      praeteritum3: 'freute sich',
      // Perfekt у возвратных глаголов: вспомогательный глагол + причастие + возвратное местоимение.
      perfekt1: 'habe mich gefreut',
      perfekt3: 'hat sich gefreut',
      futur1: ['werde mich freuen', 'wirst dich freuen', 'wird sich freuen', 'werden uns freuen', 'werdet euch freuen', 'werden sich freuen'],
      imperativDu: 'freu dich',
      partizip1: 'freuend',
    },
  },
  {
    infinitive: 'arbeiten',
    input: {
      praesens: rows(['arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten']),
      praeteritum: rows(['arbeitete', 'arbeitetest', 'arbeitete', 'arbeiteten', 'arbeitetet', 'arbeiteten']),
      perfekt: 'hat gearbeitet',
      auxiliary: 'haben',
      partizip2: 'gearbeitet',
      konjunktiv2: rows(['würde arbeiten', 'würdest arbeiten', 'würde arbeiten', 'würden arbeiten', 'würdet arbeiten', 'würden arbeiten']),
      imperativ: null,
    },
    expect: { praeteritum3: 'arbeitete', perfekt1: 'habe gearbeitet', plusquamperfekt3: 'hatte gearbeitet', imperativDu: 'arbeite', konjunktiv1: ['arbeite', 'arbeitest', 'arbeite', 'arbeiten', 'arbeitet', 'arbeiten'], partizip1: 'arbeitend' },
  },
];

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const okText = JSON.stringify(actual) === JSON.stringify(expected);
  const okIncludes = typeof expected === 'string' && typeof actual === 'string' && actual.includes(expected);
  if (okText || okIncludes) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`✗ ${name}: получили ${JSON.stringify(actual)}, ждали ${JSON.stringify(expected)}`);
  }
}

for (const item of CASES) {
  const tables = forms.buildVerbTables({ infinitive: item.infinitive, ...item.input });
  const flat = [...tables.present, ...tables.past, ...tables.future].flatMap((table) => table.forms.map((form) => form.form));
  const presentPraeteritum = tables.past.find((table) => table.title === 'word.form.praeteritum').forms[2].form;
  const perfekt = tables.past.find((table) => table.title === 'word.form.perfekt').forms;
  const plusquam = tables.past.find((table) => table.title === 'word.form.plusquamperfekt').forms;
  const futur1 = tables.future.find((table) => table.title === 'word.form.futur1').forms;
  const futur2 = tables.future.find((table) => table.title === 'word.form.futur2').forms;
  const konj1 = tables.present.find((table) => table.title === 'word.form.konjunktiv1').forms.map((form) => form.form);
  const konj2 = tables.past.find((table) => table.title === 'word.form.konjunktiv2').forms;
  const imperativ = tables.present.find((table) => table.title === 'word.form.imperativ').forms;
  const partizip1 = tables.present.find((table) => table.title === 'word.form.partizip1').forms[0].form;
  const partizip2 = tables.present.find((table) => table.title === 'word.form.partizip2').forms[0].form;
  const expect = item.expect;

  check(`${item.infinitive}: Präteritum er/sie/es`, presentPraeteritum, expect.praeteritum3);
  check(`${item.infinitive}: Perfekt ich`, perfekt[0].form, expect.perfekt1);
  if (expect.perfekt3) check(`${item.infinitive}: Perfekt er/sie/es`, perfekt[2].form, expect.perfekt3);
  if (expect.plusquamperfekt3) check(`${item.infinitive}: Plusquamperfekt er/sie/es`, plusquam[2].form, expect.plusquamperfekt3);
  if (expect.futur1) check(`${item.infinitive}: Futur I`, futur1.map((form) => form.form), expect.futur1);
  if (expect.futur2) check(`${item.infinitive}: Futur II`, futur2[2].form, expect.futur2);
  if (expect.konjunktiv1) check(`${item.infinitive}: Konjunktiv I`, konj1, expect.konjunktiv1);
  if (expect.konjunktiv2first) check(`${item.infinitive}: Konjunktiv II ich`, konj2[0].form, expect.konjunktiv2first);
  if (expect.imperativDu) check(`${item.infinitive}: Imperativ du`, imperativ[0].form, expect.imperativDu);
  if (expect.partizip1) check(`${item.infinitive}: Partizip I`, partizip1, expect.partizip1);
  if (expect.partizip2) check(`${item.infinitive}: Partizip II`, partizip2, expect.partizip2);
  // Гласные в формах построены кодом — значит, они не пустые (таблица показана целиком).
  check(`${item.infinitive}: все формы заполнены`, flat.every((form) => form.trim().length > 0), true);
}

console.log(`\nФормы глагола: ${passed} проверок пройдено, ${failed} не пройдено.`);
process.exit(failed === 0 ? 0 : 1);
