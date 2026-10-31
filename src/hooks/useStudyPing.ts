/**
 * Счётчики учёбы для админки (этап 6): отправляются один раз за сессию,
 * а не на каждую карточку. Счётчики копятся на странице и уходят при уходе.
 */
import { useCallback, useEffect, useRef } from 'react';
import { api } from '../api/client';

type Counter = 'reviews' | 'exercises';

export function useStudyPing() {
  const pending = useRef<Record<Counter, number>>({ reviews: 0, exercises: 0 });

  const flush = useCallback(() => {
    const { reviews, exercises } = pending.current;
    if (reviews === 0 && exercises === 0) return;
    pending.current = { reviews: 0, exercises: 0 };
    // Ошибка статистики не должна мешать учёбе: просто попробуем позже.
    void api.studyPing({ reviews, exercises }).catch(() => undefined);
  }, []);

  const count = useCallback((kind: Counter, amount = 1) => {
    pending.current[kind] += amount;
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  return { count, flush };
}
