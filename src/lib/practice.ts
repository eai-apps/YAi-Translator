/**
 * Упражнения (этап 6) без React и без ИИ: вопросы строятся из сохранённых карточек.
 * Один файл — одна логика: артикль, множественное число, перевод, аудирование,
 * сборка предложения. Компоненты только показывают готовые вопросы.
 */
import type { StudyArticle, StudyCard, PracticeType } from '../../shared/types';
import { hashCode } from '../../shared/study';

export const PRACTICE_QUESTION_COUNT = 10;
/** Меньше этого числа подходящих карточек — упражнение не начинается. */
export const PRACTICE_MIN_CARDS = 4;

export type PracticeQuestion =
  | { type: 'article'; card: StudyCard; options: StudyArticle[]; answer: StudyArticle }
  | { type: 'plural'; card: StudyCard; options: string[]; answer: string }
  | { type: 'translation'; card: StudyCard; options: string[]; answer: string }
  | { type: 'listening'; card: StudyCard; answer: string }
  | { type: 'sentence'; card: StudyCard; tokens: string[]; answer: string[] };

export interface PracticeData {
  questions: PracticeQuestion[];
  /** Сколько карточек не хватает до PRACTICE_MIN_CARDS. */
  missing: number;
}

/** Простая перемешивалка с зерном: одинаковый seed — одинаковый порядок. */
function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed || 1;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Умлаут первой подходящей гласной: Haus → Häuser. */
function withUmlaut(word: string): string {
  return word.replace(/[aou]/, (letter) => ({ a: 'ä', o: 'ö', u: 'ü' })[letter] ?? letter);
}

/** Три неверные формы по типовым правилам (-e, -en, -er, умлаут). */
function pluralOptions(card: StudyCard): string[] {
  const correct = card.plural ?? `${card.lemma}e`;
  const candidates = [
    `${withUmlaut(card.lemma)}e`,
    `${card.lemma}en`,
    `${withUmlaut(card.lemma)}er`,
    `${card.lemma}e`,
    `${card.lemma}n`,
    `${card.lemma}s`,
  ].filter((form) => form && form.toLowerCase() !== correct.toLowerCase());

  const unique: string[] = [];
  for (const form of [...new Set(candidates)]) {
    if (unique.length === 3) break;
    unique.push(form);
  }
  // Совсем короткое слово — добавляем формы с запасом, чтобы всегда было 4 варианта.
  while (unique.length < 3) unique.push(`${card.lemma}${'e'.repeat(unique.length + 1)}`);
  return shuffle([correct, ...unique], hashCode(card.id));
}

/** Склонение только для существительных с артиклем. */
function nouns(cards: StudyCard[]): StudyCard[] {
  return cards.filter((card) => card.partOfSpeech === 'noun' && card.article);
}

function makeQuestion(type: PracticeType, card: StudyCard, pool: StudyCard[]): PracticeQuestion | null {
  switch (type) {
    case 'article': {
      if (!card.article) return null;
      return { type, card, options: ['der', 'die', 'das'], answer: card.article };
    }
    case 'plural': {
      if (!card.plural) return null;
      return { type, card, options: pluralOptions(card), answer: card.plural };
    }
    case 'translation': {
      const answer = card.translations[0];
      if (!answer) return null;
      const others = pool
        .filter((item) => item.id !== card.id)
        .map((item) => item.translations[0])
        .filter((value): value is string => Boolean(value) && value.toLowerCase() !== answer.toLowerCase());
      const options = shuffle([answer, ...Array.from(new Set(others)).slice(0, 3)], hashCode(card.id));
      if (options.length < 4) return null;
      return { type, card, options, answer };
    }
    case 'listening':
      return { type, card, answer: card.lemma };
    case 'sentence': {
      if (!card.example) return null;
      // Предложение целиком: слова с пунктуацией остаются как в примере.
      const answer = card.example.text.trim().split(/\s+/);
      if (answer.length < 2) return null;
      return { type, card, tokens: shuffle(answer, hashCode(card.example.text)), answer };
    }
  }
}

/** Подходящие карточки для вида упражнения. */
function candidatesFor(type: PracticeType, cards: StudyCard[]): StudyCard[] {
  switch (type) {
    case 'article':
      return nouns(cards);
    case 'plural':
      return nouns(cards).filter((card) => Boolean(card.plural));
    case 'translation':
      return cards.filter((card) => card.translations.length > 0);
    case 'listening':
      return cards.filter((card) => card.lemma.length > 0);
    case 'sentence':
      return cards.filter((card) => Boolean(card.example));
  }
}

/** Собирает 10 вопросов; если карточек меньше 4 — сообщает, сколько не хватает. */
export function buildPractice(type: PracticeType, cards: StudyCard[]): PracticeData {
  const candidates = candidatesFor(type, cards);
  const missing = Math.max(0, PRACTICE_MIN_CARDS - candidates.length);
  if (missing > 0) return { questions: [], missing };

  const order = shuffle(candidates, hashCode(`${type}:${Date.now()}`));
  const questions: PracticeQuestion[] = [];
  for (let index = 0; index < PRACTICE_QUESTION_COUNT; index += 1) {
    const card = order[index % order.length];
    const question = makeQuestion(type, card, candidates);
    if (question) questions.push(question);
  }
  // Редкий случай (например, одинаковые переводы): добираем вопросами из уже собранных.
  while (questions.length > 0 && questions.length < PRACTICE_QUESTION_COUNT) {
    questions.push(questions[0]);
  }
  return { questions, missing: 0 };
}

/** Сравнение ответа аудирования: умлауты можно писать ae/oe/ue, ß — ss. */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:()[\]"']/g, '')
    .replace(/\s+/g, ' ');
}

/** 'exact' — написание совпало, 'umlaut' — верно, но умлаут записан иначе, null — ошибка. */
export function checkListening(input: string, answer: string): 'exact' | 'umlaut' | null {
  const clean = input.trim().replace(/\s+/g, ' ').toLowerCase();
  if (clean === answer.trim().toLowerCase()) return 'exact';
  if (normalizeAnswer(input) === normalizeAnswer(answer)) return 'umlaut';
  return null;
}
