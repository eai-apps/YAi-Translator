/**
 * GET /api/ai-models — нейросети сайта для списка «Быстрый перевод ▾» (0.9.3, Claude).
 * Только названия моделей, без ключей и адресов. regOnly — модели доступны после входа.
 */
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';
import { ensureSchema } from '../_lib/schema';
import { readSetting, SETTINGS_KEYS } from '../_lib/settings';

interface Row {
  id: string;
  default_model: string;
  enabled_models: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    if (!env.DB) return jsonResponse({ models: [], regOnly: true });
    await ensureSchema(env);
    const order = (await readSetting<string>(env, SETTINGS_KEYS.paidAiOrder)) ?? 'free_first';
    const regOnly = (await readSetting<boolean>(env, SETTINGS_KEYS.paidAiRegisteredOnly)) ?? true;
    if (order === 'paid_off') return jsonResponse({ models: [], regOnly });

    const rows = await env.DB.prepare('SELECT id, default_model, enabled_models FROM paid_connections ORDER BY created_at ASC').all<Row>();
    const models: Array<{ id: string; model: string }> = [];
    for (const row of rows.results ?? []) {
      let list: Array<{ id?: string; enabled?: boolean }> = [];
      try {
        list = JSON.parse(row.enabled_models || '[]');
      } catch {
        list = [];
      }
      const enabled = list.filter((item) => item.enabled && typeof item.id === 'string').map((item) => item.id as string);
      for (const model of enabled.length > 0 ? enabled : row.default_model ? [row.default_model] : []) {
        models.push({ id: `${row.id}|${model}`, model });
      }
    }
    return jsonResponse({ models: models.slice(0, 30), regOnly });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
