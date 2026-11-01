/**
 * Сборка и компиляция базы разговорника (Часть 17).
 * Читает scripts/phrasebook/curated.json, валидирует все фразы
 * и генерирует shared/phrasebook/data.ts и shared/phrasebook/index.ts.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CURATED_PATH = path.join(__dirname, 'phrasebook', 'curated.json');
const OUTPUT_DIR = path.join(ROOT, 'shared', 'phrasebook');

async function main() {
  console.log('=== Сборка разговорника YAi Translator (Часть 17) ===');

  if (!existsSync(CURATED_PATH)) {
    throw new Error(`Файл ${CURATED_PATH} не найден!`);
  }

  const raw = readFileSync(CURATED_PATH, 'utf-8');
  const topics = JSON.parse(raw);

  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('Файл curated.json пуст или имеет неверный формат.');
  }

  let totalPhrases = 0;
  for (const topic of topics) {
    if (!topic.id || !topic.titleKey || !Array.isArray(topic.phrases)) {
      throw new Error(`Некорректная тема: ${JSON.stringify(topic)}`);
    }
    for (const p of topic.phrases) {
      if (!p.id || !p.de || !p.en || !p.ru || !p.uk) {
        throw new Error(`Некорректная фраза в теме ${topic.id}: ${JSON.stringify(p)}`);
      }
      totalPhrases++;
    }
    console.log(`- Тема ${topic.id} (${topic.icon}): ${topic.phrases.length} фраз`);
  }

  console.log(`Всего тем: ${topics.length}, всего фраз: ${totalPhrases}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const dataTsContent = `/**
 * Автоматически сгенерировано из scripts/phrasebook/curated.json (npm run phrasebook).
 * Не редактируйте вручную.
 */
import type { PhraseTopic } from './types';

export const PHRASEBOOK_TOPICS: PhraseTopic[] = ${JSON.stringify(topics, null, 2)};
`;

  writeFileSync(path.join(OUTPUT_DIR, 'data.ts'), dataTsContent, 'utf-8');

  const typesTsContent = `/**
 * Типы разговорника.
 */
export interface PhraseItem {
  id: string;
  topicId: string;
  de: string;
  en: string;
  ru: string;
  uk: string;
  context?: string;
}

export interface PhraseTopic {
  id: string;
  icon: string;
  titleKey: string;
  phrases: PhraseItem[];
}
`;
  writeFileSync(path.join(OUTPUT_DIR, 'types.ts'), typesTsContent, 'utf-8');

  const indexTsContent = `/**
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
`;
  writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexTsContent, 'utf-8');

  console.log('Сборка разговорника успешно завершена!');
}

main().catch((err) => {
  console.error('Ошибка сборки разговорника:', err);
  process.exit(1);
});
