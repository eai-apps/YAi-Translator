/**
 * POST /api/paid-test — проверка платной модели (Hallo → ru) по ключу пользователя.
 */
import type { Env } from '../_lib/env';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../_lib/http';
import { validatePaidBaseUrl } from '../_lib/providers/paid';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const body = await readJsonBody(context.request);
    const baseUrl = String(body.baseUrl || '').trim().replace(/\/$/, '');
    const apiKey = String(body.apiKey || '').trim();
    const model = String(body.model || '').trim();

    if (!baseUrl || !apiKey || !model) throw new ApiError('VALIDATION', 400);
    if (!validatePaidBaseUrl(baseUrl)) throw new ApiError('VALIDATION', 400);

    const start = Date.now();
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Translate to Russian: Hallo' }],
        max_tokens: 30,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    const latencyMs = Date.now() - start;
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return jsonResponse({ ok: false, status: resp.status, message: errText.slice(0, 150), latencyMs });
    }

    return jsonResponse({ ok: true, latencyMs });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
