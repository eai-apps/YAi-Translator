/**
 * Текст темы справочника: при первом открытии один раз просим ИИ и сохраняем навсегда в D1.
 * Все следующие показы берутся из базы, ИИ не тратится.
 *
 * Одновременные первые открытия одной темы не тратят ИИ дважды: на время генерации
 * ставится короткая блокировка в таблице кэша (2 минуты). Если ИИ недоступен
 * (лимит или ошибка), генерация не начинается — тема показывает ссылки и «Повторить позже».
 */
import type { GrammarBody, GrammarTopicResponse, UiLanguage } from '../../../shared/types';
import { grammarTopicLinks } from '../../../shared/grammarLinks';
import { GRAMMAR } from '../config';
import type { Env } from '../env';
import { ApiError } from '../http';
import { readCache, writeCache } from '../cache';
import { describeError } from '../utils';
import { buildGrammarPrompt } from '../prompts';
import { runJsonTask } from '../router';
import { createLimitGuard } from '../usage';
import { validateGrammar } from '../validate';
import { bump } from '../stats';
import type { UserKeys } from '../router';
import { parseBody, saveTopicBody, toSummary } from './store';
import type { GrammarRow } from './store';

/** Сколько ждём, пока другой запрос сгенерирует ту же тему. */
const LOCK_TTL_SECONDS = 120;
/** Немецкий и английский текст темы хранится 5 лет (по сути навсегда). */
const TRANSLATED_BODY_TTL_SECONDS = 5 * 365 * 24 * 60 * 60;

async function readLock(env: Env, slug: string): Promise<boolean> {
  return (await readCache<{ locked: boolean }>(env, `grammar:lock:${slug}`)) !== null;
}

/** Причина, по которой тема осталась без текста. */
export function reasonOf(error: unknown): 'limit' | 'error' {
  return error instanceof ApiError && error.code === 'LIMIT_REACHED' ? 'limit' : 'error';
}

export interface LoadTopicOptions {
  env: Env;
  row: GrammarRow;
  uiLang: UiLanguage;
  userKeys: UserKeys;
  signal: AbortSignal;
  clientIp: string;
}

/** Результат: готовая тема или тема без текста с причиной. */
export type LoadTopicResult = Pick<GrammarTopicResponse, 'body' | 'source' | 'offlineReason'>;

/** Возвращает текст темы, при необходимости составляя его ИИ. */
export async function loadTopicBody(options: LoadTopicOptions): Promise<LoadTopicResult> {
  const { env, row, uiLang, userKeys, signal, clientIp } = options;
  // Русский текст — основной: живёт в grammar_topics.body_json и правится в админке.
  // Немецкий и английский интерфейс получают свой текст, тоже один раз, — в таблице кэша надолго.
  // Иначе тема навсегда осталась бы на языке того, кто открыл её первым.
  const translatedKey = uiLang === 'ru' ? null : `grammar:body:${uiLang}:${row.slug}`;
  if (translatedKey) {
    const cachedBody = await readCache<GrammarBody>(env, translatedKey);
    if (cachedBody) return { body: { ...cachedBody, links: grammarTopicLinks(row.slug) }, source: 'ai', offlineReason: null };
  } else {
    const stored = parseBody(row);
    if (stored) return { body: stored, source: row.source === 'admin' ? 'admin' : 'ai', offlineReason: null };
  }

  const lockSlug = `${uiLang}:${row.slug}`;
  // Другой запрос уже генерирует эту тему — текст появится через минуту.
  if (await readLock(env, lockSlug)) {
    return { body: null, source: 'none', offlineReason: 'error' };
  }

  const lockKey = `grammar:lock:${lockSlug}`;
  await writeCache(env, lockKey, 'grammar', { locked: true }, LOCK_TTL_SECONDS);

  try {
    const prompt = buildGrammarPrompt({
      slug: row.slug,
      titleDe: row.title_de || row.slug,
      titleRu: row.title_ru || row.slug,
      titleEn: row.title_en || row.slug,
      level: row.level,
      uiLang,
    });
    const { data } = await runJsonTask<GrammarBody>({
      env,
      prompt,
      userKeys,
      signal,
      // Личный ключ пользователя идёт первым и лимит не тратит — как в переводе.
      beforeShared: createLimitGuard(env, clientIp),
      validate: (raw) => validateGrammar(raw, row.slug),
    });
    const body: GrammarBody = { ...data, links: grammarTopicLinks(row.slug) };
    if (translatedKey) await writeCache(env, translatedKey, 'grammar', body, TRANSLATED_BODY_TTL_SECONDS);
    else await saveTopicBody(env, row.slug, body, 'ai', null);
    void bump(env, ['grammar_generated', 'ai_requests', 'total']);
    return { body, source: 'ai', offlineReason: null };
  } catch (error) {
    console.warn(`Тема «${row.slug}» не составлена:`, describeError(error));
    return { body: null, source: 'none', offlineReason: reasonOf(error) };
  } finally {
    // Блокировку снимаем в любом случае: следующая попытка не должна ждать две минуты.
    if (env.DB) {
      await env.DB.prepare('DELETE FROM cache WHERE key = ?').bind(lockKey).run().catch(() => undefined);
    }
  }
}

/** Полная тема для страницы и всплывающего окна. */
export function topicResponse(
  row: GrammarRow,
  loaded: LoadTopicResult,
): GrammarTopicResponse {
  return {
    ...toSummary(row),
    filled: loaded.body !== null,
    body: loaded.body,
    source: loaded.source,
    offlineReason: loaded.offlineReason,
    links: grammarTopicLinks(row.slug),
  };
}

/** Сколько символов у текста темы — защита базы от огромного ответа модели. */
export function bodyFits(body: GrammarBody): boolean {
  return JSON.stringify(body).length <= GRAMMAR.maxBodyChars;
}
