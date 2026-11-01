import { fetchWordAsset } from './wordAsset';
/**
 * Загрузка статических офлайн-карточек слов и сборка на клиенте (этап 15Б, версия 0.17.5).
 * Читает /cards/<lang>-<explain>/<prefix>.json, закэшированные в памяти.
 */
import type { LanguageCode, WordCard } from '../../shared/types';
import { getLexiconPrefix, type LexiconEntry } from '../../shared/lexicon';
import { assembleWordCard, type ExampleInput } from '../../shared/cardAssembler';
import { getGermanTranslation } from '../data/commonTranslationsDeRu';

const chunkCache = new Map<string, Record<string, WordCard>>();

/** Получение предварительно собранной статической офлайн-карточки */
export async function getOfflineCard(
  lemma: string,
  lang: LanguageCode,
  explainLang: LanguageCode,
): Promise<WordCard | null> {
  const clean = lemma.trim().toLowerCase().replace(/^(der|die|das|the|a|an)\s+/i, '');
  if (!clean) return null;

  const prefix = getLexiconPrefix(clean);
  const cacheKey = `${lang}-${explainLang}:${prefix}`;

  if (!chunkCache.has(cacheKey)) {
    try {
      const res = await fetchWordAsset(`/cards/${lang}-${explainLang}/${prefix}.json`);
      if (res.ok) {
        const data = (await res.json()) as Record<string, WordCard>;
        chunkCache.set(cacheKey, data);
      } else {
        // Недоступные файлы повторно проверим при следующем запросе.
      }
    } catch {
      // Сбой сети не превращаем в постоянное отсутствие карточки.
    }
  }

  const chunk = chunkCache.get(cacheKey);
  return chunk?.[clean] ?? null;
}

/** Сборка полной карточки на клиенте из загруженных данных лексикона и примеров */
export function assembleClientCard(
  lemma: string,
  lang: LanguageCode,
  explainLang: LanguageCode,
  entry?: LexiconEntry | null,
  examples?: ExampleInput[],
  translations?: string[],
): WordCard {
  const fallback = lang === 'de' && explainLang === 'ru' ? getGermanTranslation(lemma) : undefined;
  return assembleWordCard({
    lemma,
    lang,
    explainLang,
    entry,
    examples,
    translations: translations?.length ? translations : fallback ? [fallback] : [],
  });
}
