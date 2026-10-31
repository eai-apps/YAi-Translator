/**
 * GET /api/ai-models — нейросети сайта для списка «Быстрый перевод ▾» (0.9.3, Claude).
 * Только названия моделей, без ключей и адресов. regOnly — модели доступны после входа.
 * defaultId — модель сайта по умолчанию (0.10.0, Antigravity).
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

interface StateRow {
  connection_id: string;
  model: string;
  ok: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const env = context.env;
    if (!env.DB) return jsonResponse({ models: [], regOnly: true, defaultId: null });
    await ensureSchema(env);
    const [order, regOnly, defaultId] = await Promise.all([
      readSetting<string>(env, SETTINGS_KEYS.paidAiOrder),
      readSetting<boolean>(env, SETTINGS_KEYS.paidAiRegisteredOnly),
      readSetting<string>(env, SETTINGS_KEYS.paidDefaultModel),
    ]);
    const isRegOnly = regOnly ?? true;
    if (order === 'paid_off') return jsonResponse({ models: [], regOnly: isRegOnly, defaultId: null });

    const [rows, stateRows] = await Promise.all([
      env.DB.prepare('SELECT id, default_model, enabled_models FROM paid_connections ORDER BY created_at ASC').all<Row>(),
      env.DB.prepare('SELECT connection_id, model, ok FROM paid_model_state').all<StateRow>(),
    ]);

    const stateMap = new Map<string, boolean>();
    for (const s of stateRows.results ?? []) {
      stateMap.set(`${s.connection_id}|${s.model}`, s.ok === 1);
    }

    const models: Array<{ id: string; model: string; ok: boolean | null }> = [];
    for (const row of rows.results ?? []) {
      let list: Array<{ id?: string; enabled?: boolean }> = [];
      try {
        list = JSON.parse(row.enabled_models || '[]');
      } catch {
        list = [];
      }
      const enabled = list.filter((item) => item.enabled && typeof item.id === 'string').map((item) => item.id as string);
      for (const model of enabled.length > 0 ? enabled : row.default_model ? [row.default_model] : []) {
        const fullId = `${row.id}|${model}`;
        const hasState = stateMap.has(fullId);
        models.push({
          id: fullId,
          model,
          ok: hasState ? (stateMap.get(fullId) ?? null) : null,
        });
      }
    }
    return jsonResponse({
      models: models.slice(0, 30),
      regOnly: isRegOnly,
      defaultId: defaultId || null,
    });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
