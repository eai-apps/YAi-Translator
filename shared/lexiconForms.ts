/**
 * Универсальное построение форм слов (склонение, спряжение, степени сравнения)
 * без обращения к ИИ (этап 15Б, версия 0.17.5).
 * Доступно для фронтенда (src/) и сервера (functions/).
 */
import type { Conjugation, DeclensionRow, Imperative } from './typeWord';
import type { LexiconAdjEntry, LexiconNounEntry, LexiconVerbEntry } from './lexicon';

const PRONOUNS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'] as const;

export interface SpecialVerbData {
  praesens: string[];
  praeteritum: string[];
  konjunktiv2: string[] | null;
  partizip2: string;
  auxiliary: 'haben' | 'sein';
  imperativ?: Imperative;
}

export const SPECIAL_VERBS: Record<string, SpecialVerbData> = {
  sein: {
    praesens: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
    praeteritum: ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
    konjunktiv2: ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären'],
    partizip2: 'gewesen',
    auxiliary: 'sein',
    imperativ: { du: 'sei!', ihr: 'seid!', sie: 'seien Sie!' },
  },
  haben: {
    praesens: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
    praeteritum: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
    konjunktiv2: ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten'],
    partizip2: 'gehabt',
    auxiliary: 'haben',
    imperativ: { du: 'hab(e)!', ihr: 'habt!', sie: 'haben Sie!' },
  },
  werden: {
    praesens: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
    praeteritum: ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden'],
    konjunktiv2: ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'],
    partizip2: 'geworden',
    auxiliary: 'sein',
    imperativ: { du: 'werde!', ihr: 'werdet!', sie: 'werden Sie!' },
  },
  wissen: {
    praesens: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
    praeteritum: ['wusste', 'wusstest', 'wusste', 'wussten', 'wusstet', 'wussten'],
    konjunktiv2: ['wüsste', 'wüsstest', 'wüsste', 'wüssten', 'wüsstet', 'wüssten'],
    partizip2: 'gewusst',
    auxiliary: 'haben',
    imperativ: { du: 'wisse!', ihr: 'wisst!', sie: 'wissen Sie!' },
  },
  können: {
    praesens: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'],
    praeteritum: ['konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten'],
    konjunktiv2: ['könnte', 'könntest', 'könnte', 'könnten', 'könntet', 'könnten'],
    partizip2: 'gekonnt',
    auxiliary: 'haben',
  },
  müssen: {
    praesens: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'],
    praeteritum: ['musste', 'musstest', 'musste', 'mussten', 'musstet', 'mussten'],
    konjunktiv2: ['müsste', 'müsstest', 'müsste', 'müssten', 'müsstet', 'müssten'],
    partizip2: 'gemusst',
    auxiliary: 'haben',
  },
  dürfen: {
    praesens: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'],
    praeteritum: ['durfte', 'durftest', 'durfte', 'durften', 'durftet', 'durften'],
    konjunktiv2: ['dürfte', 'dürftest', 'dürfte', 'dürften', 'dürftet', 'dürften'],
    partizip2: 'gedurft',
    auxiliary: 'haben',
  },
  sollen: {
    praesens: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'],
    praeteritum: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
    konjunktiv2: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
    partizip2: 'gesollt',
    auxiliary: 'haben',
  },
  wollen: {
    praesens: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'],
    praeteritum: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
    konjunktiv2: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
    partizip2: 'gewollt',
    auxiliary: 'haben',
  },
  mögen: {
    praesens: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'],
    praeteritum: ['mochte', 'mochtest', 'mochte', 'mochten', 'mochtet', 'mochten'],
    konjunktiv2: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten'],
    partizip2: 'gemocht',
    auxiliary: 'haben',
  },
  gehen: {
    praesens: ['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen'],
    praeteritum: ['ging', 'gingst', 'ging', 'gingen', 'gingt', 'gingen'],
    konjunktiv2: ['ginge', 'gingest', 'ginge', 'gingen', 'ginget', 'gingen'],
    partizip2: 'gegangen',
    auxiliary: 'sein',
    imperativ: { du: 'geh(e)!', ihr: 'geht!', sie: 'gehen Sie!' },
  },
  kommen: {
    praesens: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'],
    praeteritum: ['kam', 'kamst', 'kam', 'kamen', 'kamt', 'kamen'],
    konjunktiv2: ['käme', 'kämest', 'käme', 'kämen', 'kämet', 'kämen'],
    partizip2: 'gekommen',
    auxiliary: 'sein',
    imperativ: { du: 'komm(e)!', ihr: 'kommt!', sie: 'kommen Sie!' },
  },
};

