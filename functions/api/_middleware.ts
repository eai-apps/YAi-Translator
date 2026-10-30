/** Общая обработка CORS для всех запросов /api/*. */
import type { Env } from '../_lib/env';
import { CORS_HEADERS } from '../_lib/http';

export const onRequest: PagesFunction<Env> = async (context) => {
  // Предварительный запрос браузера (preflight) — отвечаем без вызова эндпоинта.
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
