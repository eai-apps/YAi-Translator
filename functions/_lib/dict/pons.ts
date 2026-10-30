/**
 * PONS API (ключ PONS_API_KEY, необязательный): словарная статья DE↔RU и DE↔EN.
 * Документированный способ авторизации — заголовок X-Secret с ключом из «mein PONS».
 * Без ключа источник молча пропускается.
 * Формат ответа проверяется по месту: если он не совпал с ожидаемым, источник пропускается.
 */
import type { DictSense, LanguageCode } from '../../../shared/types';
import { DICT } from '../config';
import type { Env } from '../env';
import { dictFetch, partOfSpeechFromWikt, readJson } from './http';

/** Языковые направления PONS, которые нам нужны. */
const DIRECTIONS: Partial<Record<LanguageCode, string>> = {
  de: 'de',
  ru: 'ru',
  en: 'en',
};

interface PonsHeadword {
  word?: string;
  headword?: string;
  headword_full?: string;
}

interface PonsTranslation {
  source?: string;
  target?: string;
}

interface PonsSense {
  wordclass?: string;
  source?: string;
  target?: string;
  translations?: PonsTranslation[];
}

interface PonsRom {
  headword?: PonsHeadword | string;
  headword_full?: string;
  wordclass?: string;
  senses?: PonsSense[];
}

interface PonsHit extends PonsRom {
  lang?: string;
  type?: string;
  roms?: PonsRom[];
}

/** Значение из senses[0]: PONS отдаёт массив переводов. */
function senseTranslations(sense: PonsSense): string[] {
  const list: string[] = [];
  if (sense.target) list.push(sense.target);
  for (const translation of sense.translations ?? []) {
    if (translation.target) list.push(translation.target);
  }
  return list;
}

/** Значения PONS для слова; null — нет ключа, сервис не ответил или формат не совпал. */
export async function lookupPons(
  env: Env,
  word: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  signal: AbortSignal | undefined,
): Promise<DictSense[] | null> {
  const key = env.PONS_API_KEY?.trim();
  const from = DIRECTIONS[sourceLang];
  const to = DIRECTIONS[targetLang];
  if (!key || !from || !to || from === to) return null;

  const url = new URL(DICT.ponsApi);
  url.searchParams.set('q', word);
  url.searchParams.set('l', `${from}${to}`);

  const data = await readJson<PonsHit[] | { hits?: PonsHit[] }>(
    await dictFetch(url.toString(), signal, { 'X-Secret': key }),
  );
  if (!data) return null;
  const hits = Array.isArray(data) ? data : Array.isArray(data.hits) ? data.hits : [];
  if (hits.length === 0) return null;

  const senses: DictSense[] = [];
  for (const hit of hits) {
    // Нужно направление «перевод на русский/английский» и вид статьи «dictionary».
    if (hit.type && hit.type !== 'dictionary') continue;
    const headword = typeof hit.headword === 'string' ? hit.headword : (hit.headword?.headword ?? '');
    if (headword && headword.toLowerCase() !== word.toLowerCase()) continue;

    const roms = hit.roms ?? [hit];
    for (const rom of roms) {
      const romHeadword = typeof rom.headword === 'string' ? rom.headword : (rom.headword?.headword ?? headword);
      for (const sense of rom.senses ?? []) {
        const translations = senseTranslations(sense);
        const definition = sense.source ?? romHeadword;
        if (translations.length === 0) continue;
        senses.push({
          source: 'pons',
          partOfSpeech: partOfSpeechFromWikt(rom.wordclass ?? hit.wordclass ?? ''),
          definition: definition.slice(0, 200),
          translation: translations.slice(0, 4).join(', '),
          translationLang: targetLang,
        });
        if (senses.length >= 6) return senses;
      }
    }
  }
  return senses.length > 0 ? senses : null;
}
