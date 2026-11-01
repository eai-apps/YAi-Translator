/**
 * Проверка интервалов (src/lib/srs.ts) маленьким скриптом node.
 * Запуск: node scripts/test-srs.mjs
 * esbuild уже есть в зависимостях vite — отдельная установка не нужна.
 */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outfile = path.join(root, 'node_modules', '.cache', 'srs-test.mjs');
mkdirSync(path.dirname(outfile), { recursive: true });

await build({
  entryPoints: [path.join(root, 'src', 'lib', 'srs.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile,
  logLevel: 'silent',
});

const srs = await import(`${pathToFileURL(outfile).href}?v=${Date.now()}`);

let failed = 0;
function check(name, condition, details = '') {
  if (condition) {
    console.log(`OK   ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${details ? ` — ${details}` : ''}`);
  }
}

const now = new Date(2026, 9, 31, 12, 0, 0).getTime();
const DAY = srs.DAY_MS;

// 1. Новая карточка: «Помню» — интервал 1 день, reps 1, introducedAt = сейчас.
const first = srs.nextProgress(null, 'de:haus', 'good', now);
check(
  '1. новая карточка + «Помню» → 1 день',
  first.interval === 1 && first.reps === 1 && first.introducedAt === now && first.due === now + DAY,
  JSON.stringify(first),
);

// 2. Три «Помню» подряд: 1 → 3 → 7 дней.
const second = srs.nextProgress(first, 'de:haus', 'good', now + DAY);
const third = srs.nextProgress(second, 'de:haus', 'good', now + 4 * DAY);
check(
  '2. лестница 1 → 3 → 7',
  first.interval === 1 && second.interval === 3 && third.interval === 7,
  `${first.interval}, ${second.interval}, ${third.interval}`,
);

// 3. «Не помню»: интервал 0, due = сейчас, lapses +1, ease −0,2.
const again = srs.nextProgress(third, 'de:haus', 'again', now + 11 * DAY);
check(
  '3. «Не помню» → снова сегодня',
  again.interval === 0 && again.due === now + 11 * DAY && again.lapses === 1 && again.ease === 2.3,
  JSON.stringify(again),
);

// 4. «Легко» с интервала 3 перепрыгивает ступень: 3 → 16, ease +0,15.
const easyBase = { ...first, interval: 3, ease: 2.5, due: now };
const easy = srs.nextProgress(easyBase, 'de:haus', 'easy', now);
check(
  '4. «Легко» 3 → 16 дней',
  easy.interval === 16 && easy.ease === 2.65,
  JSON.stringify(easy),
);

// 5. «Трудно» с интервала 7 откатывается на 3, ease −0,15.
const hardBase = { ...first, interval: 7, ease: 2.5, due: now };
const hard = srs.nextProgress(hardBase, 'de:haus', 'hard', now);
check(
  '5. «Трудно» 7 → 3 дня',
  hard.interval === 3 && hard.ease === 2.35 && hard.due === now + 3 * DAY,
  JSON.stringify(hard),
);

// 6. Сессия: сначала просроченные, новых не больше лимита (2).
const makeCard = (id) => ({
  id,
  lemma: id.slice(3),
  lang: 'de',
  article: 'das',
  plural: null,
  partOfSpeech: 'noun',
  translations: ['слово'],
  example: null,
  perfekt: null,
  addedAt: now,
  updatedAt: now,
});
const cards = ['de:eins', 'de:zwei', 'de:drei', 'de:vier', 'de:fuenf'].map(makeCard);
const progress = [
  { ...srs.emptyProgress('de:eins', now), due: now - 1000, interval: 3, reps: 2, introducedAt: now - 3 * DAY },
  { ...srs.emptyProgress('de:zwei', now), due: now - 5000, interval: 1, reps: 1, introducedAt: now - 2 * DAY },
];
const session = srs.pickSession(cards, progress, { now, newPerDay: 2, limit: 20 });
check(
  '6. сессия: 2 просроченные + 2 новые',
  session.length === 4 &&
    session[0].card.id === 'de:zwei' &&
    session[1].card.id === 'de:eins' &&
    session[2].isNew &&
    session[3].isNew,
  session.map((item) => item.card.id).join(', '),
);

// 7. Серия: сегодня + вчера = 2; пропуск вчера ломает серию.
const day = (offset) => {
  const date = new Date(now);
  date.setDate(date.getDate() - offset);
  return srs.localDayKey(date);
};
const days = [
  { day: day(0), reviews: 10, exercises: 0, updatedAt: now },
  { day: day(1), reviews: 0, exercises: 1, updatedAt: now },
  { day: day(3), reviews: 30, exercises: 0, updatedAt: now },
];
check('7. серия = 2 дня', srs.computeStreak(days, now) === 2, String(srs.computeStreak(days, now)));

// 7б. Серия с целью 5 карточек: день с 5 повторениями засчитывается.
const daysGoal5 = [
  { day: day(0), reviews: 5, exercises: 0, updatedAt: now },
  { day: day(1), reviews: 5, exercises: 0, updatedAt: now },
];
check('7б. серия с целью 5 = 2 дня', srs.computeStreak(daysGoal5, now, 5) === 2, String(srs.computeStreak(daysGoal5, now, 5)));

// 8. График за 7 дней: старые → новые, пропуски заполнены нулями.
const chart = srs.lastDays(days, 7, now);
check(
  '8. график 7 дней',
  chart.length === 7 && chart[6].reviews === 10 && chart[5].exercises === 1 && chart[0].reviews === 0,
  chart.map((item) => item.reviews).join(','),
);

console.log(failed === 0 ? '\nВсе проверки пройдены.' : `\nПровалено проверок: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
