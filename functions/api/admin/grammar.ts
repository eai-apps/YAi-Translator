/**
 * Грамматика в админке.
 * GET  /api/admin/grammar — все темы с текстом и статусом;
 * POST /api/admin/grammar {action} — add | update | regenerate | delete.
 */
import type { AdminGrammarResponse } from '../../../shared/types';
import type { Env } from '../../_lib/env';
import { requireAdmin } from '../../_lib/admin/require';
import { errorResponse, getUiLanguage, jsonResponse, readJsonBody } from '../../_lib/http';
import { handleGrammarAction } from '../../_lib/grammar/admin';
import { listTopics, toAdminTopic } from '../../_lib/grammar/store';

/** Общий ответ после любого действия — как у вкладки «Ресурсы». */
async function grammarList(env: Env): Promise<AdminGrammarResponse> {
  return { items: (await listTopics(env)).map(toAdminTopic) };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    await requireAdmin(context.env, context.request);
    return jsonResponse(await grammarList(context.env));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const admin = await requireAdmin(context.env, context.request);
    const body = await readJsonBody(context.request);
    await handleGrammarAction(context.env, admin, body);
    return jsonResponse(await grammarList(context.env));
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
