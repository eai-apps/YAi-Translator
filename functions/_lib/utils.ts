/** Мелкие утилиты: хеши, таймауты, разбор JSON от ИИ. */
import { ApiError } from './http';

/** SHA-256 в hex. Используется для ключей кэша и хеша IP. */
export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Ответ ИИ часто приходит в ```json ...``` или с текстом вокруг.
 * Достаём первый JSON-объект и пробуем его разобрать.
 */
export function parseJsonText(raw: string): unknown {
  let text = raw.trim();
  if (!text) throw new ApiError('BAD_JSON', 502);

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new ApiError('BAD_JSON', 502);

  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    // Мягкая починка: висячие запятые перед } и ] встречаются часто.
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      throw new ApiError('BAD_JSON', 502);
    }
  }
}

/** Сигнал с таймаутом, который также прерывается вместе с сигналом запроса. */
export function withTimeoutSignal(
  parent: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const onAbort = () => controller.abort();

  if (parent) {
    if (parent.aborted) controller.abort();
    else parent.addEventListener('abort', onAbort);
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      parent?.removeEventListener('abort', onAbort);
    },
  };
}

/** Короткий текст ошибки для логов (без ключей и личных данных). */
export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}
