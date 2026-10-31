/**
 * POST /api/study/sync — обмен карточками, прогрессом и днями учёбы (этап 6).
 * Тело: { since, cards?, progress?, days? }. Ответ: итоговое состояние пользователя,
 * время сервера для следующего since и список карточек, удалённых по лимиту 3000.
 * Без входа карточки живут только в localStorage — этот адрес не вызывается.
 */
import type { StudySyncResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { requireSession } from '../../_lib/auth/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { syncStudy } from '../../_lib/study/store';
import { parseSyncRequest } from '../../_lib/study/validate';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    const session = await requireSession(env, context.request);
    if (!env.DB) throw new ApiError('INTERNAL', 500);

    const body = await readJsonBody(context.request);
    const data = parseSyncRequest(body);
    const response: StudySyncResponse = await syncStudy(
      env,
      session.userId,
      data.since,
      data.cards,
      data.progress,
      data.days,
      data.lists,
    );
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
