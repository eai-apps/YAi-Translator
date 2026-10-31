/**
 * POST /api/transcribe — распознавание речи через Workers AI Whisper.
 * Принимает аудио (audio/webm или audio/mp4), возвращает { text }.
 * Лимит: 30 запросов в минуту с одного IP (отдельный счётчик, не ИИ-лимит).
 */
import type { Env } from '../_lib/env';
import { ApiError, errorResponse, getClientIp, getUiLanguage, jsonResponse } from '../_lib/http';
import { ensureSchema } from '../_lib/schema';
import { sha256Hex } from '../_lib/utils';
import { describeError } from '../_lib/utils';

const RATE_WINDOW_SEC = 60;
const RATE_LIMIT = 30;
const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // 2 МБ

/** Проверяет и обновляет лимит запросов на транскрипцию (отдельная таблица stats_daily). */
async function checkTranscribeRate(env: Env, ip: string): Promise<void> {
  if (!env.DB) return;
  const ipHash = await sha256Hex(`transcribe:${ip}`);
  const window = Math.floor(Date.now() / 1000 / RATE_WINDOW_SEC);
  const key = `rate:transcribe:${ipHash}:${window}`;
  try {
    await ensureSchema(env);
    const row = await env.DB.prepare('SELECT value FROM stats_daily WHERE day = ? AND metric = ?')
      .bind('rate', key)
      .first<{ value: number }>();
    if (row && row.value >= RATE_LIMIT) {
      throw new ApiError('RATE_LIMITED', 429, RATE_WINDOW_SEC);
    }
    await env.DB.prepare(
      `INSERT INTO stats_daily (day, metric, value) VALUES (?, ?, 1)
       ON CONFLICT(day, metric) DO UPDATE SET value = value + 1`,
    )
      .bind('rate', key)
      .run();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.warn('Лимит транскрипции недоступен:', describeError(error));
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    if (!context.env.AI) {
      throw new ApiError('NO_PROVIDERS', 503);
    }

    const contentType = context.request.headers.get('content-type') ?? '';
    // Принимаем audio/webm, audio/mp4 и audio/ogg.
    if (!contentType.startsWith('audio/')) {
      throw new ApiError('VALIDATION', 400);
    }

    const contentLength = Number(context.request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_AUDIO_BYTES) {
      throw new ApiError('TEXT_TOO_LONG', 413);
    }

    const ip = getClientIp(context.request);
    await checkTranscribeRate(context.env, ip);

    const buffer = await context.request.arrayBuffer();
    if (buffer.byteLength > MAX_AUDIO_BYTES) {
      throw new ApiError('TEXT_TOO_LONG', 413);
    }
    if (buffer.byteLength === 0) {
      throw new ApiError('VALIDATION', 400);
    }

    const url = new URL(context.request.url);
    const lang = url.searchParams.get('lang') || context.request.headers.get('x-language') || '';

    const base64 = bufferToBase64(buffer);
    const aiPayload: Record<string, unknown> = { audio: base64 };
    if (lang && lang !== 'auto') {
      aiPayload.language = lang;
    }

    const result = await context.env.AI.run('@cf/openai/whisper-large-v3-turbo', aiPayload) as { text?: string } | null;

    const text = result?.text?.trim() ?? '';
    return jsonResponse({ text });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
