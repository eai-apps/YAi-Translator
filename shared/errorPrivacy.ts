/** Автоматический журнал не хранит текст исключения или параметры адреса. */
const ROUTES = new Set(['/', '/dictionary', '/learn', '/learn/cards', '/learn/review', '/learn/decks', '/learn/progress', '/phrasebook', '/letter', '/conversation', '/grammar', '/profile', '/ask', '/about', '/admin', '/privacy', '/terms', '/apps', '/help', '/resources']);

export function reportRoute(value?: string): string {
  try { const pathname = new URL(value ?? '/', 'https://app.local').pathname; return ROUTES.has(pathname) ? pathname : '/'; }
  catch { return '/'; }
}

export function reportMessage(value: string): string {
  const kind = value.match(/\b(TypeError|ReferenceError|RangeError|SyntaxError|NetworkError|ChunkLoadError)\b/)?.[1];
  return kind ?? 'Application error';
}

export function reportStack(value?: string): string | null {
  if (!value) return null;
  // Только координаты собранного кода, без первой строки с сообщением и без URL-параметров.
  return value.split('\n').map(line => line.match(/\/(assets\/[^\s?()]+\.(?:js|mjs):\d+:\d+)/)?.[1]).filter(Boolean).slice(0, 10).join('\n') || null;
}
