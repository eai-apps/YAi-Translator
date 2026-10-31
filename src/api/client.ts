/**
 * Единая точка всех запросов к бэкенду. Компоненты не вызывают fetch напрямую.
 * Механизм запроса — в request.ts, группы методов — в api/methods/*.
 */
import { adminMethods } from './methods/admin';
import { accountMethods } from './methods/account';
import { coreMethods } from './methods/core';
import { grammarMethods } from './methods/grammar';

export { ApiClientError, setApiUiLanguage } from './request';
export type { ClientErrorCode } from './request';

/** Все методы API: перевод, карточка, словари, ресурсы, грамматика, «Спросить у AI», аккаунт, админка. */
export const api = {
  ...coreMethods,
  ...grammarMethods,
  ...accountMethods,
  ...adminMethods,
};
