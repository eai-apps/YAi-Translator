/**
 * Хранение карточек, прогресса и дней учёбы в D1 (этап 6).
 * Логика как у /api/sync: побеждает запись с большим updated_at.
 * Дни не удаляются: счётчики объединяются по максимуму — так два устройства
 * не затирают прогресс друг друга и не удваивают числа.
 */
import type { StudyCard, StudyDay, StudyProgress, StudySyncResponse } from '../../../shared/types';
import { STUDY } from '../config';
import type { Env } from '../env';
import { readStudyState } from './read';
import { ID_CHUNK, placeholders } from './rows';
import { ensureSchema } from '../schema';

/** Пишет присланное и удаляет лишнее, если карточек больше лимита. */
async function saveIncoming(
  env: Env,
  userId: string,
  cards: StudyCard[],
  progress: StudyProgress[],
  days: StudyDay[],
): Promise<string[]> {
  const cardStatements = cards.map((card) =>
    env.DB!.prepare(
      `INSERT INTO study_cards (user_id, card_id, payload, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, card_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
       WHERE excluded.updated_at > study_cards.updated_at`,
    ).bind(userId, card.id, JSON.stringify({ ...card, id: undefined, updatedAt: undefined }), card.updatedAt),
  );
  if (cardStatements.length) await env.DB!.batch(cardStatements);

  const progressStatements = progress.map((item) =>
    env.DB!.prepare(
      `INSERT INTO study_progress
         (user_id, card_id, ease, interval, due, reps, lapses, introduced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, card_id) DO UPDATE SET
         ease = excluded.ease, interval = excluded.interval, due = excluded.due,
         reps = excluded.reps, lapses = excluded.lapses,
         introduced_at = excluded.introduced_at, updated_at = excluded.updated_at
       WHERE excluded.updated_at > study_progress.updated_at`,
    ).bind(
      userId,
      item.cardId,
      item.ease,
      item.interval,
      item.due,
      item.reps,
      item.lapses,
      item.introducedAt,
      item.updatedAt,
    ),
  );
  if (progressStatements.length) await env.DB!.batch(progressStatements);

  const dayStatements = days.map((item) =>
    env.DB!.prepare(
      `INSERT INTO study_days (user_id, day, reviews, exercises, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, day) DO UPDATE SET
         reviews = MAX(study_days.reviews, excluded.reviews),
         exercises = MAX(study_days.exercises, excluded.exercises),
         updated_at = MAX(study_days.updated_at, excluded.updated_at)`,
    ).bind(userId, item.day, item.reviews, item.exercises, item.updatedAt),
  );
  if (dayStatements.length) await env.DB!.batch(dayStatements);

  return trimToLimit(env, userId);
}

/** Если карточек больше STUDY.maxCardsPerUser — удаляем самые старые вместе с прогрессом. */
async function trimToLimit(env: Env, userId: string): Promise<string[]> {
  const count = await env.DB!.prepare('SELECT COUNT(*) AS total FROM study_cards WHERE user_id = ?')
    .bind(userId)
    .first<{ total: number }>();
  const extra = (count?.total ?? 0) - STUDY.maxCardsPerUser;
  if (extra <= 0) return [];

  const rows = await env.DB!.prepare(
    'SELECT card_id FROM study_cards WHERE user_id = ? ORDER BY updated_at ASC LIMIT ?',
  )
    .bind(userId, extra)
    .all<{ card_id: string }>();
  const removed = (rows.results ?? []).map((row) => row.card_id);
  if (removed.length === 0) return [];

  // D1 не принимает больше 100 параметров в запросе — удаляем группами по 90 id.
  const statements: D1PreparedStatement[] = [];
  for (let start = 0; start < removed.length; start += ID_CHUNK) {
    const part = removed.slice(start, start + ID_CHUNK);
    const partMarks = placeholders(part.length);
    statements.push(
      env.DB!.prepare(`DELETE FROM study_cards WHERE user_id = ? AND card_id IN (${partMarks})`).bind(userId, ...part),
      env.DB!.prepare(`DELETE FROM study_progress WHERE user_id = ? AND card_id IN (${partMarks})`).bind(userId, ...part),
    );
  }
  await env.DB!.batch(statements);
  return removed;
}

/** Сохраняет присланное и отдаёт итоговое состояние учёбы пользователя. */
export async function syncStudy(
  env: Env,
  userId: string,
  since: number,
  cards: StudyCard[],
  progress: StudyProgress[],
  days: StudyDay[],
): Promise<StudySyncResponse> {
  await ensureSchema(env);
  const removed = await saveIncoming(env, userId, cards, progress, days);
  const state = await readStudyState(
    env,
    userId,
    since,
    cards.map((card) => card.id),
    progress.map((item) => item.cardId),
  );
  return { ...state, serverTime: Date.now(), removed };
}
