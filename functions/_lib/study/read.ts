/**
 * Чтение учёбы из D1 (этап 6): карточки, прогресс и дни пользователя.
 * Отдельный файл, потому что запись (store.ts) и чтение легко проверять по отдельности.
 * D1 не принимает больше 100 параметров в одном запросе — списки id читаем порциями.
 */
import type { StudyCard, StudySyncResponse } from '../../../shared/types';
import { STUDY } from '../config';
import type { Env } from '../env';
import { ID_CHUNK, placeholders, toCard, toDay, toProgress } from './rows';
import type { CardRow, DayRow, ProgressRow } from './rows';

/** Карточки по списку id — порциями, чтобы не упереться в лимит параметров. */
async function readCardsByIds(env: Env, userId: string, cardIds: string[]): Promise<CardRow[]> {
  const rows: CardRow[] = [];
  for (let start = 0; start < cardIds.length; start += ID_CHUNK) {
    const part = cardIds.slice(start, start + ID_CHUNK);
    const result = await env.DB!.prepare(
      `SELECT card_id, payload, updated_at FROM study_cards WHERE user_id = ? AND card_id IN (${placeholders(part.length)})`,
    )
      .bind(userId, ...part)
      .all<CardRow>();
    rows.push(...(result.results ?? []));
  }
  return rows;
}

/** Прогресс по списку id — тоже порциями. */
async function readProgressByIds(env: Env, userId: string, cardIds: string[]): Promise<ProgressRow[]> {
  const rows: ProgressRow[] = [];
  for (let start = 0; start < cardIds.length; start += ID_CHUNK) {
    const part = cardIds.slice(start, start + ID_CHUNK);
    const result = await env.DB!.prepare(
      `SELECT card_id, ease, interval, due, reps, lapses, introduced_at, updated_at
       FROM study_progress WHERE user_id = ? AND card_id IN (${placeholders(part.length)})`,
    )
      .bind(userId, ...part)
      .all<ProgressRow>();
    rows.push(...(result.results ?? []));
  }
  return rows;
}

/**
 * Записи новее since (их нет на устройстве) плюс всё, что только что прислали:
 * так устройство видит конфликт и забирает более новую версию с сервера.
 */
export async function readStudyState(
  env: Env,
  userId: string,
  since: number,
  cardIds: string[],
  progressIds: string[],
): Promise<Pick<StudySyncResponse, 'cards' | 'progress' | 'days'>> {
  const newerCards = await env.DB!.prepare(
    'SELECT card_id, payload, updated_at FROM study_cards WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC',
  )
    .bind(userId, since)
    .all<CardRow>();
  const sentCards = await readCardsByIds(env, userId, cardIds);
  const cards = new Map<string, CardRow>();
  for (const row of [...(newerCards.results ?? []), ...sentCards]) cards.set(row.card_id, row);

  const newerProgress = await env.DB!.prepare(
    `SELECT card_id, ease, interval, due, reps, lapses, introduced_at, updated_at
     FROM study_progress WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`,
  )
    .bind(userId, since)
    .all<ProgressRow>();
  const sentProgress = await readProgressByIds(env, userId, progressIds);
  const progress = new Map<string, ProgressRow>();
  for (const row of [...(newerProgress.results ?? []), ...sentProgress]) progress.set(row.card_id, row);

  // Дней немного (не больше maxDayRows): отдаём все, объединение по максимуму считает клиент.
  const dayRows = await env.DB!.prepare(
    'SELECT day, reviews, exercises, updated_at FROM study_days WHERE user_id = ? ORDER BY day DESC LIMIT ?',
  )
    .bind(userId, STUDY.maxDayRows)
    .all<DayRow>();

  return {
    cards: Array.from(cards.values())
      .map(toCard)
      .filter((card): card is StudyCard => card !== null),
    progress: Array.from(progress.values()).map(toProgress),
    days: (dayRows.results ?? []).map(toDay),
  };
}
