/**
 * Готовые наборы слов (этап 6): один список на все экраны и на сервер.
 * Слово дня выбирается из этого же списка, поэтому приложение и Functions
 * показывают одно и то же слово без запросов к ИИ.
 */
import type { DeckWord, StudyDeck, WordOfDayResponse } from '../study';
import { hashCode } from '../study';
import { A1_CITY } from './a1-city';
import { A1_FAMILY } from './a1-family';
import { A1_FOOD } from './a1-food';
import { A1_HOME } from './a1-home';
import { A1_TIME } from './a1-time';
import { A1_WORK } from './a1-work';
import { A2_HEALTH } from './a2-health';
import { A2_SHOPPING } from './a2-shopping';

/** Порядок наборов на экране «Наборы»: сначала простые темы, затем A2. */
export const STUDY_DECKS: StudyDeck[] = [
  A1_FAMILY,
  A1_FOOD,
  A1_HOME,
  A1_CITY,
  A1_WORK,
  A1_TIME,
  A2_HEALTH,
  A2_SHOPPING,
];

/** Все слова наборов вместе с названием набора. */
export const DECK_WORDS: Array<{ deck: StudyDeck; word: DeckWord }> = STUDY_DECKS.flatMap((deck) =>
  deck.words.map((word) => ({ deck, word })),
);

/**
 * Слово дня: одинаковый день — одинаковое слово у всех.
 * Хеш от даты (UTC) даёт стабильный номер, без случайности.
 */
export function wordOfDay(dateKey: string): WordOfDayResponse {
  const index = hashCode(dateKey) % DECK_WORDS.length;
  const entry = DECK_WORDS[index];
  return {
    date: dateKey,
    deckId: entry.deck.id,
    deckTitleKey: entry.deck.titleKey,
    word: entry.word,
  };
}

/** Набор по id — нужен экрану «Наборы» и карточке слова дня. */
export function findDeck(id: string): StudyDeck | undefined {
  return STUDY_DECKS.find((deck) => deck.id === id);
}
