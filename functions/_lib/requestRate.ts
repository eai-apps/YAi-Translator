/** Атомарный счётчик коротких окон, в базе только хеш адреса и назначения. */
import type { Env } from './env';
import { ensureSchema } from './schema';
import { sha256Hex } from './utils';

export async function allowRequest(env: Env, scope: string, ip: string, limit: number): Promise<boolean> {
  if (!env.DB) return true;
  await ensureSchema(env);
  const key = await sha256Hex(`yai:rate:${scope}:${ip}`);
  const minute = Math.floor(Date.now() / 60_000) * 60_000;
  const result = await env.DB.prepare(`INSERT INTO login_attempts (ip_hash, window_start, attempts) VALUES (?, ?, 1)
    ON CONFLICT(ip_hash, window_start) DO UPDATE SET attempts = attempts + 1 RETURNING attempts`)
    .bind(key, minute).first<{ attempts: number }>();
  if (Math.random() < 0.01) await env.DB.prepare('DELETE FROM login_attempts WHERE window_start < ?').bind(minute - 86_400_000).run();
  return (result?.attempts ?? limit + 1) <= limit;
}
