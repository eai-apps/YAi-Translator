/**
 * Интервальное повторение (этап 6) без React: только чистые функции.
 * Упрощённый SM-2: оценки «Не помню / Трудно / Помню / Легко»,
 * интервалы 1 → 3 → 7 → 16 → 35 → 75 … дней. Файл легко проверить скриптом node.
 */
import type { StudyCard, StudyDay, StudyGrade, StudyProgress } from '../../shared/study';
import { STUDY_NEW_PER_DAY_DEFAULT, STUDY_SESSION_MAX, STUDY_STREAK_REVIEWS } from '../../shared/study';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Лестница интервалов в днях; после последней ступени шаг примерно удваивается. */
export const SRS_LADDER = [1, 3, 7, 16, 35, 75, 160, 340] as const;

export const SRS_DEFAULT_EASE = 2.5;
export const SRS_MIN_EASE = 1.3;
export const SRS_MAX_EASE = 3.0;

/** День по местному времени: 2026-10-31 (серия и график считаются по местному дню). */
export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Начало местных суток в миллисекундах. */
export function startOfLocalDay(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Следующая ступень лестницы; после последней — рост в 2,2 раза. */
export function nextInterval(interval: number): number {
  const known = SRS_LADDER.find((step) => step > interval);
  if (known !== undefined) return known;
  return Math.round(Math.max(interval, 1) * 2.2);
}

/** Предыдущая ступень: «Трудно» не двигает карточку вперёд. */
export function previousInterval(interval: number): number {
  let previous: number = SRS_LADDER[0];
  for (const step of SRS_LADDER) {
    if (step < interval) previous = step;
    else break;
  }
  return previous;
}

function clampEase(ease: number): number {
  return Math.min(SRS_MAX_EASE, Math.max(SRS_MIN_EASE, Math.round(ease * 100) / 100));
}

/** Пустой прогресс новой карточки: ещё ни разу не показана. */
export function emptyProgress(cardId: string, now = Date.now()): StudyProgress {
  return {
    cardId,
    ease: SRS_DEFAULT_EASE,
    interval: 0,
    due: now,
    reps: 0,
    lapses: 0,
    introducedAt: 0,
    updatedAt: now,
  };
}

/**
 * Новая оценка после показа карточки.
 * «Не помню» — interval 0 и due = сейчас: карточка вернётся в конце сессии.
 */
export function nextProgress(
  previous: StudyProgress | null,
  cardId: string,
  grade: StudyGrade,
  now = Date.now(),
): StudyProgress {
  const base = previous ?? emptyProgress(cardId, now);
  let ease = base.ease;
  let interval = base.interval;
  let due = now;
  let lapses = base.lapses;

  switch (grade) {
    case 'again':
      ease = clampEase(ease - 0.2);
      interval = 0;
      due = now;
      lapses += 1;
      break;
    case 'hard':
      ease = clampEase(ease - 0.15);
      interval = base.interval === 0 ? SRS_LADDER[0] : previousInterval(base.interval);
      due = now + interval * DAY_MS;
      break;
    case 'good':
      interval = nextInterval(base.interval);
      due = now + interval * DAY_MS;
      break;
    case 'easy':
      ease = clampEase(ease + 0.15);
      interval = nextInterval(nextInterval(base.interval));
      due = now + interval * DAY_MS;
      break;
  }

  return {
    cardId,
    ease,
    interval,
    due,
    reps: base.reps + 1,
    lapses,
    introducedAt: base.introducedAt || now,
    updatedAt: now,
  };
}

/** Карточка ждёт повторения сегодня (просрочена или провалена). */
export function isDue(progress: StudyProgress, now = Date.now()): boolean {
  return progress.due <= now;
}

/** Сколько новых карточек уже введено в местные сутки. */
export function introducedToday(progress: StudyProgress[], now = Date.now()): number {
  const today = localDayKey(new Date(now));
  return progress.filter((item) => item.introducedAt > 0 && localDayKey(new Date(item.introducedAt)) === today).length;
}

/** Одна карточка сессии: слово и его прогресс (у новой карточки прогресс пустой). */
export interface SessionEntry {
  card: StudyCard;
  progress: StudyProgress;
  isNew: boolean;
}

export interface SessionOptions {
  now?: number;
  /** Сколько карточек максимум (по умолчанию STUDY_SESSION_MAX). */
  limit?: number;
  /** Сколько новых слов можно ввести за день. */
  newPerDay?: number;
}

/**
 * Сессия на сегодня: сначала просроченные (по времени), потом новые.
 * Новых — не больше newPerDay с учётом уже введённых сегодня.
 */
export function pickSession(
  cards: StudyCard[],
  progress: StudyProgress[],
  options: SessionOptions = {},
): SessionEntry[] {
  const now = options.now ?? Date.now();
  const limit = Math.max(0, options.limit ?? STUDY_SESSION_MAX);
  const newPerDay = Math.max(0, options.newPerDay ?? STUDY_NEW_PER_DAY_DEFAULT);
  const byId = new Map(progress.map((item) => [item.cardId, item] as const));

  const due: SessionEntry[] = [];
  const fresh: StudyCard[] = [];
  for (const card of cards) {
    const item = byId.get(card.id);
    if (!item) {
      fresh.push(card);
    } else if (isDue(item, now)) {
      due.push({ card, progress: item, isNew: false });
    }
  }
  due.sort((left, right) => left.progress.due - right.progress.due);

  const newLeft = Math.max(0, newPerDay - introducedToday(progress, now));
  const slotsForNew = Math.max(0, Math.min(newLeft, limit - due.length));
  const newEntries = fresh.slice(0, slotsForNew).map((card) => ({
    card,
    progress: emptyProgress(card.id, now),
    isNew: true,
  }));

  return [...due.slice(0, limit), ...newEntries].slice(0, limit);
}

/** Сколько карточек ждёт повторения прямо сейчас. */
export function dueCount(cards: StudyCard[], progress: StudyProgress[], now = Date.now()): number {
  const ids = new Set(cards.map((card) => card.id));
  return progress.filter((item) => ids.has(item.cardId) && isDue(item, now)).length;
}

/** День засчитан: повторено не меньше цели (по умолчанию 10) карточек или сделано упражнение. */
export function isDayComplete(day: StudyDay | undefined, goal = STUDY_STREAK_REVIEWS): boolean {
  if (!day) return false;
  return day.reviews >= goal || day.exercises > 0;
}

/**
 * Серия подряд идущих дней. Сегодняшний незаконченный день серию не рвёт:
 * отсчёт начинается со вчера, пока сегодня не выполнена цель.
 */
export function computeStreak(days: StudyDay[], now = Date.now(), goal = STUDY_STREAK_REVIEWS): number {
  const byDay = new Map(days.map((item) => [item.day, item] as const));
  const complete = (date: Date) => isDayComplete(byDay.get(localDayKey(date)), goal);

  const cursor = new Date(now);
  if (!complete(cursor)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (complete(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface ChartDay {
  day: string;
  reviews: number;
  exercises: number;
}

/** Последние N дней по порядку (старые → новые); пропуски заполняются нулями. */
export function lastDays(days: StudyDay[], count = 7, now = Date.now()): ChartDay[] {
  const byDay = new Map(days.map((item) => [item.day, item] as const));
  const result: ChartDay[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    const key = localDayKey(date);
    const item = byDay.get(key);
    result.push({ day: key, reviews: item?.reviews ?? 0, exercises: item?.exercises ?? 0 });
  }
  return result;
}
