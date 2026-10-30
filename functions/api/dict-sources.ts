/**
 * GET /api/dict-sources — справочник словарных источников для страницы «О приложении»
 * (подписи лицензий CC BY-SA у Wiktionary и CC BY 2.0 FR у Tatoeba и ссылки на сайты).
 */
import type { DictSourceRef } from '../../shared/types';
import { DICT } from '../_lib/config';
import type { Env } from '../_lib/env';
import { errorResponse, getUiLanguage, jsonResponse } from '../_lib/http';
import { SOURCE_NAMES } from '../_lib/dict';

/** Все источники, которые может использовать сайт, включая необязательные. */
export const ALL_DICT_SOURCES: DictSourceRef[] = [
  { id: 'wiktionary', name: SOURCE_NAMES.wiktionary, url: DICT.wiktionaryPage },
  { id: 'openthesaurus', name: SOURCE_NAMES.openthesaurus, url: `${DICT.openThesaurusPage}/impressum/` },
  { id: 'tatoeba', name: SOURCE_NAMES.tatoeba, url: 'https://tatoeba.org/de' },
  { id: 'pons', name: SOURCE_NAMES.pons, url: DICT.ponsPage },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const uiLang = getUiLanguage(context.request);
  try {
    const items: Array<DictSourceRef & { available: boolean }> = ALL_DICT_SOURCES.map((source) => ({
      ...source,
      // PONS работает только с ключом; остальные источники доступны всегда.
      available: source.id === 'pons' ? Boolean(context.env.PONS_API_KEY) : true,
    }));
    return jsonResponse({ items });
  } catch (error) {
    return errorResponse(error, uiLang);
  }
};
