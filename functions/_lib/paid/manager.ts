/**
 * Управление общими платными подключениями нейросетей, лимитами токенов и бюджетом.
 */
import type { Env } from '../env';
import { ensureSchema } from '../schema';
import { readSetting, SETTINGS_KEYS } from '../settings';
import { decryptKey } from '../auth/crypto';
import { describeError } from '../utils';

export interface PaidConnectionRow {
  id: string;
  name: string;
  base_url: string;
  ciphertext: string;
  iv: string;
  last4: string;
  default_model: string;
  enabled_models: string;
  created_at: number;
  updated_at: number;
}

export interface EnabledModelInfo {
  id: string;
  enabled: boolean;
  priceIn?: number;
  priceOut?: number;
}

export interface SharedPaidModelAttempt {
  connectionId: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_DAILY_TOKEN_LIMIT = 50_000;
const DEFAULT_MONTHLY_TOKEN_LIMIT = 1_000_000;

export async function getPaidTokensUsage(env: Env): Promise<{ today: number; month: number }> {
  if (!env.DB) return { today: 0, month: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  try {
    await ensureSchema(env);
    const todayRow = await env.DB.prepare(
      "SELECT value FROM stats_daily WHERE day = ? AND metric = 'paid_tokens'",
    )
      .bind(today)
      .first<{ value: number }>();

    const monthRows = await env.DB.prepare(
      "SELECT SUM(value) as total FROM stats_daily WHERE day LIKE ? AND metric = 'paid_tokens'",
    )
      .bind(`${monthPrefix}-%`)
      .first<{ total: number | null }>();

    return {
      today: todayRow?.value ?? 0,
      month: monthRows?.total ?? 0,
    };
  } catch (error) {
    console.warn('Не удалось получить статистику токенов:', describeError(error));
    return { today: 0, month: 0 };
  }
}

export async function recordPaidTokens(env: Env, tokens: number): Promise<void> {
  if (!env.DB || tokens <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    await ensureSchema(env);
    await env.DB.prepare(
      `INSERT INTO stats_daily (day, metric, value) VALUES (?, 'paid_tokens', ?)
       ON CONFLICT(day, metric) DO UPDATE SET value = value + excluded.value`,
    )
      .bind(today, tokens)
      .run();
  } catch (error) {
    console.warn('Ошибка записи paid_tokens:', describeError(error));
  }
}

export async function getUsableSharedPaidModels(
  env: Env,
  isRegistered: boolean,
): Promise<{ order: 'free_first' | 'paid_first' | 'paid_off'; models: SharedPaidModelAttempt[] }> {
  if (!env.DB) return { order: 'paid_off', models: [] };

  const order = (await readSetting<'free_first' | 'paid_first' | 'paid_off'>(
    env,
    SETTINGS_KEYS.paidAiOrder,
  )) ?? 'free_first';

  if (order === 'paid_off') {
    return { order, models: [] };
  }

  const regOnly = (await readSetting<boolean>(env, SETTINGS_KEYS.paidAiRegisteredOnly)) ?? true;
  if (regOnly && !isRegistered) {
    return { order, models: [] };
  }

  const dailyLimit =
    (await readSetting<number>(env, SETTINGS_KEYS.paidDailyTokenLimit)) ??
    DEFAULT_DAILY_TOKEN_LIMIT;
  const monthlyLimit =
    (await readSetting<number>(env, SETTINGS_KEYS.paidMonthlyTokenLimit)) ??
    DEFAULT_MONTHLY_TOKEN_LIMIT;

  const usage = await getPaidTokensUsage(env);
  if (usage.today >= dailyLimit || usage.month >= monthlyLimit) {
    return { order, models: [] };
  }

  try {
    await ensureSchema(env);
    const rows = await env.DB.prepare('SELECT * FROM paid_connections ORDER BY created_at ASC').all<PaidConnectionRow>();
    if (!rows.results || rows.results.length === 0) {
      return { order, models: [] };
    }

    const stateRows = await env.DB.prepare(
      "SELECT key_id, invalid, exhausted_until FROM key_state WHERE provider = 'paid'",
    ).all<{ key_id: string; invalid: number; exhausted_until: number | null }>();

    const badKeys = new Set<string>();
    const now = Date.now();
    for (const r of stateRows.results ?? []) {
      if (r.invalid === 1 || (r.exhausted_until && r.exhausted_until > now)) {
        badKeys.add(r.key_id);
      }
    }

    const models: SharedPaidModelAttempt[] = [];
    for (const row of rows.results) {
      if (badKeys.has(row.id)) continue;

      let key: string;
      try {
        key = await decryptKey(env, row.ciphertext, row.iv, `site:paid:${row.id}`);
      } catch {
        continue;
      }

      let parsedModels: EnabledModelInfo[] = [];
      try {
        parsedModels = JSON.parse(row.enabled_models || '[]');
      } catch {
        parsedModels = [];
      }

      const active = parsedModels.filter((m) => m.enabled);
      if (active.length > 0) {
        for (const m of active) {
          models.push({
            connectionId: row.id,
            name: row.name,
            baseUrl: row.base_url,
            apiKey: key,
            model: m.id,
          });
        }
      } else if (row.default_model) {
        models.push({
          connectionId: row.id,
          name: row.name,
          baseUrl: row.base_url,
          apiKey: key,
          model: row.default_model,
        });
      }
    }

    return { order, models };
  } catch (error) {
    console.warn('Ошибка выборки платных нейросетей:', describeError(error));
    return { order, models: [] };
  }
}
