/**
 * POST /api/error — приём отчётов об ошибках клиента и сообщений о проблемах (Часть 19).
 * Никаких личных данных и текстов перевода не сохраняется.
 */
import { reportRoute, reportMessage, reportStack } from '../../shared/errorPrivacy';
import { allowRequest } from '../_lib/requestRate';
import type { Env } from '../_lib/env';
import { errorResponse, getClientIp, jsonResponse, readJsonBody } from '../_lib/http';
import { ensureSchema } from '../_lib/schema';

interface ClientErrorReport {
  message?: string;
  stack?: string;
  url?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  appVersion?: string;
  userAgent?: string;
  userNote?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    if (!(await allowRequest(env, 'errors', getClientIp(request), 20))) return jsonResponse({ ok: false }, 429);
    const body = (await readJsonBody(request)) as ClientErrorReport;
    if (!body || (!body.message && !body.userNote)) {
      return jsonResponse({ ok: false, error: 'empty_report' }, 400);
    }

    if (env.DB) {
      await ensureSchema(env);

      const message = body.userNote ? 'User report' : reportMessage(String(body.message ?? ''));
      const stack = reportStack(body.stack);
      const url = reportRoute(body.url);
      const source = body.source ? reportRoute(body.source) : null;
      const lineno = typeof body.lineno === 'number' ? body.lineno : null;
      const colno = typeof body.colno === 'number' ? body.colno : null;
      const appVersion = body.appVersion ? String(body.appVersion).slice(0, 30) : null;
      const userAgent = String(body.userAgent || request.headers.get('user-agent') || '').slice(0, 300);
      const userNote = body.userNote ? String(body.userNote).slice(0, 1000) : null;
      const now = Date.now();

      await env.DB.prepare(
        `INSERT INTO client_errors (
          timestamp, message, stack, url, source, lineno, colno, app_version, user_agent, user_note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(now, message, stack, url, source, lineno, colno, appVersion, userAgent, userNote, now)
        .run();
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(err, 'ru');
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
