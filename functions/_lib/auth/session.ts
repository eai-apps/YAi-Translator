/**
 * Сессии входа. Токен — 32 случайных байта, в базе лежит только SHA-256 от него.
 * Срок 90 дней; продлевается при входе и при обращении к API.
 * Токен приходит либо в cookie yai_session (сайт), либо в Authorization: Bearer (приложения).
 */
import { AUTH } from '../config';
import type { Env } from '../env';
import { ensureSchema } from '../schema';
import { describeError, sha256Hex } from '../utils';
import { randomHex } from './password';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Если до конца сессии меньше суток, продлеваем её — активный пользователь не вылетает. */
const RENEW_THRESHOLD_MS = 1 * DAY_MS;

export interface SessionRow {
  token_hash: string;
  user_id: string;
  device: string | null;
  created_at: number;
  last_seen_at: number;
  expires_at: number;
}

export interface ActiveSession {
  tokenHash: string;
  userId: string;
  device: string;
  expiresAt: number;
}

/** Пишет токен в cookie, доступный только серверу и только по HTTPS. */
export function sessionCookie(token: string, maxAgeSeconds: number): string {
  return [
    `${AUTH.cookieName}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

/** Удаление cookie при выходе. */
export function clearSessionCookie(): string {
  return `${AUTH.cookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/** SHA-256 от токена в hex — именно это лежит в таблице sessions. */
export function hashToken(token: string): Promise<string> {
  return sha256Hex(token);
}

function readCookie(request: Request, name: string): string {
  const header = request.headers.get('cookie');
  if (!header) return '';
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return '';
}

/** Токен из cookie или из заголовка Authorization. */
export function readSessionToken(request: Request): string {
  const authorization = request.headers.get('authorization') ?? '';
  const bearer = /^Bearer\s+(.+)$/i.exec(authorization);
  if (bearer) return bearer[1].trim();
  return readCookie(request, AUTH.cookieName);
}

/** Создаёт сессию и возвращает токен (hex: безопасен для cookie и заголовка). */
export async function createSession(
  env: Env,
  userId: string,
  device: string,
): Promise<{ token: string; tokenHash: string; expiresAt: number }> {
  if (!env.DB) throw new Error('D1 недоступна — сессия не создана');
  await ensureSchema(env);

  const token = randomHex(AUTH.tokenBytes);
  const tokenHash = await hashToken(token);
  const now = Date.now();
  const expiresAt = now + AUTH.sessionDays * DAY_MS;

  await env.DB.prepare(
    `INSERT INTO sessions (token_hash, user_id, device, created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(tokenHash, userId, device, now, now, expiresAt)
    .run();

  return { token, tokenHash, expiresAt };
}

/** Находит живую сессию по токену. Просроченную запись удаляет и возвращает null. */
export async function findSession(env: Env, token: string): Promise<ActiveSession | null> {
  if (!env.DB || !token) return null;
  try {
    await ensureSchema(env);
    const tokenHash = await hashToken(token);
    const row = await env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ? LIMIT 1')
      .bind(tokenHash)
      .first<SessionRow>();
    if (!row) return null;

    const now = Date.now();
    if (row.expires_at <= now) {
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
      return null;
    }

    // Продлеваем только пореже, чтобы не писать в базу на каждый запрос.
    if (row.expires_at - now < RENEW_THRESHOLD_MS) {
      const nextExpires = now + AUTH.sessionDays * DAY_MS;
      await env.DB.prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?')
        .bind(now, nextExpires, tokenHash)
        .run();
      return { tokenHash, userId: row.user_id, device: row.device ?? '', expiresAt: nextExpires };
    }

    return { tokenHash, userId: row.user_id, device: row.device ?? '', expiresAt: row.expires_at };
  } catch (error) {
    console.warn('Проверка сессии не удалась:', describeError(error));
    return null;
  }
}

/** Выход с одного устройства. */
export async function deleteSession(env: Env, tokenHash: string): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

/** Выход со всех устройств; keepTokenHash оставляет текущее устройство залогиненным. */
export async function deleteUserSessions(
  env: Env,
  userId: string,
  keepTokenHash?: string,
): Promise<void> {
  if (!env.DB) return;
  if (keepTokenHash) {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?')
      .bind(userId, keepTokenHash)
      .run();
  } else {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  }
}

/** Список сессий пользователя: свежие первыми. */
export async function listSessions(env: Env, userId: string): Promise<SessionRow[]> {
  if (!env.DB) return [];
  const result = await env.DB.prepare(
    'SELECT * FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY last_seen_at DESC LIMIT ?',
  )
    .bind(userId, Date.now(), AUTH.maxSessionsListed)
    .all<SessionRow>();
  return result.results ?? [];
}
