/**
 * Сборка карточки из настоящих словарей (версия 0.5.0).
 * Источники опрашиваются параллельно, у каждого таймаут 6 секунд (dictFetch).
 * Источник, который не ответил или ответил не по формату, молча пропускается:
 * карточка собирается из того, что пришло, и подписывается только реально ответившими источниками.
 */
import type { DictEntry, DictSourceId, DictSourceRef, LanguageCode } from '../../../shared/types';
import { DICT } from '../config';
import type { Env } from '../env';
import { lookupDwds } from './dwds';
import { lookupSynonyms } from './openthesaurus';
import { lookupPons } from './pons';
import { lookupExamples } from './tatoeba';
import { lookupWiktionary } from './wiktionary';

/** Подписи источников и ссылки по умолчанию. */
export const SOURCE_NAMES: Record<DictSourceId, string> = {
  wiktionary: 'Wiktionary',
  openthesaurus: 'OpenThesaurus',
  tatoeba: 'Tatoeba',
  pons: 'PONS',
};

/** Общие адреса источников (ключ за пределами карточки — тоже источник). */
export function sourceHomeUrl(id: DictSourceId): string {
  switch (id) {
    case 'wiktionary':
      return DICT.wiktionaryPage;
    case 'openthesaurus':
      return DICT.openThesaurusPage;
    case 'tatoeba':
      return 'https://tatoeba.org/de';
    case 'pons':
      return DICT.ponsPage;
  }
}

/** Одно слово — нормализованная форма для запросов к словарям. */
export function normalizeDictWord(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Собирает карточку; null — ни один словарь ничего не знает об этом слове. */
export async function buildDictEntry(
  env: Env,
  word: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  signal: AbortSignal | undefined,
): Promise<DictEntry | null> {
  const [wiktionary, synonyms, examples, pons, definitions] = await Promise.all([
    lookupWiktionary(word, sourceLang, signal).catch(() => null),
    lookupSynonyms(word, sourceLang, signal).catch(() => null),
    lookupExamples(word, sourceLang, targetLang, signal).catch(() => null),
    lookupPons(env, word, sourceLang, targetLang, signal).catch(() => null),
    lookupDwds(word, sourceLang, signal).catch(() => []),
  ]);

  const sources: DictSourceRef[] = [];
  const addSource = (id: DictSourceId, url: string): void => {
    if (sources.some((source) => source.id === id)) return;
    sources.push({ id, name: SOURCE_NAMES[id], url });
  };

  if (wiktionary) addSource('wiktionary', wiktionary.url);
  if (synonyms && synonyms.length > 0) addSource('openthesaurus', `${DICT.openThesaurusPage}/synonyme/${encodeURIComponent(word)}`);
  if (examples && examples.length > 0) addSource('tatoeba', `https://tatoeba.org/de/sentences/search?query=${encodeURIComponent(word)}`);
  if (pons && pons.length > 0) addSource('pons', `${DICT.ponsPage}/dictionary/german-${targetLang === 'ru' ? 'russian' : targetLang === 'en' ? 'english' : 'german'}/search?q=${encodeURIComponent(word)}`);

  // Значения: сначала двуязычный PONS (перевод), затем толкования Wiktionary.
  const senses = [...(pons ?? []), ...(wiktionary?.senses ?? [])].slice(0, DICT.maxSenses * 2);
  if (senses.length === 0 && (!examples || examples.length === 0) && !synonyms && definitions.length === 0) {
    return null;
  }

  return {
    word,
    sourceLang,
    targetLang,
    sources,
    senses,
    gender: wiktionary?.gender ?? null,
    plural: wiktionary?.plural ?? null,
    partOfSpeech: wiktionary?.partOfSpeech ?? null,
    transcription: wiktionary?.transcription ?? null,
    forms: wiktionary?.forms ?? [],
    synonyms: synonyms ?? [],
    // Примеры сначала из корпуса Tatoeba, затем из словаря.
    examples: [...(examples ?? []), ...(wiktionary?.examples ?? [])].slice(0, DICT.maxExamples),
    definitions,
  };
}

/**
 * Ключ кэша карточки: слово + языковая пара.
 * Не зависит от языка интерфейса: все тексты источников в карточке на своих языках.
 */
export function dictCacheKey(word: string, sourceLang: LanguageCode, targetLang: LanguageCode): string {
  // PURGE_VERSION меняется при исправлении разбора источников — старый кэш тогда не мешает.
  const purge = 'v2';
  return `dict|${purge}|${sourceLang}|${targetLang}|${word.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}
