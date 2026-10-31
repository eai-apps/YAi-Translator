/**
 * Формы немецкого глагола для вкладки «Формы» (этап 8). Без React — проверяется node-скриптом
 * (scripts/test-verb-forms.mjs).
 *
 * Из карточки берутся: инфинитив, Präsens (6 форм), Präteritum (6 форм), Perfekt, Partizip II,
 * Konjunktiv II (6 форм) и Imperativ. Остальное строится здесь: Partizip I, Plusquamperfekt,
 * Futur I, Futur II, Konjunktiv I. Особые глаголы (sein, haben, werden, wissen, модальные) — таблицей.
 */

import { KONJUNKTIV1_SPECIAL, SPECIAL_VERBS } from './verbSpecial';

export interface VerbFormRow {
  pronoun: string;
  form: string;
}

export interface VerbFormsInput {
  /** Инфинитив: «machen», «sich freuen», «aufstehen». */
  infinitive: string;
  praesens: VerbFormRow[];
  praeteritum: VerbFormRow[];
  /** Полная форма Perfekt из карточки: «hat gemacht» / «ist gegangen». */
  perfekt: string;
  auxiliary: 'haben' | 'sein';
  partizip2: string | null;
  konjunktiv2: VerbFormRow[];
  imperativ: { du: string; ihr: string; sie: string } | null;
}

export type VerbTense = 'present' | 'past' | 'future';

/** Название таблицы: ключ перевода `word.form.*` или готовый текст (например, причастие). */
export interface VerbTable {
  title: string;
  titleText?: string;
  /** Ключ подсказки «когда используется» (`word.formHint.*`); пусто — подсказки нет. */
  hint: string;
  forms: VerbFormRow[];
}

/** Подлежащие карточки: ich, du, er/sie/es, wir, ihr, sie/Sie. */
const SUBJECTS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

/** Инфинитив без возвратной частицы, в нижнем регистре: «sich freuen» → «freuen». */
function plainInfinitive(infinitive: string): string {
  return infinitive.trim().toLowerCase().replace(/^sich\s+/, '');
}

/** Инфинитив для показа: «sich freuen» → «Sich freuen» → «Freuen». */
export function displayInfinitive(infinitive: string): string {
  const plain = plainInfinitive(infinitive);
  return plain ? plain.charAt(0).toUpperCase() + plain.slice(1) : plain;
}

/** Причастие настоящего времени: machen → machend, aufstehen → aufstehend. */
export function buildPartizip1(infinitive: string): string {
  const verb = plainInfinitive(infinitive);
  if (!verb) return '';
  if (verb.endsWith('eln') || verb.endsWith('ern')) return `${verb.slice(0, -1)}d`;
  // sein → seiend: основа «sei» уже оканчивается на гласную.
  if (verb === 'sein') return 'seiend';
  if (verb.endsWith('en')) return `${verb.slice(0, -2)}end`;
  return `${verb}nd`;
}

/** Konjunktiv I правильного глагола: machen → mache, machest, mache, machen, machet, machen. */
export function buildKonjunktiv1(infinitive: string): string[] {
  const verb = plainInfinitive(infinitive);
  const special = KONJUNKTIV1_SPECIAL[verb];
  if (special) return [...special];
  const stem = verb.endsWith('en') ? verb.slice(0, -2) : verb;
  return [`${stem}e`, `${stem}est`, `${stem}e`, `${stem}en`, `${stem}et`, `${stem}en`];
}

/** Возвратное местоимение: у «sich freuen» 3-е лицо мн. ч. — «sich», остальные — mich/dich/uns/euch. */
function reflexive(pronoun: string, reflexiveVerb: boolean): string {
  if (!reflexiveVerb) return '';
  const table: Record<string, string> = {
    ich: 'mich',
    du: 'dich',
    'er/sie/es': 'sich',
    wir: 'uns',
    ihr: 'euch',
    'sie/Sie': 'sich',
  };
  return ` ${table[pronoun] ?? 'sich'}`;
}

