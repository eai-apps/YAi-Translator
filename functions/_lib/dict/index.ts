/**
 * Сборка карточки из настоящих словарей (версия 0.10.0).
 * Источники опрашиваются параллельно, у каждого таймаут 6 секунд (dictFetch).
 * Для перевода ru → de используется ru.wiktionary + de.wiktionary (без английских толкований).
 */
import type { DictEntry, DictSourceId, DictSourceRef, LanguageCode } from '../../../shared/types';
import { DICT } from '../config';
import type { Env } from '../env';
import { lookupDwds } from './dwds';
import { lookupSynonyms } from './openthesaurus';
import { lookupPons } from './pons';
import { lookupExamples } from './tatoeba';
import { lookupWiktionary } from './wiktionary';
import { lookupWiktionaryRu } from './wiktionaryRu';

/** Подписи источников и ссылки по умолчанию. */
export const SOURCE_NAMES: Record<DictSourceId, string> = {
  wiktionary: 'Wiktionary',
  openthesaurus: 'OpenThesaurus',
  tatoeba: 'Tatoeba',
  pons: 'PONS',
};

/** Общие адреса источников. */
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
  // Для слова не на немецком при переводе на немецкий (ru → de): ru.wiktionary + de.wiktionary
  if (sourceLang !== 'de' && targetLang === 'de') {
    const [wiktRu, pons, examples] = await Promise.all([
      lookupWiktionaryRu(word, signal).catch(() => null),
      lookupPons(env, word, sourceLang, targetLang, signal).catch(() => null),
      lookupExamples(word, sourceLang, targetLang, signal).catch(() => null),
    ]);

    if (wiktRu) {
      const mainGerman = wiktRu.mainGermanWord;
      const [synonyms, germanExamples] = await Promise.all([
        mainGerman ? lookupSynonyms(mainGerman, 'de', signal).catch(() => null) : Promise.resolve(null),
        mainGerman && (!examples || examples.length === 0)
          ? lookupExamples(mainGerman, 'de', sourceLang, signal).catch(() => null)
          : Promise.resolve(null),
      ]);

      const sources: DictSourceRef[] = [{ id: 'wiktionary', name: SOURCE_NAMES.wiktionary, url: wiktRu.url }];
      if (synonyms && synonyms.length > 0 && mainGerman) {
        sources.push({ id: 'openthesaurus', name: SOURCE_NAMES.openthesaurus, url: `${DICT.openThesaurusPage}/synonyme/${encodeURIComponent(mainGerman)}` });
      }
      const combinedExamples = [...(examples ?? []), ...(germanExamples ?? [])].slice(0, DICT.maxExamples);
      if (combinedExamples.length > 0) {
        sources.push({ id: 'tatoeba', name: SOURCE_NAMES.tatoeba, url: `https://tatoeba.org/de/sentences/search?query=${encodeURIComponent(word)}` });
      }
      if (pons && pons.length > 0) {
        sources.push({ id: 'pons', name: SOURCE_NAMES.pons, url: `${DICT.ponsPage}/dictionary/german-russian/search?q=${encodeURIComponent(word)}` });
      }

      // Значения: PONS + толкования ru.wiktionary (без английских токований en.wiktionary)
      const senses = [...(pons ?? []), ...wiktRu.senses].slice(0, DICT.maxSenses * 2);

      return {
        word,
        sourceLang,
        targetLang,
        sources,
        senses,
        gender: wiktRu.gender,
        plural: wiktRu.plural,
        partOfSpeech: wiktRu.partOfSpeech,
        transcription: wiktRu.transcription,
        forms: wiktRu.forms,
        synonyms: synonyms ?? [],
        examples: combinedExamples,
        definitions: [],
      };
    }
  }

  // Обычный путь (для немецкого слова de → ru/en или других пар)
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

  // Английские толкования en.wiktionary не показываем при интерфейсе ru/de, если есть PONS или DWDS
  const rawWiktSenses = wiktionary?.senses ?? [];
  const filteredWiktSenses = (targetLang === 'ru' || targetLang === 'de') && ((pons && pons.length > 0) || definitions.length > 0)
    ? rawWiktSenses.filter((s) => s.translationLang === targetLang)
    : rawWiktSenses;

  const senses = [...(pons ?? []), ...filteredWiktSenses].slice(0, DICT.maxSenses * 2);
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
    examples: [...(examples ?? []), ...(wiktionary?.examples ?? [])].slice(0, DICT.maxExamples),
    definitions,
  };
}

/**
 * Ключ кэша карточки: слово + языковая пара.
 */
export function dictCacheKey(word: string, sourceLang: LanguageCode, targetLang: LanguageCode): string {
  const purge = 'v5';
  return `dict|${purge}|${sourceLang}|${targetLang}|${word.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}
