/** Проверка ключа через /api/key-test (для сохранённого ключа — через /api/keys/:provider/test). */
import { useCallback, useState } from 'react';
import { api } from '../api/client';

export type KeyTestStatus = 'idle' | 'testing' | 'ok' | 'fail';

export interface KeyTestResult {
  ok: boolean;
  latencyMs: number;
  /** Причина от сервера на языке интерфейса; null — всё в порядке. */
  message: string | null;
}

export function useKeyTest() {
  const [status, setStatus] = useState<KeyTestStatus>('idle');
  const [result, setResult] = useState<KeyTestResult | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  const test = useCallback(async (provider: 'gemini' | 'groq', key: string): Promise<KeyTestResult> => {
    const trimmed = key.trim();
    if (!trimmed) {
      const failed: KeyTestResult = { ok: false, latencyMs: 0, message: null };
      setStatus('fail');
      setResult(failed);
      return failed;
    }

    setStatus('testing');
    setResult(null);
    try {
      const response = await api.testKey({ provider, key: trimmed });
      const next: KeyTestResult = {
        ok: response.ok,
        latencyMs: response.latencyMs,
        message: response.message,
      };
      setStatus(response.ok ? 'ok' : 'fail');
      setResult(next);
      return next;
    } catch {
      const failed: KeyTestResult = { ok: false, latencyMs: 0, message: null };
      setStatus('fail');
      setResult(failed);
      return failed;
    }
  }, []);

  const latencyMs = result?.latencyMs ?? null;
  return { status, result, latencyMs, test, reset };
}