/** Построение спряжения немецкого глагола */
export function buildVerbConjugation(lemma: string, entry?: LexiconVerbEntry): Conjugation {
  const clean = lemma.trim().toLowerCase().replace(/^sich\s+/i, '');
  const special = SPECIAL_VERBS[clean];

  if (special) {
    return {
      praesens: PRONOUNS.map((pronoun, idx) => ({ pronoun, form: special.praesens[idx] || clean })),
      praeteritum: PRONOUNS.map((pronoun, idx) => ({ pronoun, form: special.praeteritum[idx] || clean })),
      perfekt: `${special.auxiliary === 'sein' ? 'ist' : 'hat'} ${special.partizip2}`,
      auxiliary: special.auxiliary,
      partizip2: special.partizip2,
      konjunktiv2: special.konjunktiv2
        ? PRONOUNS.map((pronoun, idx) => ({ pronoun, form: special.konjunktiv2![idx] || '' }))
        : undefined,
      imperativ: special.imperativ,
    };
  }

  // Отделяемую приставку определяем по Partizip II (auf-ge-standen).
  const separated = entry?.p2?.match(/^(zurück|zusammen|weiter|wieder|heraus|hinein|vorbei|ab|an|auf|aus|bei|ein|fest|her|hin|los|mit|nach|vor|weg|zu)ge/);
  const prefix = separated?.[1] ?? '';
  const base = prefix && clean.startsWith(prefix) ? clean.slice(prefix.length) : clean;
  const stripPrefix = (form?: string) => {
    const value = (form ?? '').replace(new RegExp(' ' + prefix + '$'), '');
    return prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;
  };
  const stem = base.endsWith('en') ? base.slice(0, -2) : base.endsWith('n') ? base.slice(0, -1) : base;
  const epenthetic = /[dt]$|[^aeiouäöürlh][mn]$/.test(stem);
  const p3 = stripPrefix(entry?.p3) || stem + (epenthetic ? 'et' : 't');
  const prt = stripPrefix(entry?.prt) || stem + (epenthetic ? 'ete' : 'te');
  const p2 = entry?.p2 || ((/^(be|emp|ent|er|ver|zer|ge|miss)/.test(base) || base.endsWith('ieren')) ? '' : 'ge') + stem + (epenthetic ? 'et' : 't');
  const aux = clean === 'aufstehen' ? 'sein' : entry?.aux || 'haben';
  const presentStem = p3.endsWith('t') ? p3.slice(0, -1) : p3;
  const du = /[sßxz]$/.test(presentStem) ? presentStem + 't' : presentStem + 'st';
  const first = base.endsWith('eln') ? stem.slice(0, -2) + 'le' : stem + 'e';
  const present = [first, du, p3, base, stem + (epenthetic ? 'et' : 't'), base];
  const weak = prt.endsWith('te');
  const past = weak ? [prt, prt + 'st', prt, prt + 'n', prt + 't', prt + 'n']
    : [prt, prt + (/[sßxzdt]$/.test(prt) ? 'est' : 'st'), prt, prt + 'en', prt + (/[dt]$/.test(prt) ? 'et' : 't'), prt + 'en'];
  const withPrefix = (form: string) => form + (prefix ? ' ' + prefix : '');
  const imperStem = /^i/.test(presentStem) && /^e/.test(stem) ? presentStem : stem;
  return {
    praesens: PRONOUNS.map((pronoun, idx) => ({ pronoun, form: withPrefix(present[idx]) })),
    praeteritum: PRONOUNS.map((pronoun, idx) => ({ pronoun, form: withPrefix(past[idx]) })),
    perfekt: (aux === 'sein' ? 'ist' : 'hat') + ' ' + p2,
    auxiliary: aux,
    partizip2: p2,
    // würde + инфинитив не требует угадывать умлаут неизвестного сильного глагола.
    konjunktiv2: ['würde','würdest','würde','würden','würdet','würden'].map((form, idx) => ({ pronoun: PRONOUNS[idx], form: form + ' ' + clean })),
    imperativ: { du: withPrefix(imperStem + (epenthetic ? 'e' : '')) + '!', ihr: withPrefix(present[4]) + '!', sie: base + ' Sie' + (prefix ? ' ' + prefix : '') + '!' },
  };
}