/** Все таблицы глагола, разложенные по трём временам. */
export function buildVerbTables(input: VerbFormsInput): Record<VerbTense, VerbTable[]> {
  const infinitive = input.infinitive.trim();
  const plain = plainInfinitive(infinitive);
  const reflexiveVerb = /^sich\s+/i.test(infinitive);
  const special = SPECIAL_VERBS[plain];
  const partizip2 = input.partizip2 || special?.partizip2 || '';
  const auxiliary = special?.auxiliary ?? input.auxiliary;

  const pick = (fromCard: VerbFormRow[], fromTable: string[] | undefined): string[] => {
    if (fromCard.length === 6) return fromCard.map((form) => form.form);
    return fromTable && fromTable.length === 6 ? fromTable : ['', '', '', '', '', ''];
  };
  const praesens = pick(input.praesens, special?.praesens);
  const praeteritum = pick(input.praeteritum, special?.praeteritum);
  const konjunktiv2 = pick(input.konjunktiv2, special?.konjunktiv2 ?? undefined);

  const rows = (forms: string[], suffix = ''): VerbFormRow[] =>
    forms.map((form, index) => ({ pronoun: SUBJECTS[index], form: `${form}${suffix}` }));

  /**
   * 6 строк составного времени. У возвратного глагола местоимение стоит между вспомогательным глаголом
   * и причастием/инфинитивом: «habe mich gefreut», «werde mich freuen».
   */
  const conjugated = (auxiliaries: string[], tail: string, tailToLower = false): VerbFormRow[] =>
    auxiliaries.map((form, index) => {
      const part = tail && tailToLower ? tail.charAt(0).toLowerCase() + tail.slice(1) : tail;
      return {
        pronoun: SUBJECTS[index],
        form: `${form}${reflexive(SUBJECTS[index], reflexiveVerb)}${part ? ` ${part}` : ''}`,
      };
    });

  const infinitiveText = displayInfinitive(infinitive);
  const habenPraesens = SPECIAL_VERBS.haben.praesens;
  const habenPraeteritum = SPECIAL_VERBS.haben.praeteritum;
  const seinPraesens = SPECIAL_VERBS.sein.praesens;
  const seinPraeteritum = SPECIAL_VERBS.sein.praeteritum;
  const auxPraesens = auxiliary === 'sein' ? seinPraesens : habenPraesens;
  const auxPraeteritum = auxiliary === 'sein' ? seinPraeteritum : habenPraeteritum;

  const present: VerbTable[] = [
    { title: 'word.form.infinitive', hint: '', forms: [{ pronoun: '', form: infinitiveText }] },
    { title: 'word.form.partizip1', hint: '', forms: [{ pronoun: '', form: buildPartizip1(infinitive) }] },
    { title: 'word.form.partizip2', hint: '', forms: [{ pronoun: '', form: partizip2 }] },
    { title: 'word.form.praesens', hint: 'word.formHint.praesens', forms: rows(praesens) },
    {
      title: 'word.form.konjunktiv1',
      hint: 'word.formHint.konjunktiv1',
      forms: buildKonjunktiv1(infinitive).map((form, index) => ({ pronoun: SUBJECTS[index], form })),
    },
    { title: 'word.form.imperativ', hint: 'word.formHint.imperativ', forms: buildImperative(input) },
  ];

  const past: VerbTable[] = [
    { title: 'word.form.praeteritum', hint: 'word.formHint.praeteritum', forms: rows(praeteritum) },
    { title: 'word.form.perfekt', hint: 'word.formHint.perfekt', forms: conjugated(auxPraesens, partizip2) },
    {
      title: 'word.form.plusquamperfekt',
      hint: 'word.formHint.plusquamperfekt',
      forms: conjugated(auxPraeteritum, partizip2),
    },
    { title: 'word.form.konjunktiv2', hint: 'word.formHint.konjunktiv2', forms: rows(konjunktiv2) },
  ];

  const future: VerbTable[] = [
    {
      title: 'word.form.futur1',
      hint: 'word.formHint.futur1',
      // Инфинитив после werden пишется со строчной буквы: «werde machen».
      forms: conjugated(SPECIAL_VERBS.werden.praesens, plain, true),
    },
    {
      title: 'word.form.futur2',
      hint: 'word.formHint.futur2',
      forms: conjugated(SPECIAL_VERBS.werden.praesens, `${partizip2} ${auxiliary}`),
    },
  ];

  return { present, past, future };
}

/** Imperativ: из карточки, иначе из Präsens (du: основа без -st, ihr: форма ihr, Sie: инфинитив + Sie). */
function buildImperative(input: VerbFormsInput): VerbFormRow[] {
  const verb = displayInfinitive(input.infinitive);
  if (input.imperativ) {
    return [
      { pronoun: 'du', form: input.imperativ.du },
      { pronoun: 'ihr', form: input.imperativ.ihr },
      { pronoun: 'Sie', form: input.imperativ.sie },
    ];
  }
  const plain = plainInfinitive(input.infinitive);
  const special = SPECIAL_VERBS[plain];
  const duForm = special ? special.praesens[1] : input.praesens[1]?.form ?? '';
  const ihrForm = special ? special.praesens[4] : input.praesens[4]?.form ?? '';
  const stem = duForm.replace(/st$/, '');
  // У глаголов на -eln/-ern и на согласную + m/n основа получает -e (arbeite!, atme!).
  const needsE = /(ln|rn|[^aeiouäöü][mn])$/.test(stem) || !stem;
  return [
    { pronoun: 'du', form: needsE ? `${stem}e` : stem },
    { pronoun: 'ihr', form: ihrForm },
    { pronoun: 'Sie', form: `${verb} Sie` },
  ];
}
