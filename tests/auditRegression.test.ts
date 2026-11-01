import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assembleWordCard } from '../shared/cardAssembler';
import { buildNounDeclension, buildVerbConjugation } from '../shared/lexiconForms';
import { importUserData } from '../src/lib/dataBackup';
import { STORAGE_KEYS } from '../src/config';
import { cardFromWord } from '../src/lib/studyCard';
import { reportMessage, reportRoute, reportStack } from '../shared/errorPrivacy';
import { shouldAutoLoadAiCard } from '../src/lib/aiCardMode';
import { emptyProgress } from '../src/lib/srs';
import { staticWordCard } from '../functions/_lib/staticWord';
import type { Env } from '../functions/_lib/env';

beforeEach(() => localStorage.clear());

describe('Audit: cards without AI', () => {
  it('does not spend shared AI automatically by default', () => {
    expect(shouldAutoLoadAiCard({ aiCardMode: 'auto' }, false, false)).toBe(false);
    expect(shouldAutoLoadAiCard({ aiCardMode: 'auto' }, false, true)).toBe(true);
    expect(shouldAutoLoadAiCard({ aiCardMode: 'button' }, true, true)).toBe(false);
  });
  it('uses translations and examples only in the requested language', () => {
    const card = assembleWordCard({ lemma: 'house', lang: 'en', explainLang: 'ru', entry: { pos: 'n', tr: { ru: ['дом'], de: ['Haus'] } }, examples: [{ text: 'A house.', tr: { de: 'Ein Haus.' } }] });
    expect(card.meanings.flatMap(v => v.translations)).toEqual(['дом']);
    expect(card.examples).toEqual([]);
    expect(cardFromWord(card)?.lang).toBe('en');
  });
  it('does not invent an article for a noun with unknown gender', () => {
    expect(buildNounDeclension('Beispielwort', { pos: 'n' })).toEqual([]);
  });
  it.each([
    ['arbeiten', { pos: 'v' as const, p3: 'arbeitet', prt: 'arbeitete', p2: 'gearbeitet' }, 'arbeitest', 'arbeitet'],
    ['tanzen', { pos: 'v' as const, p3: 'tanzt', prt: 'tanzte', p2: 'getanzt' }, 'tanzt', 'tanzt'],
    ['lesen', { pos: 'v' as const, p3: 'liest', prt: 'las', p2: 'gelesen' }, 'liest', 'lest'],
  ])('conjugates %s with the actual stem', (lemma, entry, du, ihr) => {
    const forms = buildVerbConjugation(lemma, entry);
    expect(forms.praesens[1].form).toBe(du);
    expect(forms.praesens[4].form).toBe(ihr);
  });
  it('separates aufstehen and uses sein', () => {
    const forms = buildVerbConjugation('aufstehen', { pos: 'v', p3: 'aufsteht', prt: 'aufstand', p2: 'aufgestanden', aux: 'haben' });
    expect(forms.praesens[0].form).toBe('stehe auf');
    expect(forms.perfekt).toBe('ist aufgestanden');
    expect(forms.imperativ?.sie).toBe('stehen Sie auf!');
  });
  it('handles weak noun Student in dative and accusative', () => {
    const rows = buildNounDeclension('Student', { pos: 'n', g: 'der', pl: 'Studenten', gen: 'Studenten' });
    expect(rows.find(v => v.grammaticalCase === 'dative')?.singular).toBe('dem Studenten');
    expect(rows.find(v => v.grammaticalCase === 'accusative')?.singular).toBe('den Studenten');
  });
  it('reads the actual Pages lexicon on the server without AI', async () => {
    const env: Env = { ASSETS: { fetch: request => fetch(new URL(request.url).pathname) } };
    const card = await staticWordCard(env, 'Haus', 'de', 'ru', new AbortController().signal);
    expect(card?.article).toBe('das');
    expect(card?.declension?.find(v => v.grammaticalCase === 'genitive')?.singular).toBe('des Hauses');
  });
});

describe('Audit: backup data integrity', () => {
  it('preserves newer study progress when an old backup is imported', () => {
    const card = { id: 'en:house', lemma: 'house', lang: 'en', partOfSpeech: 'noun', article: null, plural: 'houses', translations: ['дом'], addedAt: 10, updatedAt: 10 };
    const recent = { ...emptyProgress(card.id, 300), reps: 8, interval: 35 };
    localStorage.setItem(STORAGE_KEYS.studyCards, JSON.stringify([card]));
    localStorage.setItem(STORAGE_KEYS.studyProgress, JSON.stringify([recent]));
    importUserData(JSON.stringify({ version: 1, study: { progress: [{ ...recent, reps: 1, interval: 1, updatedAt: 100 }] } }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.studyProgress)!)[0].reps).toBe(8);
  });
  it('validates the whole backup before writing any records', () => {
    const before = JSON.stringify([{ id: 'existing', text: 'test' }]);
    localStorage.setItem(STORAGE_KEYS.history, before);
    expect(() => importUserData(JSON.stringify({ version: 1, history: [], study: { cards: [{ id: 'broken' }] } }))).toThrow();
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(before);
  });
  it('does not label an old settings backup as changed now', () => {
    localStorage.setItem(STORAGE_KEYS.settingsUpdatedAt, '300');
    localStorage.setItem(STORAGE_KEYS.theme, '"dark"');
    importUserData(JSON.stringify({ version: 1, exportedAt: 100, settings: { theme: 'light', updatedAt: 100 } }));
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('"dark"');
  });
});

describe('Audit: automatic error privacy', () => {
  it('removes translation queries, unknown path segments and exception text', () => {
    expect(reportRoute('https://example.test/?q=private-text&token=secret')).toBe('/');
    expect(reportRoute('https://example.test/word/de/private-text')).toBe('/');
    expect(reportMessage('TypeError: private letter text')).toBe('TypeError');
    expect(reportStack('TypeError: private text\n at x (https://app.test/assets/main-abc.js:12:8)')).toBe('assets/main-abc.js:12:8');
  });
});
