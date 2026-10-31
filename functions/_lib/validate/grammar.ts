/**
 * Проверка текста темы справочника грамматики от ИИ.
 * Всё, что не похоже на нужную структуру, отбрасывается и возвращает null:
 * роутер тогда берёт следующего провайдера, а в базу ничего не попадает.
 */
import type { GrammarBody, GrammarExample, GrammarFormation, GrammarMistake } from '../../../shared/types';
import { grammarTopicLinks } from '../../../shared/grammarLinks';
import { isGermanGrammarSlug } from '../../../shared/grammarTopics';
import { asArray, asEnum, asStringList, asText, isRecord } from './helpers';

/** Уровни примеров: CEFR из словаря плюс C1 для старших тем. */
const EXAMPLE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

/** Slug только из известного список — ссылки ведут на существующие темы. */
function asSlugs(value: unknown, maxItems: number): string[] {
  const list = asArray(value, maxItems)
    .map((item) => asText(item, 80))
    .filter((item) => isGermanGrammarSlug(item));
  return [...new Set(list)];
}

/** Текст темы: summary обязательное, остальное может быть пустым. */
export function validateGrammar(raw: unknown, slug: string): GrammarBody | null {
  if (!isRecord(raw)) return null;
  const summary = asText(raw.summary, 4000);
  if (!summary) return null;

  const formation = asArray(raw.formation, 8)
    .map((item): GrammarFormation | null => {
      if (!isRecord(item)) return null;
      const rule = asText(item.rule, 800);
      if (!rule) return null;
      return {
        rule,
        example: asText(item.example, 400),
        translation: asText(item.translation, 400),
      };
    })
    .filter((item): item is GrammarFormation => item !== null);

  const examples = asArray(raw.examples, 8)
    .map((item): GrammarExample | null => {
      if (!isRecord(item)) return null;
      const text = asText(item.text, 400);
      if (!text) return null;
      return {
        level: asEnum(item.level, EXAMPLE_LEVELS, 'A2'),
        text,
        translation: asText(item.translation, 400),
      };
    })
    .filter((item): item is GrammarExample => item !== null);

  const commonMistakes = asArray(raw.commonMistakes, 6)
    .map((item): GrammarMistake | null => {
      if (!isRecord(item)) return null;
      const right = asText(item.right, 400);
      if (!right) return null;
      return {
        wrong: asText(item.wrong, 400),
        right,
        why: asText(item.why, 800),
      };
    })
    .filter((item): item is GrammarMistake => item !== null);

  // Связанные темы без самой себя и с ссылками на открытые источники этой темы.
  const related = asSlugs(raw.related, 6).filter((item) => item !== slug);

  return {
    summary,
    whenToUse: asStringList(raw.whenToUse, 8).map((item) => item.slice(0, 800)),
    formation,
    examples,
    exceptions: asStringList(raw.exceptions, 8).map((item) => item.slice(0, 800)),
    commonMistakes,
    related,
    links: grammarTopicLinks(slug),
  };
}
