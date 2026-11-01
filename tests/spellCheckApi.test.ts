import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../functions/api/check';

afterEach(() => vi.restoreAllMocks());
const context = (text: string): any => ({ env: {}, request: new Request('https://app.test/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, sourceLang: 'de', uiLang: 'ru' }) }) });
describe('LanguageTool result accuracy', () => {
  it('does not call an unavailable check successful', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 429 }));
    const response = await onRequestPost(context('Helo'));
    const result = await response.json() as any;
    expect(result.available).toBe(false);
    expect(result.isCorrect).toBe(false);
  });
  it('preserves leading whitespace and correction offsets', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ matches: [{ offset: 2, length: 4, message: 'Typo', replacements: [{ value: 'Hallo' }], rule: {} }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const response = await onRequestPost(context('  Halo Welt'));
    const result = await response.json() as any;
    expect(result.correctedText).toBe('  Hallo Welt');
    expect(result.corrections[0].offset).toBe(2);
  });
});
