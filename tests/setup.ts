import fs from 'node:fs/promises';
import path from 'node:path';

const origFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;

  const match = urlStr.match(/\/(lex|ex|cards)\/([^?#]+)/);
  if (match) {
    const subPath = path.join(match[1], match[2]);
    const filePath = path.resolve(process.cwd(), 'public', subPath);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return new Response(data, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }
  }

  if (origFetch) {
    return origFetch(input, init);
  }

  return new Response(null, { status: 404, statusText: 'Not Found' });
};

// Мок localStorage и window для тестов в Node окружении
if (!globalThis.localStorage) {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

if (!(globalThis as any).window) {
  (globalThis as any).window = globalThis;
}
if (!(globalThis as any).window.dispatchEvent) {
  (globalThis as any).window.dispatchEvent = () => true;
  (globalThis as any).window.addEventListener = () => {};
  (globalThis as any).window.removeEventListener = () => {};
}
