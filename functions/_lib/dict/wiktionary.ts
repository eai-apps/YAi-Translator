/**
 * Wiktionary (не нужен ключ).
 *  - en.wiktionary REST: значения на английском и часть речи (для всех 12 языков);
 *  - de.wiktionary HTML: для немецкого — род, падежи, формы глагола, транскрипция (wiktionaryDe.ts).
 * Лицензия CC BY-SA: на карточке всегда подпись «Wiktionary» со ссылкой на статью.
 */
import type { DictExample, DictSense, LanguageCode } from '../../../shared/types';
import { DICT } from '../config';
import { WIKT_CODES, dictFetch, partOfSpeechFromWikt, readJson, stripHtml } from './http';
import { EMPTY_GERMAN, lookupGermanWiktionary } from './wiktionaryDe';

export interface WiktionaryData {
  url: string;
  senses: DictSense[];
  examples: DictExample[];
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
  transcription: string | null;
  forms: Array<{ label: string; value: string }>;
  partOfSpeech: DictSense['partOfSpeech'] | null;
}

interface RestDefinition {
  definition?: string;
  parsedExamples?: Array<{ example?: string; translation?: string }>;
}

interface RestBlock {
  partOfSpeech?: string;
  language?: string;
  definitions?: RestDefinition[];
}

/** Сколько значений брать для одной части речи (остальное — узкие термины). */
const MAX_SENSES_PER_POS = 3;

/** Названия языков в ответе en.wiktionary REST. */
const REST_LANGUAGE_NAMES: Record<LanguageCode, string> = {
  de: 'German',
  ru: 'Russian',
  uk: 'Ukrainian',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  pl: 'Polish',
  nl: 'Dutch',
  tr: 'Turkish',
  ar: 'Arabic',
};

/** Блоки нужного языка: обычно data[код], редко — data.other с полем language. */
function languageBlocks(data: Record<string, RestBlock[]>, sourceLang: LanguageCode): RestBlock[] {
  const direct = data[WIKT_CODES[sourceLang].rest] ?? [];
  const fromOther = (data.other ?? []).filter(
    (block) => (block.language ?? '').toLowerCase() === REST_LANGUAGE_NAMES[sourceLang].toLowerCase(),
  );
  return [...direct, ...fromOther];
}

/** Служебные определения, которые ничего не объясняют. */
const NOISE_DEFINITION = /^(inflection of|form of|plural of|singular of|alternative form|misspelling|obsolete form)/i;

async function readRest(
  word: string,
  sourceLang: LanguageCode,
  signal: AbortSignal | undefined,
): Promise<{ senses: DictSense[]; examples: DictExample[] }> {
  const data = await readJson<Record<string, RestBlock[]>>(
    await dictFetch(`${DICT.wiktionaryApi}/${encodeURIComponent(word)}`, signal),
  );
  if (!data) return { senses: [], examples: [] };

  const senses: DictSense[] = [];
  const examples: DictExample[] = [];
  const perPos = new Map<string, number>();
  const pageUrl = `${DICT.wiktionaryPage}/${encodeURIComponent(word)}`;

  for (const block of languageBlocks(data, sourceLang)) {
    const partOfSpeech = partOfSpeechFromWikt(block.partOfSpeech ?? '');
    for (const definition of block.definitions ?? []) {
      const text = stripHtml(definition.definition ?? '');
      const used = perPos.get(partOfSpeech) ?? 0;
      if (!text || NOISE_DEFINITION.test(text) || used >= MAX_SENSES_PER_POS) continue;
      perPos.set(partOfSpeech, used + 1);

      // У английского слова значение en.wiktionary уже на английском.
      senses.push({ source: 'wiktionary', partOfSpeech, definition: text, translation: null, translationLang: null });

      // Примеры пригодятся только для английского слова: у остальных они тоже на английском.
      if (sourceLang !== 'en') continue;
      for (const parsed of definition.parsedExamples ?? []) {
        const example = stripHtml(parsed.example ?? '');
        if (!example || example.length > 200) continue;
        examples.push({
          text: example,
          translation: parsed.translation ? stripHtml(parsed.translation) : null,
          translationLang: parsed.translation ? 'en' : null,
          source: 'wiktionary',
          url: pageUrl,
        });
      }
    }
  }
  return { senses, examples };
}

/** Все данные Wiktionary для слова; null — словарь про него ничего не рассказал. */
export async function lookupWiktionary(
  word: string,
  sourceLang: LanguageCode,
  signal: AbortSignal | undefined,
): Promise<WiktionaryData | null> {
  const [rest, german] = await Promise.all([
    readRest(word, sourceLang, signal).catch(() => ({ senses: [], examples: [] })),
    sourceLang === 'de'
      ? lookupGermanWiktionary(word, signal).catch(() => EMPTY_GERMAN)
      : Promise.resolve(EMPTY_GERMAN),
  ]);

  const hasData = rest.senses.length > 0 || german.forms.length > 0 || Boolean(german.gender);
  if (!hasData) return null;

  return {
    url: `${DICT.wiktionaryPage}/${encodeURIComponent(word)}`,
    senses: rest.senses.slice(0, DICT.maxSenses),
    examples: rest.examples.slice(0, DICT.maxExamples),
    gender: german.gender,
    plural: german.plural,
    transcription: german.transcription,
    forms: german.forms,
    partOfSpeech: rest.senses[0]?.partOfSpeech ?? german.partOfSpeech,
  };
}
