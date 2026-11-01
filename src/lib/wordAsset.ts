/** Сохраняет открытые словари даже при первом запуске, когда Service Worker ещё устанавливается. */
import { APP_VERSION } from '../config';

export async function fetchWordAsset(path: string): Promise<Response> {
  const group = path.startsWith('/lex/') ? 'lexicon-chunks' : path.startsWith('/ex/') ? 'examples-chunks' : 'offline-cards';
  const cache = typeof caches === 'undefined' ? null : await caches.open(`${group}-${APP_VERSION}`).catch(() => null);
  try {
    const response = await fetch(path);
    if (response.ok && response.headers.get('content-type')?.includes('json')) {
      await cache?.put(path, response.clone()).catch(() => undefined);
      return response;
    }
    return await cache?.match(path) ?? response;
  } catch (error) {
    const cached = await cache?.match(path);
    if (cached) return cached;
    throw error;
  }
}
