/**
 * POST /api/key-test — проверка ключа пользователя перед сохранением.
 * Ключ передаётся только в этом запросе и нигде не сохраняется на сервере.
 * Общий код проверки — functions/_lib/keytest.ts (его же использует сохранение в аккаунт).
 */
import type { KeyTestResponse } from '../../shared/types';
import type { Env } from '../_lib/env';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { checkProviderKey } from '../_lib/keytest';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const provider = body.provider;
    const key = typeof body.key === 'string' ? body.key.trim() : '';

    if ((provider !== 'gemini' && provider !== 'groq') || !key || key.length > 300) {
      throw new ApiError('VALIDATION', 400);
    }

    const result = await checkProviderKey(provider, key, uiLang);
    const response: KeyTestResponse = {
      ok: result.ok,
      latencyMs: result.latencyMs,
      message: result.message,
    };
    return jsonResponse(response);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
