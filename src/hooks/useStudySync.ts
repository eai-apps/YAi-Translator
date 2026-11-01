/**
 * Синхронизация учёбы с аккаунтом (этап 6).
 * Вошёл — при изменении, при входе и раз в минуту: отправляем новое,
 * забираем чужое. Меняется только то, чего нет на сервере или что новее.
 *
 * Отметки отправленного хранятся по видам (карточки, прогресс, дни, списки слов) —
 * как у истории переводов (useHistorySync).
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { StudyCard, StudyDay, StudyList, StudyProgress, StudySyncResponse } from '../../shared/study';
import { api } from '../api/client';
import { STORAGE_KEYS, SYNC_INTERVAL_MS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';
import type { MergeInput } from '../lib/studyMerge';

/** Сколько записей принимает сервер за один запрос (STUDY.maxItemsPerRequest). */
const CHUNK = 200;

type Marks = Record<string, number>;

interface StudyMarks {
  cards: Marks;
  progress: Marks;
  days: Marks;
  /** Списки слов (этап 8Б). */
  lists: Marks;
}

interface Options {
  signedIn: boolean;
  cards: StudyCard[];
  progress: StudyProgress[];
  days: StudyDay[];
  lists: StudyList[];
  onMerge: (payload: MergeInput) => void;
}

function readMarks(): StudyMarks {
  return {
    cards: readStorage<Marks>(STORAGE_KEYS.studyMarksCards, {}),
    progress: readStorage<Marks>(STORAGE_KEYS.studyMarksProgress, {}),
    days: readStorage<Marks>(STORAGE_KEYS.studyMarksDays, {}),
    lists: readStorage<Marks>(STORAGE_KEYS.studyMarksLists, {}),
  };
}

function writeMarks(marks: StudyMarks): void {
  writeStorage(STORAGE_KEYS.studyMarksCards, marks.cards);
  writeStorage(STORAGE_KEYS.studyMarksProgress, marks.progress);
  writeStorage(STORAGE_KEYS.studyMarksDays, marks.days);
  writeStorage(STORAGE_KEYS.studyMarksLists, marks.lists);
}

export function useStudySync({ signedIn, cards, progress, days, lists, onMerge }: Options) {
  const marks = useRef<StudyMarks>(readMarks());
  const latest = useRef({ cards, progress, days, lists, onMerge });
  latest.current = { cards, progress, days, lists, onMerge };
  const running = useRef(false);

  // Подпись меняется при любой правке — это повод синхронизироваться.
  const signature = useMemo(
    () =>
      [
        ...cards.map((card) => `c${card.id}:${card.updatedAt}`),
        ...progress.map((item) => `p${item.cardId}:${item.updatedAt}`),
        ...days.map((item) => `d${item.day}:${item.updatedAt}:${item.reviews}:${item.exercises}`),
        ...lists.map((list) => `l${list.id}:${list.updatedAt}`),
      ].join('|'),
    [cards, progress, days, lists],
  );

  const sync = useCallback(async () => {
    if (!signedIn || running.current) return;
    running.current = true;
    try {
      const current = latest.current;
      const changedCards = current.cards.filter((card) => marks.current.cards[card.id] !== card.updatedAt);
      const changedProgress = current.progress.filter((item) => marks.current.progress[item.cardId] !== item.updatedAt);
      const changedDays = current.days.filter((item) => marks.current.days[item.day] !== item.updatedAt);
      const changedLists = current.lists.filter((list) => marks.current.lists[list.id] !== list.updatedAt);
      const since = Number(readStorage<number>(STORAGE_KEYS.studySyncSince, 0)) || 0;

      let serverTime = 0;
      for (let round = 0; ; round += 1) {
        const chunk = {
          cards: changedCards.slice(round * CHUNK, (round + 1) * CHUNK),
          progress: changedProgress.slice(round * CHUNK, (round + 1) * CHUNK),
          days: changedDays.slice(round * CHUNK, (round + 1) * CHUNK),
          lists: changedLists.slice(round * CHUNK, (round + 1) * CHUNK),
        };
        const empty = !chunk.cards.length && !chunk.progress.length && !chunk.days.length && !chunk.lists.length;
        if (round > 0 && empty) break;

        // Первый запрос забирает чужие изменения; следующие — только конфликты по нашим id.
        const response: StudySyncResponse = await api.studySync({
          since: round === 0 ? since : Date.now(),
          ...chunk,
        });
        if (round === 0) serverTime = response.serverTime;
        current.onMerge(response);

        for (const card of chunk.cards) marks.current.cards[card.id] = card.updatedAt;
        for (const item of chunk.progress) marks.current.progress[item.cardId] = item.updatedAt;
        for (const item of chunk.days) marks.current.days[item.day] = item.updatedAt;
        for (const list of chunk.lists) marks.current.lists[list.id] = list.updatedAt;
        writeMarks(marks.current);

        if (empty) break;
        const more =
          changedCards.length > (round + 1) * CHUNK ||
          changedProgress.length > (round + 1) * CHUNK ||
          changedDays.length > (round + 1) * CHUNK ||
          changedLists.length > (round + 1) * CHUNK;
        if (!more) break;
      }

      if (serverTime) {
        writeStorage(STORAGE_KEYS.studySyncSince, serverTime);
        writeStorage(STORAGE_KEYS.lastSyncTime, Date.now());
        window.dispatchEvent(new CustomEvent('yai:sync-success', { detail: { time: Date.now() } }));
      }
    } catch {
      // Сеть пропала — следующая минута повторит обмен сама.
    } finally {
      running.current = false;
    }
  }, [signedIn]);

  // После выхода отправленное забываем: новый вход начинает с полного обмена.
  useEffect(() => {
    if (signedIn) return;
    marks.current = { cards: {}, progress: {}, days: {}, lists: {} };
    writeMarks(marks.current);
    writeStorage(STORAGE_KEYS.studySyncSince, 0);
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const onSyncNow = () => void sync();
    window.addEventListener('yai:sync-now', onSyncNow);
    return () => window.removeEventListener('yai:sync-now', onSyncNow);
  }, [signedIn, sync]);

  // Небольшая задержка: во время сессии оценки идут подряд, один запрос лучше пяти.
  useEffect(() => {
    if (!signedIn) return;
    const timer = window.setTimeout(() => void sync(), 800);
    return () => window.clearTimeout(timer);
  }, [signedIn, signature, sync]);

  useEffect(() => {
    if (!signedIn) return;
    const timer = window.setInterval(() => void sync(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [signedIn, sync]);
}