/** Построение таблицы 4 падежей немецкого существительного */
export function buildNounDeclension(lemma: string, entry?: LexiconNounEntry): DeclensionRow[] {
  const rawGender = entry?.g;
  const g = rawGender === 'm' ? 'der' : rawGender === 'f' ? 'die' : rawGender === 'n' ? 'das' : rawGender;
  if (!g) return [];
  const pl = entry?.pl;
  const isWeakNoun = g === 'der' && Boolean(entry?.gen && /n$/.test(entry.gen) && !/s$/.test(entry.gen)) || /^(Junge|Kunde|Kollege|Herr|Nachbar|Bauer|Mensch|Bär|Prinz|Held|Student)$/i.test(lemma);
  const genEnding = isWeakNoun ? (/e$/.test(lemma) || /^(Herr|Bauer|Nachbar)$/.test(lemma) ? 'n' : 'en') : (lemma.endsWith('s') || lemma.endsWith('ß') || lemma.endsWith('z') || lemma.endsWith('x') ? 'es' : 's');
  const gen = entry?.gen || (g === 'die' ? lemma : `${lemma}${genEnding}`);

  const artSg = {
    nominative: g === 'die' ? 'die' : g === 'das' ? 'das' : 'der',
    genitive: g === 'die' ? 'der' : 'des',
    dative: g === 'die' ? 'der' : 'dem',
    accusative: g === 'die' ? 'die' : g === 'das' ? 'das' : 'den',
  };

  const plWord = pl || lemma;
  const datPlWord = plWord.endsWith('n') || plWord.endsWith('s') ? plWord : `${plWord}n`;
  const accSgWord = isWeakNoun && g === 'der' ? `${lemma}${genEnding}` : lemma;
  const datSgWord = isWeakNoun && g === 'der' ? `${lemma}${genEnding}` : lemma;

  return [
    {
      grammaticalCase: 'nominative',
      singular: `${artSg.nominative} ${lemma}`,
      plural: pl ? `die ${plWord}` : '—',
    },
    {
      grammaticalCase: 'genitive',
      singular: `${artSg.genitive} ${gen}`,
      plural: pl ? `der ${plWord}` : '—',
    },
    {
      grammaticalCase: 'dative',
      singular: `${artSg.dative} ${datSgWord}`,
      plural: pl ? `den ${datPlWord}` : '—',
    },
    {
      grammaticalCase: 'accusative',
      singular: `${artSg.accusative} ${accSgWord}`,
      plural: pl ? `die ${plWord}` : '—',
    },
  ];
}

/** Степени сравнения прилагательного */
export function getAdjComparison(
  lemma: string,
  entry?: LexiconAdjEntry,
): { comparative: string; superlative: string } {
  if (entry?.comp && entry?.sup) {
    return { comparative: entry.comp, superlative: entry.sup };
  }
  const clean = lemma.trim().toLowerCase();
  const stem = clean.endsWith('e') ? clean.slice(0, -1) : clean;
  const comp = `${stem}er`;
  const supEnding = stem.endsWith('t') || stem.endsWith('d') || stem.endsWith('s') || stem.endsWith('z') ? 'esten' : 'sten';
  const sup = `am ${stem}${supEnding}`;

  return {
    comparative: entry?.comp || comp,
    superlative: entry?.sup || sup,
  };
}
