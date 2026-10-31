/**
 * Слово дня (этап 6): одно на всех, приходит с сервера и кэшируется до конца дня.
 * Крестик скрывает карточку до завтра — выбор хранится в localStorage.
 */
import { useCallback, useEffect, useState } from 'react';
import type { WordOfDayResponse } from '../../shared/types';
import { utcDayKey } from '../../shared/study';
import { api } from '../api/client';
import { STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';

import { useLocalStorage } from './useLocalStorage';

/** Флаг «пользователь уже ответил на слово дня», чтобы не вычитать цель дня повторно. */
const WORD_ANSWERED_KEY = 'study.wordOfDayAnswered';

export function useWordOfDay() {
  const [data, setData] = useState<WordOfDayResponse | null>(null);
  const [closed, setClosed] = useState(() => readStorage<string>(STORAGE_KEYS.studyWordOfDayClosed, '') === utcDayKey());
  const [answered, setAnswered] = useLocalStorage<string>(WORD_ANSWERED_KEY, '');

  useEffect(() => {
    const controller = new AbortController();
    api
      .wordOfDay(controller.signal)
      .then((response) => {
        setData(response);
        // Новый день — карточка снова видна, даже если вчера её закрыли.
        setClosed(readStorage<string>(STORAGE_KEYS.studyWordOfDayClosed, '') === response.date);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const close = useCallback(() => {
    writeStorage(STORAGE_KEYS.studyWordOfDayClosed, utcDayKey());
    setClosed(true);
  }, []);

  /** Было ли сегодняшнее слово дня уже добавлено или выставлено на повторение. */
  const answeredToday = Boolean(data) && answered === data?.date;
  const markAnswered = useCallback(() => {
    if (data) setAnswered(data.date);
  }, [data, setAnswered]);

  return { data, closed, close, answeredToday, markAnswered };
}
