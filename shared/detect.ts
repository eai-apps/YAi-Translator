/**
 * Простое определение языка без ИИ — для сервисов, которые сами его не определяют.
 * Работает для всех 12 языков сайта: сначала уникальные буквы и алфавиты,
 * затем частые слова (стоп-слова) по 15–25 на язык.
 */
import type { LanguageCode } from './languages';
import { isLanguageCode } from './languages';

/** Частые слова. Наборы должны быть узнаваемыми: служебные слова, местоимения, союзы. */
const STOP_WORDS: Partial<Record<LanguageCode, string[]>> = {
  de: [
    'der', 'die', 'das', 'und', 'ist', 'ich', 'nicht', 'ein', 'eine', 'mit', 'auf', 'für', 'sie', 'wir',
    'zu', 'den', 'dem', 'des', 'von', 'auch', 'es', 'sich', 'wie', 'aber', 'habe', 'bin', 'heute', 'mein',
  ],
  en: [
    'the', 'and', 'is', 'are', 'you', 'not', 'with', 'for', 'this', 'that', 'have', 'was', 'what', 'to',
    'of', 'in', 'it', 'my', 'we', 'they', 'be', 'can', 'will', 'do', 'how', 'where', 'today', 'hello',
  ],
  fr: [
    'le', 'la', 'les', 'de', 'des', 'et', 'est', 'un', 'une', 'je', 'tu', 'il', 'elle', 'nous', 'vous',
    'ils', 'pas', 'que', 'qui', 'dans', 'pour', 'avec', 'sur', 'ce', 'cette', 'mais', 'bonjour', 'merci',
  ],
  es: [
    'el', 'la', 'los', 'las', 'de', 'y', 'es', 'un', 'una', 'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos',
    'no', 'que', 'en', 'por', 'para', 'con', 'muy', 'pero', 'este', 'esta', 'hola', 'gracias', 'como',
  ],
  it: [
    'il', 'lo', 'la', 'gli', 'le', 'di', 'e', 'è', 'un', 'una', 'io', 'tu', 'lui', 'lei', 'noi', 'voi',
    'loro', 'non', 'che', 'in', 'per', 'con', 'sono', 'questo', 'questa', 'ma', 'ciao', 'grazie', 'come',
  ],
  pt: [
    'o', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'e', 'é', 'um', 'uma', 'eu', 'tu', 'ele', 'ela',
    'nós', 'eles', 'não', 'que', 'em', 'para', 'com', 'muito', 'mas', 'este', 'esta', 'olá', 'obrigado', 'como',
  ],
  nl: [
    'de', 'het', 'een', 'en', 'is', 'ik', 'jij', 'hij', 'zij', 'wij', 'jullie', 'niet', 'dat', 'dit',
    'van', 'op', 'voor', 'met', 'maar', 'ook', 'kan', 'wat', 'hoe', 'hallo', 'dank', 'goede',
  ],
  pl: [
    'i', 'w', 'nie', 'jest', 'to', 'się', 'na', 'z', 'do', 'że', 'ja', 'ty', 'on', 'ona', 'my', 'wy',
    'oni', 'ale', 'dla', 'bardzo', 'tak', 'jak', 'gdzie', 'cześć', 'dziękuję', 'dzień',
  ],
  tr: [
    've', 'bir', 'bu', 'için', 'ile', 'de', 'da', 'ama', 'çok', 'ben', 'sen', 'o', 'biz', 'siz', 'onlar',
    'değil', 'var', 'yok', 'ne', 'nasıl', 'nerede', 'merhaba', 'teşekkür', 'günaydın', 'evet',
  ],
};

const WORD_SETS: Array<{ code: LanguageCode; words: Set<string> }> = Object.entries(STOP_WORDS).map(
  ([code, words]) => ({ code: code as LanguageCode, words: new Set(words) }),
);

export function guessLanguage(text: string): LanguageCode | null {
  const sample = text.toLowerCase().trim();
  // Алфавит без учёта регистра: турецкая «İ» при toLowerCase превращается в «i» + точка.
  const original = text.trim();
  if (!sample) return null;

  // Арабский: буквы U+0600–U+06FF.
  if (/[\u0600-\u06FF]/.test(sample)) return 'ar';
  // Кириллица: украинский отличаем по буквам і, ї, є, ґ.
  if (/[а-яё]/.test(sample) || /[іїєґ]/.test(sample)) {
    return /[іїєґ]/.test(sample) ? pick('uk') : pick('ru');
  }

  const counts: Partial<Record<LanguageCode, number>> = {};
  const add = (code: LanguageCode, weight: number) => {
    counts[code] = (counts[code] ?? 0) + weight;
  };

  // 1. Уникальные буквы и диакритика — самый надёжный признак.
  if (/[äöüß]/.test(sample)) add('de', 4);
  if (/[ñ¿¡]/.test(sample)) add('es', 4);
  if (/[ãõç]/.test(sample)) add('pt', 3);
  if (/[łłąęśźżń]/.test(sample)) add('pl', 4);
  // В турецком и польском есть одинаковые буквы ś / ż — решает ы/і (польский) и ı/ğ/ş (турецкий).
  if (/[ğşı]/.test(sample) || /[İĞŞ]/.test(original)) add('tr', 4);
  if (/[èêàâëîïôûùœ]/.test(sample)) add('fr', 2);
  if (/[ìò]/.test(sample)) add('it', 2);

  // 2. Частые слова.
  const words = sample.match(/\p{L}+/gu) ?? [];
  for (const word of words) {
    for (const set of WORD_SETS) {
      if (set.words.has(word)) add(set.code, 1);
    }
  }

  // Буквы важнее одного совпавшего слова: «für» — это не испанская «ñ»,
  // поэтому при ничьей побеждает язык с буквенным признаком.
  let winner: LanguageCode | null = null;
  let top = 0;
  let letterBonus = 0;
  for (const [code, value] of Object.entries(counts) as Array<[LanguageCode, number]>) {
    const bonus = hasDistinctLetter(code, sample, original) ? 1 : 0;
    if (value + bonus > top + letterBonus) {
      winner = code;
      top = value;
      letterBonus = bonus;
    }
  }
  if (winner) return winner;

  // Одно незнакомое латинское слово: в нашем приложении чаще всего это немецкий.
  return words.length > 0 ? pick('de') : null;
}

/** Языки с собственными буквами: у них признак важнее совпадения стоп-слова. */
function hasDistinctLetter(code: LanguageCode, sample: string, original: string): boolean {
  switch (code) {
    case 'de':
      return /[äöüß]/.test(sample);
    case 'es':
      return /[ñ¿¡]/.test(sample);
    case 'pt':
      return /[ãõç]/.test(sample);
    case 'pl':
      // «ś» и «ż» есть и в турецком: букву знаком языка считаем только вместе с ы/ą/ę/ł/ź/ń.
      return /[łąęłźń]/.test(sample) || (/[śż]/.test(sample) && !/[ğşı]/.test(sample));
    case 'tr':
      // Латинская «I» есть и в английском, поэтому турецкую I считаем только вместе с точкой или ğ/ş.
      return /[ğşı]/.test(sample) || /[İĞŞ]/.test(original);
    case 'fr':
      return /[èêàâëîïôûùœ]/.test(sample);
    case 'it':
      return /[ìò]/.test(sample);
    default:
      return false;
  }
}

function pick(code: string): LanguageCode | null {
  return isLanguageCode(code) ? code : null;
}
