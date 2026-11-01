/**
 * Глобальный перехват и журнал ошибок клиента (Часть 19).
 * Никаких личных данных и текста переводов не отправляется.
 */
import { reportRoute, reportMessage, reportStack } from '../../shared/errorPrivacy';
import { APP_VERSION } from '../config';
import { api } from '../api/client';

let initialized = false;
let reportedCount = 0;
let lastReset = Date.now();

function shouldReport(): boolean {
  const now = Date.now();
  if (now - lastReset > 60_000) {
    reportedCount = 0;
    lastReset = now;
  }
  if (reportedCount >= 3) return false;
  reportedCount++;
  return true;
}

export function reportClientError(details: {
  message: string;
  stack?: string;
  url?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  userNote?: string;
}): void {
  if (!details.userNote && !shouldReport()) return;

  api
    .reportError({
      message: reportMessage(details.message),
      stack: reportStack(details.stack) ?? undefined,
      url: reportRoute(details.url || window.location.href),
      source: details.source ? reportRoute(details.source) : undefined,
      lineno: details.lineno,
      colno: details.colno,
      appVersion: APP_VERSION,
      userAgent: navigator.userAgent,
      userNote: details.userNote,
    })
    .catch(() => undefined);
}

export function initGlobalErrorHandling(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    // Игнорируем ошибки расширений браузера и ResizeObserver loop
    if (
      event.filename?.startsWith('chrome-extension:') ||
      event.filename?.startsWith('moz-extension:') ||
      event.message?.includes('ResizeObserver')
    ) {
      return;
    }

    reportClientError({
      message: event.message || 'Window Error',
      stack: event.error?.stack,
      url: window.location.href,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection');

    // Игнорируем сетевые отмены запросов
    if (message.includes('AbortError') || message.includes('aborted')) return;

    reportClientError({
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
      url: window.location.href,
    });
  });
}
