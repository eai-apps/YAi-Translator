/**
 * GET /api/word-of-day — одно слово дня на всех (этап 6).
 * Выбирается детерминированно из shared/decks, поэтому ответ можно кэшировать
 * до конца суток по UTC: повторные запросы в один день вернут то же слово.
 */
import type { WordOfDayResponse } from '../../shared/types';
import { utcDayKey } from '../../shared/study';
import { wordOfDay } from '../../shared/decks';
import { readCache, writeCache } from '../_lib/cache';
import { STUDY } from '../_lib/config';
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';

/** Секунды до 00:00 UTC: столько живёт запись кэша. */
function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(STUDY.wordOfDayTtlSeconds, Math.floor((midnight - now.getTime()) / 1000));
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const date = utcDayKey();
    const key = `study|word-of-day|${date}`;

    const cached = await readCache<WordOfDayResponse>(env, key);
    if (cached && cached.date === date && cached.word) return jsonResponse(cached);

    const body = wordOfDay(date);
    await writeCache(env, key, 'study', body, secondsUntilUtcMidnight());
    return jsonResponse(body);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
