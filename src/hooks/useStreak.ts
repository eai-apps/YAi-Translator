/**
 * Хук для отслеживания серии дней (streak) активности пользователя (переводы + учёба).
 * Хранится в localStorage (yai.activityDays), объединяется с днями учёбы (yai.study.days).
 */
import { useCallback, useState } from 'react';
import type { StudyDay } from '../../shared/study';
import { STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';
import { localDayKey } from '../lib/srs';

const ACTIVITY_DAYS_KEY = 'yai.activityDays';

function calculateCombinedStreak(activityDates: string[], studyDays: StudyDay[], now = Date.now()): {
  streak: number;
  todayActive: boolean;
} {
  const activeSet = new Set<string>(activityDates);
  for (const s of studyDays) {
    if (s.reviews > 0 || s.exercises > 0) {
      activeSet.add(s.day);
    }
  }

  const todayKey = localDayKey(new Date(now));
  const todayActive = activeSet.has(todayKey);

  // Если сегодня ещё нет активности — проверяем вчерашний день, чтобы серия не сбрасывалась до конца дня
  const cursor = new Date(now);
  if (!todayActive) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (activeSet.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak, todayActive };
}

export function useStreak() {
  const [activityDays, setActivityDays] = useState<string[]>(() =>
    readStorage<string[]>(ACTIVITY_DAYS_KEY, []),
  );

  const studyDays = readStorage<StudyDay[]>(STORAGE_KEYS.studyDays, []);

  const { streak, todayActive } = calculateCombinedStreak(activityDays, studyDays);

  const markTodayActivity = useCallback(() => {
    const today = localDayKey(new Date());
    setActivityDays((prev) => {
      if (prev.includes(today)) return prev;
      const updated = [...prev, today].slice(-90); // храним до 90 последних дней
      writeStorage(ACTIVITY_DAYS_KEY, updated);
      return updated;
    });
  }, []);

  return {
    streak,
    todayActive,
    markTodayActivity,
  };
}
