/** JSON-ответ вместе с cookie (заголовок Set-Cookie). */
import { jsonResponse } from './http';

export function jsonResponseWithCookie(data: unknown, cookie: string, status = 200): Response {
  const response = jsonResponse(data, status);
  response.headers.append('Set-Cookie', cookie);
  return response;
}
