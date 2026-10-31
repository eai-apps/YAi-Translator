/**
 * Проверка платных моделей и сохранение их состояния в D1 (таблица paid_model_state).
 */
import type { Env } from '../env';
import { validatePaidBaseUrl } from '../providers/paid';
import type { PaidModelOption } from '../../../shared/types';

export interface RawModelItem {
  id?: string;
  pricing?: { prompt?: string | number; completion?: string | number };
}

export function parseOpenAiModels(data: unknown): PaidModelOption[] {
  const list = (data && typeof data === 'object' && Array.isArray((data as { data?: unknown[] }).data))
    ? (data as { data: RawModelItem[] }).data
    : Array.isArray(data) ? (data as RawModelItem[]) : [];

  const result: PaidModelOption[] = [];
  for (const m of list) {
    if (typeof m?.id !== 'string' || !m.id) continue;
    const id = m.id;
    const lower = id.toLowerCase();
    if (/(embed|moderation|tts|whisper|dall-e|image|audio|realtime)/.test(lower)) continue;

    const pIn = m.pricing?.prompt !== undefined ? Number(m.pricing.prompt) * 1_000_000 : undefined;
    const pOut = m.pricing?.completion !== undefined ? Number(m.pricing.completion) * 1_000_000 : undefined;
    const isSlowOrExpensive = /(pro|opus|o1|reasoning|-thinking|r1)/.test(lower);
    result.push({ id, enabled: false, priceIn: pIn, priceOut: pOut, isSlowOrExpensive });
  }

  return result.sort((a, b) => (a.priceIn ?? 999) - (b.priceIn ?? 999));
}

export interface ModelStateRow {
  connection_id: string;
  model: string;
  ok: number;
  latency_ms: number | null;
  reply: string | null;
  error: string | null;
  checked_at: number;
}

export interface ModelTestResult {
  ok: boolean;
  model: string;
  latencyMs?: number;
  reply?: string;
  error?: string;
  status?: number;
}

export async function recordModelState(
  env: Env,
  data: {
    connectionId: string;
    model: string;
    ok: boolean;
    latencyMs?: number | null;
    reply?: string | null;
    error?: string | null;
  },
): Promise<void> {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO paid_model_state (connection_id, model, ok, latency_ms, reply, error, checked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (connection_id, model) DO UPDATE SET
         ok = excluded.ok,
         latency_ms = excluded.latency_ms,
         reply = excluded.reply,
         error = excluded.error,
         checked_at = excluded.checked_at`,
    )
      .bind(
        data.connectionId,
        data.model,
        data.ok ? 1 : 0,
        data.latencyMs ?? null,
        data.reply ?? null,
        data.error ?? null,
        Date.now(),
      )
      .run();
  } catch (err) {
    console.warn('Не удалось сохранить статус модели в paid_model_state:', err);
  }
}

export async function loadModelStatesMap(
  env: Env,
): Promise<Map<string, { ok: boolean; latencyMs: number | null; reply: string | null; error: string | null; checkedAt: number }>> {
  const map = new Map();
  if (!env.DB) return map;
  try {
    const rows = await env.DB.prepare('SELECT * FROM paid_model_state').all<ModelStateRow>();
    for (const r of rows.results ?? []) {
      map.set(`${r.connection_id}|${r.model}`, {
        ok: r.ok === 1,
        latencyMs: r.latency_ms,
        reply: r.reply,
        error: r.error,
        checkedAt: r.checked_at,
      });
    }
  } catch (err) {
    console.warn('Не удалось прочитать paid_model_state:', err);
  }
  return map;
}

export async function executeModelTest(
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<ModelTestResult> {
  if (!baseUrl || !apiKey || !model || !validatePaidBaseUrl(baseUrl)) {
    return { ok: false, model, error: 'Validation failed' };
  }

  const start = Date.now();
  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'YAi-Translator/1.0',
      },
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
      return {
        ok: false,
        model,
        status: resp.status,
        error: `HTTP ${resp.status}: ${errText.slice(0, 150)}`,
        latencyMs,
      };
    }

    const answer = (await resp.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string } }>;
    } | null;
    const reply = answer?.choices?.[0]?.message?.content?.slice(0, 80) ?? '';
    return { ok: true, model, latencyMs, reply };
  } catch (fetchErr) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      model,
      error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      latencyMs,
    };
  }
}
