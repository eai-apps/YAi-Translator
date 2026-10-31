/**
 * POST /api/study/ping — счётчики учёбы для админки (этап 6).
 * Клиент отправляет один раз за сессию: сколько карточек повторено и сколько
 * упражнений сделано. Пишется в stats_daily: study_reviews / study_exercises.
 */
import type { Env } from '../../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { addTo } from '../../_lib/stats';
import { parsePingRequest } from '../../_lib/study/validate';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const { reviews, exercises } = parsePingRequest(body);
    // Ошибка статистики не должна мешать учёбе: addTo сам глотает сбои базы.
    await addTo(context.env, 'study_reviews', reviews);
    await addTo(context.env, 'study_exercises', exercises);
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
