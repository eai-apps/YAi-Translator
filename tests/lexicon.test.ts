import { describe, it, expect } from 'vitest';
import { lookupLexicon, getCandidatesForLanguage } from '../src/hooks/useLexicon';

describe('lookupLexicon & Stem Rules', () => {
  it('returns null for empty or single letter inputs', async () => {
    expect(await lookupLexicon('')).toBeNull();
    expect(await lookupLexicon(' ')).toBeNull();
    expect(await lookupLexicon('a')).toBeNull();
    expect(await lookupLexicon('!')).toBeNull();
  });

  it('strips surrounding punctuation', async () => {
    const res = await lookupLexicon('«ging»', 'de');
    expect(res).not.toBeNull();
    expect(res?.lemma.toLowerCase()).toBe('gehen');
  });

  describe('German forms (de)', () => {
    it('resolves irregular verb past forms', async () => {
      const resGing = await lookupLexicon('ging', 'de');
      expect(resGing?.lemma.toLowerCase()).toBe('gehen');

      const resKam = await lookupLexicon('kam', 'de');
      expect(resKam?.lemma.toLowerCase()).toBe('kommen');

      const resSah = await lookupLexicon('sah', 'de');
      expect(resSah?.lemma.toLowerCase()).toBe('sehen');
    });

    it('resolves irregular noun plural forms with umlauts', async () => {
      const resHaeuser = await lookupLexicon('Häuser', 'de');
      expect(resHaeuser?.lemma.toLowerCase()).toBe('haus');

      const resFrauen = await lookupLexicon('Männer', 'de');
      expect(resFrauen?.lemma.toLowerCase()).toBe('mann');
    });

    it('generates correct candidate stems for German words', () => {
      const cands = getCandidatesForLanguage('machte', 'de');
      expect(cands).toContain('mach');
      expect(cands).toContain('machen');
    });
  });

  describe('English forms (en)', () => {
    it('resolves irregular past verbs', async () => {
      const resWent = await lookupLexicon('went', 'en');
      expect(resWent?.lemma.toLowerCase()).toBe('go');

      const resCame = await lookupLexicon('came', 'en');
      expect(resCame?.lemma.toLowerCase()).toBe('come');
    });

    it('resolves irregular noun plurals', async () => {
      const resChildren = await lookupLexicon('children', 'en');
      expect(resChildren?.lemma.toLowerCase()).toBe('child');

      const resMen = await lookupLexicon('men', 'en');
      expect(resMen?.lemma.toLowerCase()).toBe('man');
    });

    it('generates correct candidate stems for English plurals and verbs', () => {
      const candsCities = getCandidatesForLanguage('cities', 'en');
      expect(candsCities).toContain('city');

      const candsKnives = getCandidatesForLanguage('knives', 'en');
      expect(candsKnives).toContain('knife');

      const candsWalking = getCandidatesForLanguage('walking', 'en');
      expect(candsWalking).toContain('walk');

      const candsLiked = getCandidatesForLanguage('liked', 'en');
      expect(candsLiked).toContain('like');
    });
  });

  describe('Romance languages candidates', () => {
    it('generates stem candidates by removing -s and -es', () => {
      const frCands = getCandidatesForLanguage('maisons', 'fr');
      expect(frCands).toContain('maison');

      const esCands = getCandidatesForLanguage('ciudades', 'es');
      expect(esCands).toContain('ciudad');
    });
  });
});
