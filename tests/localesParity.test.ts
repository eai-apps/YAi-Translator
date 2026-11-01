import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function getFlatKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    const val = obj[k];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      keys = keys.concat(getFlatKeys(val as Record<string, unknown>, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

describe('Locales 100% Parity Check', () => {
  const root = process.cwd();
  const ru = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/ru.json'), 'utf8'));
  const de = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/de.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en.json'), 'utf8'));

  const ruKeys = new Set(getFlatKeys(ru));
  const deKeys = new Set(getFlatKeys(de));
  const enKeys = new Set(getFlatKeys(en));

  it('RU keys match DE keys completely', () => {
    const diffRuDe = [...ruKeys].filter((k) => !deKeys.has(k));
    const diffDeRu = [...deKeys].filter((k) => !ruKeys.has(k));

    expect(diffRuDe, `Keys present in RU but missing in DE: ${diffRuDe.join(', ')}`).toEqual([]);
    expect(diffDeRu, `Keys present in DE but missing in RU: ${diffDeRu.join(', ')}`).toEqual([]);
  });

  it('RU keys match EN keys completely', () => {
    const diffRuEn = [...ruKeys].filter((k) => !enKeys.has(k));
    const diffEnRu = [...enKeys].filter((k) => !ruKeys.has(k));

    expect(diffRuEn, `Keys present in RU but missing in EN: ${diffRuEn.join(', ')}`).toEqual([]);
    expect(diffEnRu, `Keys present in EN but missing in RU: ${diffEnRu.join(', ')}`).toEqual([]);
  });

  it('all three locales have equal number of keys', () => {
    expect(ruKeys.size).toBe(deKeys.size);
    expect(ruKeys.size).toBe(enKeys.size);
  });
});
