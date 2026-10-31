/** Тип темы справочника грамматики: одинаковый в списках групп и в grammarTopics.ts. */
import type { GrammarCategory, GrammarLevel } from './grammarTopics';

export interface GrammarTopicSeed {
  slug: string;
  category: GrammarCategory;
  level: GrammarLevel;
  titleRu: string;
  titleDe: string;
  titleEn: string;
}
