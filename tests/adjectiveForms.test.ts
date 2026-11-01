import { describe, it, expect } from 'vitest';
import { buildDeclension } from '../src/lib/adjectiveForms';
import type { DeclensionRow } from '../src/lib/adjectiveForms';

function cell(rows: DeclensionRow[], grammaticalCase: string, column: 'masculine' | 'feminine' | 'neuter' | 'plural'): string {
  const row = rows.find((r) => r.grammaticalCase === grammaticalCase);
  if (!row) throw new Error(`Row not found: ${grammaticalCase}`);
  return row[column].text;
}

describe('German Adjective Declension', () => {
  it('builds strong declension without article', () => {
    const strong = buildDeclension('schön', 'strong');
    expect(cell(strong, 'nominative', 'masculine')).toBe('schöner');
    expect(cell(strong, 'nominative', 'neuter')).toBe('schönes');
    expect(cell(strong, 'nominative', 'feminine')).toBe('schöne');
    expect(cell(strong, 'nominative', 'plural')).toBe('schöne');
    expect(cell(strong, 'accusative', 'masculine')).toBe('schönen');
    expect(cell(strong, 'dative', 'masculine')).toBe('schönem');
    expect(cell(strong, 'dative', 'feminine')).toBe('schöner');
    expect(cell(strong, 'genitive', 'plural')).toBe('schöner');
  });

  it('builds weak declension with der/die/das', () => {
    const weak = buildDeclension('schön', 'weak');
    expect(cell(weak, 'nominative', 'masculine')).toBe('der schöne');
    expect(cell(weak, 'nominative', 'neuter')).toBe('das schöne');
    expect(cell(weak, 'accusative', 'masculine')).toBe('den schönen');
    expect(cell(weak, 'accusative', 'feminine')).toBe('die schöne');
    expect(cell(weak, 'dative', 'plural')).toBe('den schönen');
    expect(cell(weak, 'genitive', 'masculine')).toBe('des schönen');
  });

  it('builds mixed declension with ein/eine/ein', () => {
    const mixed = buildDeclension('schön', 'mixed');
    expect(cell(mixed, 'nominative', 'masculine')).toBe('ein schöner');
    expect(cell(mixed, 'nominative', 'neuter')).toBe('ein schönes');
    expect(cell(mixed, 'nominative', 'feminine')).toBe('eine schöne');
    expect(cell(mixed, 'accusative', 'masculine')).toBe('einen schönen');
    expect(cell(mixed, 'dative', 'feminine')).toBe('einer schönen');
    expect(cell(mixed, 'genitive', 'neuter')).toBe('eines schönen');
  });
});
