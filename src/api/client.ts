/**
 * Единая точка всех запросов к бэкенду. Компоненты не вызывают fetch напрямую.
 * Механизм запроса — в request.ts, группы методов — в api/methods/*.
 */
import { adminMethods } from './methods/admin';
import { accountMethods } from './methods/account';
import { coreMethods } from './methods/core';

export { ApiClientError, setApiUiLanguage } from './request';
export type { ClientErrorCode } from './request';

/** Все методы API: перевод, карточка, словари, ресурсы, аккаунт, ключи, синхронизация, админка. */
export const api = {
  ...coreMethods,
  ...accountMethods,
  ...adminMethods,
};
