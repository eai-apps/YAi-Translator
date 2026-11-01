/**
 * Общие типы API. Используются и фронтендом (src), и бэкендом (functions).
 * Меняя тип, проверьте обе стороны.
 *
 * Файл был длиннее 400 строк, поэтому сами типы разложены по смыслу:
 *   typeCore.ts       коды ошибок и мелочи (SourceLanguage, CefrLevel …);
 *   typeTasks.ts      задачи и провайдеры ИИ;
 *   typeTranslate.ts  перевод и сравнение переводчиков;
 *   typeWord.ts       карточка слова, разбор и проверка текста;
 *   typeAccount.ts    аккаунт, ключи, синхронизация, служебные ответы;
 *   admin.ts, dict.ts, grammar.ts — админка, словари/ресурсы, грамматика и «Спросить у AI».
 * Импорт везде один: `import type { … } from '../shared/types'`.
 */
export * from './typeCore';
export * from './typeTasks';
export * from './typeTranslate';
export * from './typeWord';
export * from './typeAccount';
export * from './admin';
export * from './dict';
export * from './grammar';
export * from './study';
export * from './suggest';
export * from './lexicon';
export * from './phrasebook';
export * from './letter';

import type { LanguageCode, UiLanguage } from './languages';

export type { LanguageCode, UiLanguage };
