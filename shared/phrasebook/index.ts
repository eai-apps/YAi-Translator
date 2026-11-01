/**
 * Экспорт разговорника YAi Translator (Часть 17).
 */
export * from './types';
export * from './data';

import { PHRASEBOOK_TOPICS } from './data';
import type { PhraseItem, PhraseTopic } from './types';

export function getPhraseTopics(): PhraseTopic[] {
  return PHRASEBOOK_TOPICS;
}

export function getAllPhrases(): PhraseItem[] {
  return PHRASEBOOK_TOPICS.flatMap((t) => t.phrases);
}

export function findPhrasesByQuery(query: string): PhraseItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return getAllPhrases();
  return getAllPhrases().filter(
    (p) =>
      p.de.toLowerCase().includes(clean) ||
      p.en.toLowerCase().includes(clean) ||
      p.ru.toLowerCase().includes(clean) ||
      p.uk.toLowerCase().includes(clean)
  );
}
