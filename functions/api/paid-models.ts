/**
 * POST /api/paid-models — загрузка списка моделей по Base URL и API-ключу (для настройки в профиле).
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

    if (!baseUrl || !apiKey) throw new ApiError('VALIDATION', 400);
    if (!validatePaidBaseUrl(baseUrl)) throw new ApiError('VALIDATION', 400);

    const resp = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) {
      throw new ApiError('KEY_NO_ACCESS', resp.status === 401 || resp.status === 403 ? 401 : 400);
    }

    const data = (await resp.json()) as { data?: Array<{ id?: string; pricing?: { prompt?: string | number } }> };
    const rawList: Array<{ id?: string; pricing?: { prompt?: string | number } }> =
      Array.isArray(data?.data) ? data.data : Array.isArray(data) ? (data as Array<{ id?: string; pricing?: { prompt?: string | number } }>) : [];

    const models: Array<{ id: string; priceIn?: number; slow: boolean }> = [];
    for (const m of rawList) {
      if (typeof m?.id !== 'string' || !m.id) continue;
      const id = m.id;
      const lower = id.toLowerCase();
      if (/(embed|moderation|tts|whisper|dall-e|image|audio|realtime)/.test(lower)) continue;
      const pIn = m.pricing?.prompt !== undefined ? Number(m.pricing.prompt) * 1_000_000 : undefined;
      const slow = /(pro|opus|o1|reasoning|-thinking|r1)/.test(lower);
      models.push({ id, priceIn: pIn, slow });
    }

    models.sort((a, b) => (a.priceIn ?? 999) - (b.priceIn ?? 999));

    return jsonResponse({ models });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
