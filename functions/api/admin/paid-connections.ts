/**
 * Управление платными подключениями нейросетей сайта (OpenAI-совместимые API) в админке.
 */
import type { Env } from '../../_lib/env';
import { requireAdmin } from '../../_lib/admin/require';
import { ApiError, errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { ensureSchema } from '../../_lib/schema';
import { encryptKey, decryptKey, keyLast4 } from '../../_lib/auth/crypto';
import { readSetting, writeSetting, SETTINGS_KEYS } from '../../_lib/settings';
import { validatePaidBaseUrl } from '../../_lib/providers/paid';
import type { PaidConnectionRow, EnabledModelInfo } from '../../_lib/paid/manager';
import { executeModelTest, loadModelStatesMap, parseOpenAiModels, recordModelState } from '../../_lib/paid/modelTester';
import type { PaidModelOption } from '../../../shared/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    await ensureSchema(context.env);

    const [rows, stateMap, defaultId, order, regOnly, dailyLimit, monthlyLimit] = await Promise.all([
      context.env.DB?.prepare('SELECT * FROM paid_connections ORDER BY created_at ASC').all<PaidConnectionRow>(),
      loadModelStatesMap(context.env),
      readSetting<string>(context.env, SETTINGS_KEYS.paidDefaultModel),
      readSetting<'free_first' | 'paid_first' | 'paid_off'>(context.env, SETTINGS_KEYS.paidAiOrder),
      readSetting<boolean>(context.env, SETTINGS_KEYS.paidAiRegisteredOnly),
      readSetting<number>(context.env, SETTINGS_KEYS.paidDailyTokenLimit),
      readSetting<number>(context.env, SETTINGS_KEYS.paidMonthlyTokenLimit),
    ]);

    const connections = (rows?.results ?? []).map((r) => {
      let rawModels: EnabledModelInfo[] = [];
      try { rawModels = JSON.parse(r.enabled_models || '[]'); } catch { rawModels = []; }
      const models: PaidModelOption[] = rawModels.map((item) => {
        const state = stateMap.get(`${r.id}|${item.id}`);
        return {
          id: item.id,
          enabled: item.enabled ?? true,
          priceIn: item.priceIn,
          priceOut: item.priceOut,
          isSlowOrExpensive: item.isSlowOrExpensive,
          ok: state ? state.ok : null,
          latencyMs: state?.latencyMs ?? null,
          reply: state?.reply ?? null,
          error: state?.error ?? null,
          checkedAt: state?.checkedAt ?? null,
        };
      });
      return {
        id: r.id,
        name: r.name,
        baseUrl: r.base_url,
        mask: `••••${r.last4}`,
        defaultModel: r.default_model,
        models,
        createdAt: r.created_at,
      };
    });

    return jsonResponse({
      connections,
      order: order ?? 'free_first',
      regOnly: regOnly ?? true,
      dailyLimit: dailyLimit ?? 50_000,
      monthlyLimit: monthlyLimit ?? 1_000_000,
      defaultId: defaultId ?? null,
    });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    const body = await readJsonBody(context.request);
    const action = String(body.action || '');

    if (action === 'add' || action === 'save') {
      const baseUrl = String(body.baseUrl || '').trim().replace(/\/$/, '');
      const key = String(body.key || body.apiKey || '').trim();
      const picked = Array.isArray(body.models)
        ? body.models.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 30)
        : [];
      const defaultModel = String(body.defaultModel || picked[0] || '').trim();
      const name = String(body.name || '').trim() || defaultModel;
      const enabledModels = JSON.stringify(
        (picked.length > 0 ? picked : defaultModel ? [defaultModel] : []).map((id) => ({ id, enabled: true })),
      );

      if (!name || !baseUrl || !key || !defaultModel || !validatePaidBaseUrl(baseUrl)) {
        throw new ApiError('VALIDATION', 400);
      }

      const id = crypto.randomUUID();
      const { ciphertext, iv } = await encryptKey(context.env, key, `site:paid:${id}`);
      await context.env.DB?.prepare(
        `INSERT INTO paid_connections (id, name, base_url, ciphertext, iv, last4, default_model, enabled_models, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(id, name, baseUrl, ciphertext, iv, keyLast4(key), defaultModel, enabledModels, Date.now(), Date.now())
        .run();

      return jsonResponse({ ok: true, id });
    }

    if (action === 'delete') {
      const id = String(body.id || '');
      await context.env.DB?.prepare('DELETE FROM paid_connections WHERE id = ?').bind(id).run();
      await context.env.DB?.prepare('DELETE FROM paid_model_state WHERE connection_id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }

    if (action === 'update-models') {
      const id = String(body.id || '');
      const defaultModel = String(body.defaultModel || '').trim();
      const models = Array.isArray(body.models) ? JSON.stringify(body.models) : '[]';
      await context.env.DB?.prepare(
        'UPDATE paid_connections SET default_model = ?, enabled_models = ?, updated_at = ? WHERE id = ?',
      )
        .bind(defaultModel, models, Date.now(), id)
        .run();
      return jsonResponse({ ok: true });
    }

    if (action === 'set-default') {
      const value = String(body.value || '').trim();
      await writeSetting(context.env, SETTINGS_KEYS.paidDefaultModel, value);
      return jsonResponse({ ok: true, defaultId: value });
    }

    if (action === 'update-settings') {
      if (body.order !== undefined) await writeSetting(context.env, SETTINGS_KEYS.paidAiOrder, body.order);
      if (body.regOnly !== undefined) await writeSetting(context.env, SETTINGS_KEYS.paidAiRegisteredOnly, Boolean(body.regOnly));
      if (body.dailyLimit !== undefined) await writeSetting(context.env, SETTINGS_KEYS.paidDailyTokenLimit, Number(body.dailyLimit));
      if (body.monthlyLimit !== undefined) await writeSetting(context.env, SETTINGS_KEYS.paidMonthlyTokenLimit, Number(body.monthlyLimit));
      return jsonResponse({ ok: true });
    }

    if (action === 'fetch-models') {
      let baseUrl = String(body.baseUrl || '').trim().replace(/\/$/, '');
      let apiKey = String(body.key || body.apiKey || '').trim();

      if (body.id) {
        const row = await context.env.DB?.prepare('SELECT * FROM paid_connections WHERE id = ?').bind(body.id).first<PaidConnectionRow>();
        if (row) {
          baseUrl = row.base_url;
          apiKey = await decryptKey(context.env, row.ciphertext, row.iv, `site:paid:${row.id}`);
        }
      }

      if (!baseUrl || !apiKey || !validatePaidBaseUrl(baseUrl)) throw new ApiError('VALIDATION', 400);

      try {
        const resp = await fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json', 'User-Agent': 'YAi-Translator/1.0' },
          signal: AbortSignal.timeout(15_000),
        });
        const raw = await resp.text();
        if (!resp.ok) return jsonResponse({ models: [], error: `HTTP ${resp.status}: ${raw.slice(0, 160)}` });
        const models = parseOpenAiModels(JSON.parse(raw));
        return jsonResponse(models.length > 0 ? { models } : { models, error: raw.slice(0, 160) || 'empty' });
      } catch (fetchError) {
        return jsonResponse({ models: [], error: fetchError instanceof Error ? fetchError.message : String(fetchError) });
      }
    }

    if (action === 'credits') {
      let apiKey = String(body.key || '').trim();
      if (body.id) {
        const row = await context.env.DB?.prepare('SELECT * FROM paid_connections WHERE id = ?').bind(body.id).first<PaidConnectionRow>();
        if (row) apiKey = await decryptKey(context.env, row.ciphertext, row.iv, `site:paid:${row.id}`);
      }
      if (!apiKey) throw new ApiError('VALIDATION', 400);

      const resp = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8_000),
      });
      if (!resp.ok) return jsonResponse({ credits: null });
      const data = (await resp.json()) as { data?: { total_credits?: number; total_usage?: number } };
      const balance = data?.data?.total_credits !== undefined
        ? (data.data.total_credits - (data.data.total_usage ?? 0)).toFixed(2)
        : null;
      return jsonResponse({ credits: balance });
    }

    if (action === 'test') {
      let baseUrl = String(body.baseUrl || '').trim().replace(/\/$/, '');
      let apiKey = String(body.key || body.apiKey || '').trim();
      let model = String(body.model || '').trim();
      const connId = body.id ? String(body.id) : undefined;

      if (connId) {
        const row = await context.env.DB?.prepare('SELECT * FROM paid_connections WHERE id = ?').bind(connId).first<PaidConnectionRow>();
        if (row) {
          baseUrl = row.base_url;
          apiKey = await decryptKey(context.env, row.ciphertext, row.iv, `site:paid:${row.id}`);
          model ||= row.default_model;
        }
      }

      if (!baseUrl || !apiKey || !model || !validatePaidBaseUrl(baseUrl)) throw new ApiError('VALIDATION', 400);

      const res = await executeModelTest(baseUrl, apiKey, model);
      if (connId) {
        await recordModelState(context.env, {
          connectionId: connId,
          model: res.model,
          ok: res.ok,
          latencyMs: res.latencyMs,
          reply: res.reply,
          error: res.error,
        });
      }

      return jsonResponse({
        ok: res.ok,
        model: res.model,
        latencyMs: res.latencyMs,
        reply: res.reply,
        error: res.error,
        status: res.status,
      });
    }

    throw new ApiError('VALIDATION', 400);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
