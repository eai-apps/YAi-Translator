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

interface RawModelItem {
  id?: string;
  pricing?: { prompt?: string | number; completion?: string | number };
}

interface ParsedModel {
  id: string;
  priceIn?: number;
  priceOut?: number;
  slow: boolean;
}

function parseOpenAiModels(data: unknown): ParsedModel[] {
  const list = (data && typeof data === 'object' && Array.isArray((data as { data?: unknown[] }).data))
    ? (data as { data: RawModelItem[] }).data
    : Array.isArray(data) ? (data as RawModelItem[]) : [];

  const result: ParsedModel[] = [];
  for (const m of list) {
    if (typeof m?.id !== 'string' || !m.id) continue;
    const id = m.id;
    const lower = id.toLowerCase();
    const notChat = /(embed|moderation|tts|whisper|dall-e|image|audio|realtime)/.test(lower);
    if (notChat) continue;

    const pIn = m.pricing?.prompt !== undefined ? Number(m.pricing.prompt) * 1_000_000 : undefined;
    const pOut = m.pricing?.completion !== undefined ? Number(m.pricing.completion) * 1_000_000 : undefined;
    const slow = /(pro|opus|o1|reasoning|-thinking|r1)/.test(lower);
    result.push({ id, priceIn: pIn, priceOut: pOut, slow });
  }

  return result.sort((a, b) => (a.priceIn ?? 999) - (b.priceIn ?? 999));
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    await ensureSchema(context.env);

    const rows = await context.env.DB?.prepare('SELECT * FROM paid_connections ORDER BY created_at ASC')
      .all<PaidConnectionRow>();

    const connections = (rows?.results ?? []).map((r) => {
      let models: EnabledModelInfo[] = [];
      try { models = JSON.parse(r.enabled_models || '[]'); } catch { models = []; }
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

    const [order, regOnly, dailyLimit, monthlyLimit] = await Promise.all([
      readSetting<'free_first' | 'paid_first' | 'paid_off'>(context.env, SETTINGS_KEYS.paidAiOrder),
      readSetting<boolean>(context.env, SETTINGS_KEYS.paidAiRegisteredOnly),
      readSetting<number>(context.env, SETTINGS_KEYS.paidDailyTokenLimit),
      readSetting<number>(context.env, SETTINGS_KEYS.paidMonthlyTokenLimit),
    ]);

    return jsonResponse({
      connections,
      order: order ?? 'free_first',
      regOnly: regOnly ?? true,
      dailyLimit: dailyLimit ?? 50_000,
      monthlyLimit: monthlyLimit ?? 1_000_000,
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

    // Форма в админке шлёт action 'save' и поле apiKey — принимаем оба варианта (исправление Claude, 0.9.3).
    if (action === 'add' || action === 'save') {
      const baseUrl = String(body.baseUrl || '').trim().replace(/\/$/, '');
      const key = String(body.key || body.apiKey || '').trim();
      const picked = Array.isArray(body.models)
        ? body.models.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 20)
        : [];
      const defaultModel = String(body.defaultModel || picked[0] || '').trim();
      const name = String(body.name || '').trim() || defaultModel;
      const enabledModels = JSON.stringify(
        (picked.length > 0 ? picked : defaultModel ? [defaultModel] : []).map((id) => ({ id, enabled: true })),
      );

      if (!name || !baseUrl || !key || !defaultModel) throw new ApiError('VALIDATION', 400);
      if (!validatePaidBaseUrl(baseUrl)) throw new ApiError('VALIDATION', 400);

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

      // Ошибку сервиса показываем в админке как есть (код и начало ответа) — так понятно, что не так с ключом.
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
      let apiKey = String(body.key || '').trim();
      const model = String(body.model || '').trim();

      if (body.id) {
        const row = await context.env.DB?.prepare('SELECT * FROM paid_connections WHERE id = ?').bind(body.id).first<PaidConnectionRow>();
        if (row) {
          baseUrl = row.base_url;
          apiKey = await decryptKey(context.env, row.ciphertext, row.iv, `site:paid:${row.id}`);
        }
      }

      if (!baseUrl || !apiKey || !model || !validatePaidBaseUrl(baseUrl)) throw new ApiError('VALIDATION', 400);

      const start = Date.now();
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Translate to Russian: Hello' }],
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
    }

    throw new ApiError('VALIDATION', 400);
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
