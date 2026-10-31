/**
 * Действия админки со справочником грамматики.
 * add — новая тема; update — правка названий и текста; regenerate — заново попросить ИИ;
 * delete — убрать тему. Каждое действие пишется в журнал админов.
 * Правка в админке: «Перегенерировать» перезапишет текст только по прямому нажатию.
 */
import type { GrammarBody, GrammarExample, GrammarMistake } from '../../../shared/types';
import { GRAMMAR_CATEGORIES, GRAMMAR_LEVELS, isGermanGrammarSlug } from '../../../shared/grammarTopics';
import { grammarTopicLinks } from '../../../shared/grammarLinks';
import { GRAMMAR } from '../config';
import type { Env } from '../env';
import { ApiError } from '../http';
import type { AdminSession } from '../admin/require';
import { logAdminAction } from '../admin/require';
import { loadTopicBody } from './generate';
import { deleteTopic, readTopic, requireSlug, toAdminTopic, upsertTopic } from './store';

const EXAMPLE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

/** Текст из формы: одна строка — один пункт списка. */
function lines(raw: unknown, maxItems: number, maxLength = 800): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\r?\n/) : [];
  return list
    .map((item) => (typeof item === 'string' ? item.replace(/\s+/g, ' ').trim().slice(0, maxLength) : ''))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function text(raw: unknown, maxLength = 4000): string {
  return typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

function record(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

/** Текст темы из формы админки (та же структура, что и у ИИ). */

/** После правки, перегенерации или удаления темы немецкий и английский тексты составятся заново. */
async function dropTranslatedBodies(env: Env, slug: string): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare('DELETE FROM cache WHERE key IN (?, ?)')
    .bind(`grammar:body:de:${slug}`, `grammar:body:en:${slug}`)
    .run()
    .catch(() => undefined);
}

export function readBody(raw: unknown, slug: string): GrammarBody {
  const source = record(raw);
  const summary = text(source.summary);
  if (!summary) throw new ApiError('VALIDATION', 400);

  const formation = (Array.isArray(source.formation) ? source.formation : [])
    .slice(0, 8)
    .map((item) => {
      const row = record(item);
      return { rule: text(row.rule, 800), example: text(row.example, 400), translation: text(row.translation, 400) };
    })
    .filter((item) => item.rule.length > 0);

  const examples = (Array.isArray(source.examples) ? source.examples : [])
    .slice(0, 8)
    .map((item): GrammarExample => {
      const row = record(item);
      const level = String(row.level ?? 'A2').toUpperCase();
      return {
        level: EXAMPLE_LEVELS.find((value) => value === level) ?? 'A2',
        text: text(row.text, 400),
        translation: text(row.translation, 400),
      };
    })
    .filter((item) => item.text.length > 0);

  const commonMistakes = (Array.isArray(source.commonMistakes) ? source.commonMistakes : [])
    .slice(0, 6)
    .map((item): GrammarMistake => {
      const row = record(item);
      return { wrong: text(row.wrong, 400), right: text(row.right, 400), why: text(row.why, 800) };
    })
    .filter((item) => item.right.length > 0);

  // Связанные темы: только известные slug, без самой темы.
  const related = lines(source.related, GRAMMAR.maxRelated, 80).filter(
    (item) => isGermanGrammarSlug(item) && item !== slug,
  );

  return {
    summary,
    whenToUse: lines(source.whenToUse, 8),
    formation,
    examples,
    commonMistakes,
    exceptions: lines(source.exceptions, 8),
    related: [...new Set(related)],
    links: grammarTopicLinks(slug),
  };
}

/** Названия и служебные поля формы. */
function readMeta(body: Record<string, unknown>) {
  const level = body.level;
  const category = body.category;
  if (!(GRAMMAR_LEVELS as readonly unknown[]).includes(level)) throw new ApiError('VALIDATION', 400);
  if (!(GRAMMAR_CATEGORIES as readonly unknown[]).includes(category)) throw new ApiError('VALIDATION', 400);
  const titleRu = text(body.titleRu, 200);
  const titleDe = text(body.titleDe, 200);
  const titleEn = text(body.titleEn, 200);
  if (!titleRu || !titleDe || !titleEn) throw new ApiError('VALIDATION', 400);
  return { level: level as string, category: category as string, titleRu, titleDe, titleEn };
}

export async function handleGrammarAction(
  env: Env,
  admin: AdminSession,
  body: Record<string, unknown>,
): Promise<void> {
  if (!env.DB) throw new Error('D1 недоступна');
  const action = body.action;

  if (action === 'add') {
    const slug = requireSlug(body.slug);
    if (await readTopic(env, slug)) throw new ApiError('VALIDATION', 400);
    const meta = readMeta(body);
    await upsertTopic(env, { slug, ...meta, body: readBody(body.body, slug) });
    await logAdminAction(env, admin, 'grammar.add', slug);
  } else if (action === 'update') {
    const slug = requireSlug(body.slug);
    const meta = readMeta(body);
    await upsertTopic(env, { slug, ...meta, body: readBody(body.body, slug) });
    await dropTranslatedBodies(env, slug);
    await logAdminAction(env, admin, 'grammar.update', `${slug}: ${meta.titleDe}`);
  } else if (action === 'regenerate') {
    const slug = requireSlug(body.slug);
    const row = await readTopic(env, slug);
    if (!row) throw new ApiError('NOT_FOUND', 404);
    const loaded = await loadTopicBody({
      env,
      // Пустой текст заставляет генерацию начаться заново.
      row: { ...row, body_json: '' },
      uiLang: 'ru',
      userKeys: {},
      signal: AbortSignal.timeout(60_000),
      clientIp: 'admin',
    });
    if (!loaded.body) throw new ApiError('GRAMMAR_NOT_READY', 503);
    await dropTranslatedBodies(env, slug);
    await logAdminAction(env, admin, 'grammar.regenerate', slug);
  } else if (action === 'delete') {
    const slug = requireSlug(body.slug);
    await deleteTopic(env, slug);
    await dropTranslatedBodies(env, slug);
    await logAdminAction(env, admin, 'grammar.delete', slug);
  } else {
    throw new ApiError('VALIDATION', 400);
  }
}

/** Текущая тема в виде ответа админки (для теста и перечитывания). */
export async function adminTopic(env: Env, slug: string) {
  const row = await readTopic(env, slug);
  if (!row) throw new ApiError('NOT_FOUND', 404);
  return toAdminTopic(row);
}
