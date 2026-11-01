import { describe, it, expect } from 'vitest';
import { extractTokens, resolveTranslation } from '../src/hooks/useConnectedWords';
import { isStopWord } from '../src/data/stopwords';
import type { LexiconNounEntry } from '../shared/lexicon';

describe('useConnectedWords logic', () => {
  describe('extractTokens', () => {
    it('returns empty array for empty or whitespace string', () => {
      expect(extractTokens('')).toEqual([]);
      expect(extractTokens('   ')).toEqual([]);
    });

    it('extracts tokens with Unicode characters and filters length < 2', () => {
      const text = 'Ich ging gestern ins Kino, und er sah einen Film!';
      const tokens = extractTokens(text);
      expect(tokens).toEqual(['Ich', 'ging', 'gestern', 'ins', 'Kino', 'und', 'er', 'sah', 'einen', 'Film']);
    });

    it('handles English tokens with apostrophes and punctuation', () => {
      const text = 'Hello world! "We are learning English."';
      const tokens = extractTokens(text);
      expect(tokens).toEqual(['Hello', 'world', 'We', 'are', 'learning', 'English']);
    });

    it('handles Russian Cyrillic tokens', () => {
      const text = 'Привет, мир! Мы учим языки.';
      const tokens = extractTokens(text);
      expect(tokens).toEqual(['Привет', 'мир', 'Мы', 'учим', 'языки']);
    });
  });

  describe('isStopWord for multiple languages', () => {
    it('identifies German stopwords', () => {
      expect(isStopWord('der', 'de')).toBe(true);
      expect(isStopWord('die', 'de')).toBe(true);
      expect(isStopWord('und', 'de')).toBe(true);
      expect(isStopWord('haus', 'de')).toBe(false);
      expect(isStopWord('apfel', 'de')).toBe(false);
    });

    it('identifies English stopwords', () => {
      expect(isStopWord('the', 'en')).toBe(true);
      expect(isStopWord('and', 'en')).toBe(true);
      expect(isStopWord('in', 'en')).toBe(true);
      expect(isStopWord('apple', 'en')).toBe(false);
      expect(isStopWord('computer', 'en')).toBe(false);
    });

    it('identifies Russian stopwords', () => {
      expect(isStopWord('и', 'ru')).toBe(true);
      expect(isStopWord('в', 'ru')).toBe(true);
      expect(isStopWord('на', 'ru')).toBe(true);
      expect(isStopWord('книга', 'ru')).toBe(false);
    });
  });

  describe('resolveTranslation', () => {
    it('resolves translation from tr record', () => {
      const entry: LexiconNounEntry = {
        pos: 'n',
        g: 'das',
        tr: {
          ru: ['дом', 'здание'],
          en: ['house'],
        },
      };

      expect(resolveTranslation(entry, 'Haus', 'de', 'ru')).toBe('дом');
      expect(resolveTranslation(entry, 'Haus', 'de', 'en')).toBe('house');
    });

    it('falls back to common German translations if tr is empty', () => {
      const entry: LexiconNounEntry = {
        pos: 'n',
        g: 'das',
      };

      const tr = resolveTranslation(entry, 'Haus', 'de', 'ru');
      expect(tr).toBeDefined();
      expect(tr).toBe('дом');
    });
  });
});
