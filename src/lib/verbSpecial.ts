/**
 * Таблицы особых немецких глаголов (этап 8): sein, haben, werden, wissen, модальные.
 * Вынесено из `verbForms.ts`, чтобы оба файла оставались короткими и читаемыми.
 * Mangея таблицы: правьте только этот файл.
 */

export interface SpecialVerb {
  /** Präsens: ich, du, er/sie/es, wir, ihr, sie/Sie. */
  praesens: string[];
  /** Präteritum в том же порядке. */
  praeteritum: string[];
  /** Konjunktiv II; null — взять форму из карточки (её прислал ИИ). */
  konjunktiv2: string[] | null;
  partizip2: string;
  auxiliary: 'haben' | 'sein';
}

/** Особые глаголы: инфинитив → формы. */
export const SPECIAL_VERBS: Record<string, SpecialVerb> = {
  sein: {
    praesens: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
    praeteritum: ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
    konjunktiv2: ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären'],
    partizip2: 'gewesen',
    auxiliary: 'sein',
  },
  haben: {
    praesens: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
    praeteritum: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
    konjunktiv2: ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten'],
    partizip2: 'gehabt',
    auxiliary: 'haben',
  },
  werden: {
    praesens: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
    praeteritum: ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden'],
    konjunktiv2: ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'],
    partizip2: 'geworden',
    auxiliary: 'sein',
  },
  wissen: {
    praesens: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
    praeteritum: ['wusste', 'wusstest', 'wusste', 'wussten', 'wusstet', 'wussten'],
    konjunktiv2: ['wüsste', 'wüsstest', 'wüsste', 'wüssten', 'wüsstet', 'wüssten'],
    partizip2: 'gewusst',
    auxiliary: 'haben',
  },
  können: {
    praesens: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'],
    praeteritum: ['konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten'],
    konjunktiv2: ['könnte', 'könntest', 'könnte', 'könnten', 'könntet', 'könnten'],
    partizip2: 'gekonnt',
    auxiliary: 'haben',
  },
  müssen: {
    praesens: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'],
    praeteritum: ['musste', 'musstest', 'musste', 'mussten', 'musstet', 'mussten'],
    konjunktiv2: ['müsste', 'müsstest', 'müsste', 'müssten', 'müsstet', 'müssten'],
    partizip2: 'gemusst',
    auxiliary: 'haben',
  },
  dürfen: {
    praesens: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'],
    praeteritum: ['durfte', 'durftest', 'durfte', 'durften', 'durftet', 'durften'],
    konjunktiv2: ['dürfte', 'dürftest', 'dürfte', 'dürften', 'dürftet', 'dürften'],
    partizip2: 'gedurft',
    auxiliary: 'haben',
  },
  sollen: {
    praesens: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'],
    praeteritum: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
    konjunktiv2: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'],
    partizip2: 'gesollt',
    auxiliary: 'haben',
  },
  wollen: {
    praesens: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'],
    praeteritum: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
    konjunktiv2: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'],
    partizip2: 'gewollt',
    auxiliary: 'haben',
  },
  mögen: {
    praesens: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'],
    praeteritum: ['mochte', 'mochtest', 'mochte', 'mochten', 'mochtet', 'mochten'],
    konjunktiv2: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten'],
    partizip2: 'gemocht',
    auxiliary: 'haben',
  },
};

/** Konjunktiv I особых глаголов: sein, haben, werden. */
export const KONJUNKTIV1_SPECIAL: Record<string, string[]> = {
  sein: ['sei', 'seist', 'sei', 'seien', 'seiet', 'seien'],
  haben: ['habe', 'habest', 'habe', 'haben', 'habet', 'haben'],
  werden: ['werde', 'werdest', 'werde', 'werden', 'werdet', 'werden'],
};
