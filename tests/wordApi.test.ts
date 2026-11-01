import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../functions/_lib/env';
import { reverseCardDirection } from '../shared/cardDirection';

vi.mock('../functions/_lib/dict', () => ({ buildDictEntry: async () => null }));
vi.mock('../functions/_lib/router', () => ({ runJsonTask: async () => { throw new Error('AI quota exhausted'); } }));
vi.mock('../functions/_lib/classic', () => ({ translateClassic: async () => ({ text: 'die Kacke', detectedLang: null, provider: 'deepl' }) }));
import { onRequestPost } from '../functions/api/word';

const env: Env = { ASSETS: { fetch: request => fetch(new URL(request.url).pathname) } };
describe('Word API without available AI', () => {
  it.each([
    ['Haus', 'de', 'ru', 'Haus', 'noun'],
    ['gehen', 'de', 'ru', 'gehen', 'verb'],
    ['go', 'en', 'ru', 'go', 'verb'],
    ['Какашка', 'ru', 'de', 'Kacke', 'noun'],
  ])('returns the dictionary card for %s', async (word, sourceLang, targetLang, lemma, pos) => {
    const response = await onRequestPost({ env, request: new Request('https://app.test/api/word', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word, sourceLang, targetLang }) }) } as any);
    expect(response.status).toBe(200);
    const body = await response.json() as any;
    expect(body.provider).toBe('dict');
    expect(body.card.lemma).toBe(lemma);
    expect(body.card.partOfSpeech).toBe(pos);
    if (body.card.language === 'de' && pos === 'noun') expect(body.card.declension.length).toBe(4);
    if (body.card.language === 'de' && pos === 'verb') expect(body.card.conjugation.praesens.length).toBe(6);
  });
  it('keeps German as the studied word regardless of interface language', () => {
    expect(reverseCardDirection('de', 'ru')).toBe(false);
    expect(reverseCardDirection('ru', 'de')).toBe(true);
    expect(reverseCardDirection('en', 'ru')).toBe(false);
    expect(reverseCardDirection('ru', 'en')).toBe(true);
  });
});
