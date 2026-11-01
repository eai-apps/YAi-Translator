/**
 * Готовые наборы слов (этап 6, часть 16): немецкие и английские темы + топ-500.
 * Слово дня выбирается из этого же списка (A1-A2 de с примером).
 */
import type { DeckWord, StudyDeck, WordOfDayResponse } from '../study';
import { hashCode } from '../study';

import { A1_FAMILY } from './a1-family';
import { A1_FOOD } from './a1-food';
import { A1_HOME } from './a1-home';
import { A1_CITY } from './a1-city';
import { A1_WORK } from './a1-work';
import { A1_TIME } from './a1-time';
import { A2_HEALTH } from './a2-health';
import { A2_SHOPPING } from './a2-shopping';
import { A2_AMT } from './a2-amt';
import { A2_ARZT } from './a2-arzt';
import { A2_WOHNUNG } from './a2-wohnung';
import { A2_BANK } from './a2-bank';
import { A2_SCHULE } from './a2-schule';
import { A2_KLEIDUNG } from './a2-kleidung';
import { B1_JOBCENTER } from './b1-jobcenter';
import { B1_VERKEHR } from './b1-verkehr';
import { B1_WETTER } from './b1-wetter';
import { B1_FREIZEIT } from './b1-freizeit';
import { DE_TOP500 } from './de-top500';
import { EN_A1_FAMILY } from './en-a1-family';
import { EN_A1_FOOD } from './en-a1-food';
import { EN_A1_HOME } from './en-a1-home';
import { EN_A1_CITY } from './en-a1-city';
import { EN_A1_WORK } from './en-a1-work';
import { EN_A1_TIME } from './en-a1-time';
import { EN_A2_HEALTH } from './en-a2-health';
import { EN_A2_SHOPPING } from './en-a2-shopping';
import { EN_A2_TRAVEL } from './en-a2-travel';
import { EN_A2_AIRPORT } from './en-a2-airport';
import { EN_A2_HOTEL } from './en-a2-hotel';
import { EN_B1_IT } from './en-b1-it';
import { EN_TOP500 } from './en-top500';

/** Все доступные готовые наборы (немецкие и английские темы A1–B1 и топ-500). */
export const STUDY_DECKS: StudyDeck[] = [
  A1_FAMILY,
  A1_FOOD,
  A1_HOME,
  A1_CITY,
  A1_WORK,
  A1_TIME,
  A2_HEALTH,
  A2_SHOPPING,
  A2_AMT,
  A2_ARZT,
  A2_WOHNUNG,
  A2_BANK,
  A2_SCHULE,
  A2_KLEIDUNG,
  B1_JOBCENTER,
  B1_VERKEHR,
  B1_WETTER,
  B1_FREIZEIT,
  DE_TOP500,
  EN_A1_FAMILY,
  EN_A1_FOOD,
  EN_A1_HOME,
  EN_A1_CITY,
  EN_A1_WORK,
  EN_A1_TIME,
  EN_A2_HEALTH,
  EN_A2_SHOPPING,
  EN_A2_TRAVEL,
  EN_A2_AIRPORT,
  EN_A2_HOTEL,
  EN_B1_IT,
  EN_TOP500,
];

/**
 * Слова для «Слова дня»: отбираются стабильные немецкие слова A1–A2 с примером.
 */
export const DECK_WORDS: Array<{ deck: StudyDeck; word: DeckWord }> = STUDY_DECKS
  .filter((d) => (!d.lang || d.lang === 'de') && d.id !== 'de-top500' && (d.level === 'A1' || d.level === 'A2'))
  .flatMap((deck) =>
    deck.words
      .filter((w) => Boolean(w.example?.text && w.example?.translation))
      .map((word) => ({ deck, word })),
  );

/**
 * Слово дня: одинаковый день — одинаковое слово у всех.
 * Хеш от даты (UTC) даёт стабильный номер, без случайности.
 */
export function wordOfDay(dateKey: string): WordOfDayResponse {
  const index = Math.abs(hashCode(dateKey)) % DECK_WORDS.length;
  const entry = DECK_WORDS[index];
  return {
    date: dateKey,
    deckId: entry.deck.id,
    deckTitleKey: entry.deck.titleKey,
    word: entry.word,
    level: entry.deck.level,
  };
}

/** Набор по id — нужен экранам и карточкам. */
export function findDeck(id: string): StudyDeck | undefined {
  return STUDY_DECKS.find((deck) => deck.id === id);
}
