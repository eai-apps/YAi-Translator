/**
 * Справочник грамматики английского языка (этап 18, версия 0.20.0).
 * Объединяет все темы, таблицы и тексты в единый интерфейс.
 */
import type { GrammarBody, GrammarTopicSummary } from './grammar';
import type { UiLanguage } from './languages';
import { ENGLISH_GRAMMAR_TOPICS, ENGLISH_GRAMMAR_SLUGS, isEnglishGrammarSlug } from './grammarEnglishTopics';
import { ENGLISH_TENSES_BODIES } from './grammarEnglishTenses';
import { ENGLISH_OTHER_BODIES } from './grammarEnglishOther';
import { ENGLISH_TABLES_BODIES } from './grammarEnglishTables';

export { ENGLISH_GRAMMAR_TOPICS, ENGLISH_GRAMMAR_SLUGS, isEnglishGrammarSlug };

export const ALL_ENGLISH_BODIES = {
  ...ENGLISH_TENSES_BODIES,
  ...ENGLISH_OTHER_BODIES,
  ...ENGLISH_TABLES_BODIES,
};

/** Возвращает готовое тело английской темы на выбранном языке интерфейса. */
export function getEnglishTopicBody(slug: string, uiLang: UiLanguage = 'ru'): GrammarBody | null {
  const entry = ALL_ENGLISH_BODIES[slug];
  if (!entry) return null;
  const langKey = uiLang === 'de' ? 'de' : uiLang === 'en' ? 'en' : 'ru';
  return entry[langKey] ?? entry.ru;
}

/** Превращает seed в GrammarTopicSummary. */
export function getEnglishTopicSummaries(): GrammarTopicSummary[] {
  return ENGLISH_GRAMMAR_TOPICS.map((seed) => ({
    slug: seed.slug,
    lang: 'en',
    level: seed.level,
    category: seed.category,
    titleRu: seed.titleRu,
    titleDe: seed.titleDe,
    titleEn: seed.titleEn,
    filled: Boolean(ALL_ENGLISH_BODIES[seed.slug]),
    updatedAt: Date.now(),
  }));
}
