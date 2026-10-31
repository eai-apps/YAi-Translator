/** Проверка ответа учителя «Спросить у AI»: короткое объяснение, примеры и ссылки на темы. */
import type { AskResponse, AskSection } from '../../../shared/types';
import { isGermanGrammarSlug } from '../../../shared/grammarTopics';
import { asArray, asText, isRecord } from './helpers';

export type AskCore = Omit<AskResponse, 'provider' | 'cached'>;

export function validateAsk(raw: unknown): AskCore | null {
  if (!isRecord(raw)) return null;
  const summary = asText(raw.summary, 2000);
  if (!summary) return null;

  const sections = asArray(raw.sections, 5)
    .map((item): AskSection | null => {
      if (!isRecord(item)) return null;
      const text = asText(item.text, 2000);
      if (!text) return null;
      return { heading: asText(item.heading, 160), text };
    })
    .filter((item): item is AskSection => item !== null);

  const examples = asArray(raw.examples, 6)
    .map((item) => {
      if (!isRecord(item)) return null;
      const text = asText(item.text, 400);
      if (!text) return null;
      return { text, translation: asText(item.translation, 400) };
    })
    .filter((item): item is { text: string; translation: string } => item !== null);

  const topics = [
    ...new Set(
      asArray(raw.topics, 6)
        .map((item) => asText(item, 80))
        .filter((item) => isGermanGrammarSlug(item)),
    ),
  ];

  return { summary, sections, examples, topics };
}
