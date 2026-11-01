/**
 * Вечный склад готовых карточек слов (этап 15Б, версия 0.17.5).
 * Таблица `word_cards` в D1: карточки сохраняются навсегда, выдаются без лимита ИИ.
 */
import type { ProviderId, WordCard, WordResponse } from '../../shared/types';
import type { Env } from './env';
import { ensureSchema } from './schema';

export function normalizeStoreWord(word: string): string {
  return word.trim().toLowerCase();
}

/** Получение карточки из постоянного склада */
export async function getStoredWordCard(
  env: Env,
  lemma: string,
  lang: string,
  explainLang: string,
): Promise<WordResponse | null> {
  if (!env.DB) return null;
  await ensureSchema(env);

  const clean = normalizeStoreWord(lemma);
  if (!clean) return null;

  try {
    const row = await env.DB.prepare(
      `SELECT card_json, provider FROM word_cards
       WHERE lower(lemma) = ? AND lang = ? AND explain_lang = ?
       LIMIT 1`,
    )
      .bind(clean, lang, explainLang)
      .first<{ card_json: string; provider: string }>();

    if (!row || !row.card_json || row.provider === 'dict') return null;
    const card = JSON.parse(row.card_json) as WordCard;
    return {
      card,
      provider: (row.provider || 'gemini') as ProviderId,
      cached: true,
    };
  } catch (err) {
    console.warn(`[wordStore] Ошибка чтения карточки ${lemma} (${lang}->${explainLang}):`, err);
    return null;
  }
}

/** Сохранение карточки в постоянный склад */
export async function saveStoredWordCard(
  env: Env,
  lemma: string,
  lang: string,
  explainLang: string,
  card: WordCard,
  provider: ProviderId | string,
): Promise<void> {
  if (!env.DB) return;
  await ensureSchema(env);

  const clean = normalizeStoreWord(lemma);
  if (!clean) return;

  const now = Math.floor(Date.now() / 1000);
  const cardJson = JSON.stringify(card);

  try {
    await env.DB.prepare(
      `INSERT INTO word_cards (lemma, lang, explain_lang, card_json, provider, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(lemma, lang, explain_lang) DO UPDATE SET
         card_json = excluded.card_json,
         provider = excluded.provider,
         updated_at = excluded.updated_at`,
    )
      .bind(clean, lang, explainLang, cardJson, provider, now)
      .run();
  } catch (err) {
    console.warn(`[wordStore] Ошибка сохранения карточки ${lemma} (${lang}->${explainLang}):`, err);
  }
}

/** Количество готовых карточек в постоянном складе */
export async function countStoredWordCards(env: Env): Promise<number> {
  if (!env.DB) return 0;
  await ensureSchema(env);

  try {
    const row = await env.DB.prepare('SELECT count(*) as cnt FROM word_cards').first<{ cnt: number }>();
    return row?.cnt ?? 0;
  } catch {
    return 0;
  }
}

/** Удаление карточки (для пересоздания) */
export async function deleteStoredWordCard(
  env: Env,
  lemma: string,
  lang: string,
  explainLang: string,
): Promise<void> {
  if (!env.DB) return;
  await ensureSchema(env);

  const clean = normalizeStoreWord(lemma);
  try {
    await env.DB.prepare(
      'DELETE FROM word_cards WHERE lower(lemma) = ? AND lang = ? AND explain_lang = ?',
    )
      .bind(clean, lang, explainLang)
      .run();
  } catch (err) {
    console.warn(`[wordStore] Ошибка удаления карточки ${lemma}:`, err);
  }
}
