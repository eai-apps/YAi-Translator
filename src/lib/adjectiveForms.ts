/**
 * Склонение и степени сравнения прилагательных (этап 8). Без React — проверяется node-скриптом
 * (scripts/test-adjective-forms.mjs).
 *
 * Три таблицы: сильное (без артикля), слабое (с der/die/das), смешанное (с ein/eine/ein).
 * Строки — 4 падежа, колонки — род/число: мужской, средний, женский, множественное число.
 */

export type AdjectiveDeclension = 'strong' | 'weak' | 'mixed';

export interface AdjectiveCell {
  /** «der schöne Garten» — с артиклем, если он есть. */
  text: string;
  /** Только прилагательное с окончанием: «schöne». */
  adjective: string;
}

export interface AdjectiveRow {
  grammaticalCase: 'nominative' | 'accusative' | 'dative' | 'genitive';
  masculine: AdjectiveCell;
  neuter: AdjectiveCell;
  feminine: AdjectiveCell;
  plural: AdjectiveCell;
}

/**
 * Окончания по таблицам. Слабая — -e / -en (кроме Nom. ед. и Akk. жен./ср.), сильная — окончания
 * определённого артикля там, где артикля нет, смешанная — слабые с артиклем, сильные без него.
 */
const ENDINGS: Record<AdjectiveDeclension, Record<string, [string, string, string, string]>> = {
  // порядок: мужской, средний, женский, множественное число
  strong: {
    nominative: ['er', 'es', 'e', 'e'],
    accusative: ['en', 'es', 'e', 'e'],
    dative: ['em', 'em', 'er', 'en'],
    genitive: ['en', 'en', 'er', 'er'],
  },
  weak: {
    nominative: ['e', 'e', 'e', 'en'],
    accusative: ['en', 'e', 'e', 'en'],
    dative: ['en', 'en', 'en', 'en'],
    genitive: ['en', 'en', 'en', 'en'],
  },
  mixed: {
    nominative: ['er', 'es', 'e', 'en'],
    accusative: ['en', 'es', 'e', 'en'],
    dative: ['en', 'en', 'en', 'en'],
    genitive: ['en', 'en', 'en', 'en'],
  },
};

/** Артикли каждой таблицы по падежам: мужской, средний, женский, множественное число. */
const ARTICLES: Record<AdjectiveDeclension, Record<string, [string, string, string, string]>> = {
  strong: {
    nominative: ['', '', '', ''],
    accusative: ['', '', '', ''],
    dative: ['', '', '', ''],
    genitive: ['', '', '', ''],
  },
  weak: {
    nominative: ['der', 'das', 'die', 'die'],
    accusative: ['den', 'das', 'die', 'die'],
    dative: ['dem', 'dem', 'der', 'den'],
    genitive: ['des', 'des', 'der', 'der'],
  },
  mixed: {
    nominative: ['ein', 'ein', 'eine', ''],
    accusative: ['einen', 'ein', 'eine', ''],
    dative: ['einem', 'einem', 'einer', ''],
    genitive: ['eines', 'eines', 'einer', ''],
  },
};

const CASES = ['nominative', 'accusative', 'dative', 'genitive'] as const;

/** Основа прилагательного: «schön» из «schöne», «schöner». Убираем типичные окончания. */
export function adjectiveStem(adjective: string): string {
  const word = adjective.trim().split(/\s+/).pop() ?? '';
  if (!word) return '';
  const endings = ['sten', 'esten', 'stem', 'en', 'er', 'es', 'em', 'e'];
  for (const ending of endings) {
    if (word.length > ending.length + 2 && word.endsWith(ending)) return word.slice(0, -ending.length);
  }
  return word;
}

/**
 * Степени сравнения. Умлаут у некоторых односложных прилагательных (alt → älter) не угадать
 * без словаря, поэтому принимаем готовые формы из карточки, если они есть.
 */
export function buildComparison(
  adjective: string,
  forms?: { comparative?: string | null; superlative?: string | null },
): { positive: string; comparative: string; superlative: string } {
  const stem = adjectiveStem(adjective);
  const comparative = forms?.comparative?.trim() || (stem ? `${stem}er` : '');
  const superlative = forms?.superlative?.trim() || (stem ? `am ${stem}sten` : '');
  return { positive: stem, comparative, superlative };
}

/** Готовая таблица склонения для одной из трёх схем. */
export function buildDeclension(adjective: string, declension: AdjectiveDeclension): AdjectiveRow[] {
  const stem = adjectiveStem(adjective);
  return CASES.map((grammaticalCase) => {
    const endings = ENDINGS[declension][grammaticalCase];
    const articles = ARTICLES[declension][grammaticalCase];
    const cell = (index: number): AdjectiveCell => {
      const adjectiveForm = `${stem}${endings[index]}`;
      const article = articles[index];
      return { adjective: adjectiveForm, text: article ? `${article} ${adjectiveForm}` : adjectiveForm };
    };
    return {
      grammaticalCase,
      masculine: cell(0),
      neuter: cell(1),
      feminine: cell(2),
      plural: cell(3),
    };
  });
}
