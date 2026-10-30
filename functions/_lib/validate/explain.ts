/** Проверка разбора фразы: порядок слов, союзы, падежи, времена, ошибки. */
import type { ExplainResponse } from '../../../shared/types';
import { asArray, asStringList, asText, isRecord } from './helpers';

export type ExplainCore = Omit<ExplainResponse, 'provider' | 'cached'>;

export function validateExplain(raw: unknown): ExplainCore | null {
  if (!isRecord(raw)) return null;
  const summary = asText(raw.summary, 2000);
  if (!summary) return null;

  const conjunctions = asArray(raw.conjunctions, 10)
    .map((item) => {
      if (!isRecord(item)) return null;
      const conjunction = asText(item.conjunction, 120);
      if (!conjunction) return null;
      return {
        conjunction,
        meaning: asText(item.meaning, 400),
        alternatives: asStringList(item.alternatives, 6),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const cases = asArray(raw.cases, 8)
    .map((item) => {
      if (!isRecord(item)) return null;
      const grammaticalCase = asText(item.grammaticalCase, 120);
      if (!grammaticalCase) return null;
      return {
        grammaticalCase,
        usage: asText(item.usage, 600),
        example: asText(item.example, 400),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const tenses = asArray(raw.tenses, 8)
    .map((item) => {
      if (!isRecord(item)) return null;
      const tense = asText(item.tense, 120);
      if (!tense) return null;
      return { tense, usage: asText(item.usage, 600), example: asText(item.example, 400) };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const commonMistakes = asArray(raw.commonMistakes, 10)
    .map((item) => {
      if (!isRecord(item)) return null;
      const right = asText(item.right, 400);
      if (!right) return null;
      return {
        wrong: asText(item.wrong, 400),
        right,
        explanation: asText(item.explanation, 600),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const vocabulary = asArray(raw.vocabulary, 12)
    .map((item) => {
      if (!isRecord(item)) return null;
      const word = asText(item.word, 120);
      if (!word) return null;
      return {
        word,
        translation: asText(item.translation, 240),
        note: asText(item.note, 400),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    summary,
    wordOrder: asStringList(raw.wordOrder, 8),
    conjunctions,
    cases,
    tenses,
    commonMistakes,
    vocabulary,
  };
}
