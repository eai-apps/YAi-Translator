/** Понятные тексты ошибок входа, ключей и синхронизации (без технических кодов). */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError } from '../api/client';
import type { ClientErrorCode } from '../api/client';

const MESSAGE_KEYS: Partial<Record<ClientErrorCode, string>> = {
  INVALID_CREDENTIALS: 'account.errors.invalidCredentials',
  TOO_MANY_ATTEMPTS: 'account.errors.tooManyAttempts',
  LOGIN_TAKEN: 'account.errors.loginTaken',
  LOGIN_INVALID: 'account.errors.loginInvalid',
  PASSWORD_TOO_SHORT: 'account.errors.passwordTooShort',
  UNAUTHORIZED: 'account.errors.unauthorized',
  SESSION_EXPIRED: 'account.errors.sessionExpired',
  KEYS_STORAGE_DISABLED: 'account.errors.keysStorageDisabled',
  KEY_NO_ACCESS: 'account.errors.keyNoAccess',
  NETWORK: 'errors.network',
  VALIDATION: 'errors.validation',
  TEXT_TOO_LONG: 'errors.tooLong',
  RATE_LIMITED: 'errors.rate',
  NOT_FOUND: 'errors.unknown',
  INTERNAL: 'errors.server',
};

/** Возвращает готовую строку на языке интерфейса. */
export function useAccountErrorText(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiClientError) {
        const key = MESSAGE_KEYS[error.code];
        if (key) return t(key);
      }
      return t('errors.unknown');
    },
    [t],
  );
}
