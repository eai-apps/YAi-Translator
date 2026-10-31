/**
 * Изменение карточек и прогресса учёбы (этап 6) — часть StudyProvider.
 * Здесь и только здесь меняются данные: добавление снимков, удаление,
 * оценка после показа и ответ на упражнение. Хук возвращает готовые функции,
 * а состояние и запись в localStorage остаются в useStudy.tsx.
 */
import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { StudyCard, StudyCardInput, StudyGrade, StudyProgress } from '../../shared/study';
import { STUDY_MAX_CARDS, studyCardId } from '../../shared/study';
import { isValidStudyInput } from '../lib/studyCard';
import type { StudyState } from '../lib/studyMerge';
import { localDayKey, nextProgress } from '../lib/srs';

/** Прибавляет единицу к сегодняшнему дню; старые дни не трогает. */
function bumpDay(days: StudyState['days'], counter: 'reviews' | 'exercises', now: number): StudyState['days'] {
  const key = localDayKey(new Date(now));
  const existing = days.find((item) => item.day === key);
  const next = {
    day: key,
    reviews: (existing?.reviews ?? 0) + (counter === 'reviews' ? 1 : 0),
    exercises: (existing?.exercises ?? 0) + (counter === 'exercises' ? 1 : 0),
    updatedAt: now,
  };
  return [next, ...days.filter((item) => item.day !== key)];
}

/** Сравнивает снимок без служебных полей: повторное добавление не должно плодить записи. */
function sameSnapshot(card: StudyCard, input: StudyCardInput): boolean {
  return (
    card.article === input.article &&
    card.plural === input.plural &&
    card.partOfSpeech === input.partOfSpeech &&
    card.perfekt === input.perfekt &&
    JSON.stringify(card.translations) === JSON.stringify(input.translations) &&
    JSON.stringify(card.example) === JSON.stringify(input.example)
  );
}

interface Options {
  stateRef: MutableRefObject<StudyState>;
  commit: (next: StudyState) => void;
}

export function useStudyActions({ stateRef, commit }: Options) {
  const addCards = useCallback(
    (inputs: StudyCardInput[]) => {
      const previous = stateRef.current;
      const cards = new Map(previous.cards.map((card) => [card.id, card] as const));
      const now = Date.now();
      let added = 0;
      let changed = false;

      for (const input of inputs) {
        if (!isValidStudyInput(input)) continue;
        const id = studyCardId(input.lemma);
        const existing = cards.get(id);

        if (existing) {
          // Снимок обновляем, но addedAt и прогресс сохраняем.
          if (!sameSnapshot(existing, input)) {
            cards.set(id, { ...existing, ...input, id, lang: 'de', updatedAt: now });
            changed = true;
          }
          continue;
        }
        if (cards.size >= STUDY_MAX_CARDS) break;
        cards.set(id, { ...input, id, lang: 'de', addedAt: now, updatedAt: now });
        added += 1;
        changed = true;
      }

      if (changed) commit({ ...previous, cards: Array.from(cards.values()) });
      return added;
    },
    [commit, stateRef],
  );

  const addCard = useCallback((input: StudyCardInput) => addCards([input]) > 0, [addCards]);

  const removeCard = useCallback(
    (cardId: string) => {
      const previous = stateRef.current;
      if (!previous.cards.some((card) => card.id === cardId)) return;
      commit({
        cards: previous.cards.filter((card) => card.id !== cardId),
        progress: previous.progress.filter((item) => item.cardId !== cardId),
        days: previous.days,
      });
    },
    [commit, stateRef],
  );

  /** Новая оценка: интервал по srs.ts, плюс счётчик дня (повторение или упражнение). */
  const applyGrade = useCallback(
    (cardId: string, grade: StudyGrade, counter: 'reviews' | 'exercises') => {
      const previous = stateRef.current;
      if (!previous.cards.some((card) => card.id === cardId)) return;
      const now = Date.now();
      const before = previous.progress.find((item) => item.cardId === cardId) ?? null;
      const updated: StudyProgress = nextProgress(before, cardId, grade, now);
      commit({
        cards: previous.cards,
        progress: [...previous.progress.filter((item) => item.cardId !== cardId), updated],
        days: bumpDay(previous.days, counter, now),
      });
    },
    [commit, stateRef],
  );

  const grade = useCallback((cardId: string, value: StudyGrade) => applyGrade(cardId, value, 'reviews'), [applyGrade]);

  const recordExercise = useCallback(
    (cardId: string, correct: boolean) => applyGrade(cardId, correct ? 'good' : 'again', 'exercises'),
    [applyGrade],
  );

  return { addCard, addCards, removeCard, grade, recordExercise };
}
