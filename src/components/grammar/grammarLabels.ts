/** Подписи справочника грамматики: группы тем и заголовки на языке интерфейса (этап 5). */
import type { GrammarCategory, GrammarTopicSummary, UiLanguage } from '../../../shared/types';

/** Ключи i18n для групп тем. */
export function grammarCategoryKey(category: GrammarCategory): string {
  return `grammar.category.${category}`;
}

/** Заголовок темы на языке интерфейса; если он пуст — русский. */
export function grammarTitle(topic: GrammarTopicSummary, uiLang: UiLanguage | string): string {
  if (uiLang === 'de') return topic.titleDe || topic.titleRu || topic.titleEn;
  if (uiLang === 'en') return topic.titleEn || topic.titleRu || topic.titleDe;
  return topic.titleRu || topic.titleDe || topic.titleEn;
}
