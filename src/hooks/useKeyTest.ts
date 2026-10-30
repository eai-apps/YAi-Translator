/** Проверка ключа пользователя через /api/key-test. */
import { useCallback, useState } from 'react';
import { api } from '../api/client';

export type KeyTestStatus = 'idle' | 'testing' | 'ok' | 'fail';

export function useKeyTest() {
  const [status, setStatus] = useState<KeyTestStatus>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setLatencyMs(null);
  }, []);

  const test = useCallback(async (provider: 'gemini' | 'groq', key: string): Promise<boolean> => {
    const trimmed = key.trim();
    if (!trimmed) {
      setStatus('fail');
      setLatencyMs(null);
      return false;
    }
    setStatus('testing');
    setLatencyMs(null);
    try {
      const result = await api.testKey({ provider, key: trimmed });
      setLatencyMs(result.latencyMs);
      setStatus(result.ok ? 'ok' : 'fail');
      return result.ok;
    } catch {
      setStatus('fail');
      return false;
    }
  }, []);

  return { status, latencyMs, test, reset };
}
