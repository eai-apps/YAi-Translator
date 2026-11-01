import { beforeAll, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { onRequestPost as register } from '../functions/api/auth/register';
import { onRequestPost as login } from '../functions/api/auth/login';
import { onRequestGet as me } from '../functions/api/auth/me';
import { onRequestPost as removeAccount } from '../functions/api/auth/delete';
import { onRequestGet as pull, onRequestPut as push } from '../functions/api/sync';
import { onRequestPost as studySync } from '../functions/api/study/sync';
import { ensureSchema } from '../functions/_lib/schema';
import { allowRequest } from '../functions/_lib/requestRate';
import type { Env } from '../functions/_lib/env';

// Настоящий SQLite: исполняем те же SQL, что используются в D1.
const sqlite = new DatabaseSync(':memory:');
const wrap = (sql: string, values: any[] = []): any => ({
  bind: (...args: any[]) => wrap(sql, args),
  async run() { const result = sqlite.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
  async first(column?: string) { const found = sqlite.prepare(sql).get(...values) ?? null; return column && found ? found[column] : found; },
  async all() { return { results: sqlite.prepare(sql).all(...values), success: true }; },
});
const env: Env = { DB: { prepare: (sql: string) => wrap(sql), batch: async (statements: any[]) => {
  sqlite.exec('BEGIN');
  try { const result = []; for (const stmt of statements) result.push(await stmt.run()); sqlite.exec('COMMIT'); return result; }
  catch (error) { sqlite.exec('ROLLBACK'); throw error; }
} } as any };

function context(path: string, method: string, body?: unknown, token?: string): any {
  return { env, request: new Request(`https://app.test${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }) };
}
beforeAll(() => ensureSchema(env));

describe('API integration: bearer sessions, sync and account deletion', () => {
  it('registers, signs in without cookies, syncs EN metadata, merges by timestamp and deletes linked data', async () => {
    const registration = await register(context('/api/auth/register', 'POST', { login: 'audit-user', password: 'audit-only-password' }));
    expect(registration.status).toBe(200);
    const account = await registration.json() as any;
    expect(typeof account.token).toBe('string');
    const signIn = await login(context('/api/auth/login', 'POST', { login: 'audit-user', password: 'audit-only-password' }));
    expect(signIn.status).toBe(200);
    const token = (await signIn.json() as any).token;
    expect((await me(context('/api/auth/me', 'GET', undefined, token))).status).toBe(200);

    const item = { id: 'history-example', payload: JSON.stringify({ text: 'house', translation: 'дом' }), updatedAt: 300, deleted: false };
    expect((await push(context('/api/sync', 'PUT', { items: [item] }, token))).status).toBe(200);
    await push(context('/api/sync', 'PUT', { items: [{ ...item, payload: 'older', updatedAt: 100 }] }, token));
    const pulled = await (await pull(context('/api/sync?since=0', 'GET', undefined, token))).json() as any;
    expect(pulled.items.find((v: any) => v.id === item.id).payload).toBe(item.payload);

    const card = { id: 'en:house', lemma: 'house', lang: 'en', deckId: 'en-a1-home', article: null, plural: 'houses', partOfSpeech: 'noun', translations: ['дом'], example: null, perfekt: null, addedAt: 300, updatedAt: 300 };
    const study = await studySync(context('/api/study/sync', 'POST', { since: 0, cards: [card] }, token));
    expect(study.status).toBe(200);
    const saved = await study.json() as any;
    expect(saved.cards[0].lang).toBe('en');
    expect(saved.cards[0].deckId).toBe('en-a1-home');

    const userId = sqlite.prepare('SELECT id FROM users WHERE login = ?').get('audit-user')!.id;
    const seed = sqlite.prepare('INSERT INTO user_items (user_id, item_id, payload, updated_at, deleted) VALUES (?, ?, ?, ?, 0)');
    for (let index = 0; index < 2999; index++) seed.run(userId, `bulk-${index}`, '{}', 50);
    const overLimit = await push(context('/api/sync', 'PUT', { items: [{ ...item, id: 'over-limit' }] }, token));
    expect(overLimit.status).toBe(400);
    expect(sqlite.prepare('SELECT count(*) AS n FROM user_items').get()?.n).toBe(3000);

    expect((await removeAccount(context('/api/auth/delete', 'POST', { password: 'wrong-password' }, token))).status).toBe(401);
    expect((await removeAccount(context('/api/auth/delete', 'POST', { password: 'audit-only-password' }, token))).status).toBe(200);
    for (const table of ['users', 'sessions', 'user_keys', 'user_items', 'study_cards', 'study_progress', 'study_days', 'study_lists']) {
      expect(sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n).toBe(0);
    }
    expect((await me(context('/api/auth/me', 'GET', undefined, token))).status).toBe(401);
  });
  it('enforces the short-window rate limit with independent hashed scopes', async () => {
    expect(await allowRequest(env, 'audit-errors', 'test-ip', 2)).toBe(true);
    expect(await allowRequest(env, 'audit-errors', 'test-ip', 2)).toBe(true);
    expect(await allowRequest(env, 'audit-errors', 'test-ip', 2)).toBe(false);
    expect(await allowRequest(env, 'audit-check', 'test-ip', 2)).toBe(true);
  });
});
