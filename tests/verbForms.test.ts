import { describe, it, expect } from 'vitest';
import { buildVerbTables } from '../src/lib/verbForms';
import type { VerbFormsInput, VerbFormRow } from '../src/lib/verbForms';

describe('German Verb Forms', () => {
  const subjects = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
  const rows = (values: string[]): VerbFormRow[] =>
    values.map((form, index) => ({ pronoun: subjects[index], form }));

  it('correctly builds conjugation for "machen" (regular weak verb)', () => {
    const input: VerbFormsInput = {
      infinitive: 'machen',
      praesens: rows(['mache', 'machst', 'macht', 'machen', 'macht', 'machen']),
      praeteritum: rows(['machte', 'machtest', 'machte', 'machten', 'machtet', 'machten']),
      perfekt: 'hat gemacht',
      auxiliary: 'haben',
      partizip2: 'gemacht',
      konjunktiv2: rows(['würde machen', 'würdest machen', 'würde machen', 'würden machen', 'würdet machen', 'würden machen']),
      imperativ: { du: 'mach', ihr: 'macht', sie: 'machen Sie' },
    };

    const tables = buildVerbTables(input);
    const praeteritum = tables.past.find((t) => t.title === 'word.form.praeteritum')?.forms;
    const perfekt = tables.past.find((t) => t.title === 'word.form.perfekt')?.forms;
    const plusquam = tables.past.find((t) => t.title === 'word.form.plusquamperfekt')?.forms;
    const futur1 = tables.future.find((t) => t.title === 'word.form.futur1')?.forms;
    const futur2 = tables.future.find((t) => t.title === 'word.form.futur2')?.forms;
    const konj1 = tables.present.find((t) => t.title === 'word.form.konjunktiv1')?.forms;
    const partizip1 = tables.present.find((t) => t.title === 'word.form.partizip1')?.forms[0];

    expect(praeteritum?.[2].form).toBe('machte');
    expect(perfekt?.[0].form).toBe('habe gemacht');
    expect(plusquam?.[2].form).toBe('hatte gemacht');
    expect(futur1?.[0].form).toBe('werde machen');
    expect(futur2?.[2].form).toBe('wird gemacht haben');
    expect(konj1?.[0].form).toBe('mache');
    expect(partizip1?.form).toBe('machend');
  });

  it('correctly builds conjugation for "gehen" (strong verb with sein)', () => {
    const input: VerbFormsInput = {
      infinitive: 'gehen',
      praesens: rows(['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen']),
      praeteritum: rows(['ging', 'gingst', 'ging', 'gingen', 'gingt', 'gingen']),
      perfekt: 'ist gegangen',
      auxiliary: 'sein',
      partizip2: 'gegangen',
      konjunktiv2: rows(['ginge', 'gingest', 'ginge', 'gingen', 'ginget', 'gingen']),
      imperativ: { du: 'geh', ihr: 'geht', sie: 'gehen Sie' },
    };

    const tables = buildVerbTables(input);
    const praeteritum = tables.past.find((t) => t.title === 'word.form.praeteritum')?.forms;
    const perfekt = tables.past.find((t) => t.title === 'word.form.perfekt')?.forms;
    const plusquam = tables.past.find((t) => t.title === 'word.form.plusquamperfekt')?.forms;

    expect(praeteritum?.[0].form).toBe('ging');
    expect(perfekt?.[0].form).toBe('bin gegangen');
    expect(perfekt?.[2].form).toBe('ist gegangen');
    expect(plusquam?.[0].form).toBe('war gegangen');
  });
});
