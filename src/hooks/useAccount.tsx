/**
 * Состояние входа в аккаунт. Один логин и пароль работают на всех устройствах:
 * ключи ИИ, избранное и история у вошедшего пользователя везде одинаковые.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccountInfo } from '../../shared/types';
import { ApiClientError, api } from '../api/client';
import { STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';
import { clearSessionToken, setSessionToken } from '../lib/sessionToken';

export interface AccountContextValue {
  /** null — проверяем, false — не вошёл, true — вошёл. */
  status: 'loading' | 'anonymous' | 'signedIn';
  account: AccountInfo | null;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  /** Обновляет данные профиля с сервера (после сохранения ключа и т.п.). */
  refresh: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

/** Подпись устройства для списка «Мои устройства». */
function deviceName(): string {
  const agent = navigator.userAgent;
  if (/iphone|ipod/i.test(agent)) return 'iPhone';
  if (/ipad/i.test(agent)) return 'iPad';
  if (/android/i.test(agent)) return 'Android';
  if (/windows/i.test(agent)) return 'Windows';
  if (/macintosh|mac os/i.test(agent)) return 'Mac';
  if (/linux/i.test(agent)) return 'Linux';
  return '';
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccountContextValue['status']>('loading');
  const [account, setAccount] = useState<AccountInfo | null>(null);

  // При запуске спрашиваем сервер: сессия в cookie или токен в localStorage ещё живы?
  useEffect(() => {
    const controller = new AbortController();
    api
      .me(controller.signal)
      .then((data) => {
        setAccount(data);
        setStatus('signedIn');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // Истёкшая сессия — это не ошибка сети, просто «не вошёл».
        if (error instanceof ApiClientError && (error.code === 'UNAUTHORIZED' || error.code === 'SESSION_EXPIRED')) {
          clearSessionToken();
        }
        setAccount(null);
        setStatus('anonymous');
      });
    return () => controller.abort();
  }, []);

  const adoptSession = useCallback((data: AccountInfo) => {
    setAccount(data);
    setStatus('signedIn');
    writeStorage(STORAGE_KEYS.lastLogin, data.login);
  }, []);

  const login = useCallback(
    async (loginName: string, password: string) => {
      const response = await api.login({ login: loginName, password, device: deviceName() });
      setSessionToken(response.token);
      adoptSession(response.account);
    },
    [adoptSession],
  );

  const register = useCallback(
    async (loginName: string, password: string) => {
      // Ключи с устройства сервер перенесёт в аккаунт сам — они уходят в заголовках.
      const response = await api.register({ login: loginName, password, device: deviceName() });
      setSessionToken(response.token);
      adoptSession(response.account);
    },
    [adoptSession],
  );

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    clearSessionToken();
    setAccount(null);
    setStatus('anonymous');
  }, []);

  const logoutAll = useCallback(async () => {
    await api.logoutAll();
    clearSessionToken();
    setAccount(null);
    setStatus('anonymous');
  }, []);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      const data = await api.changePassword({ oldPassword, newPassword });
      adoptSession(data);
    },
    [adoptSession],
  );

  const deleteAccount = useCallback(async (password: string) => {
    await api.deleteAccount(password);
    clearSessionToken();
    setAccount(null);
    setStatus('anonymous');
  }, []);

  const refresh = useCallback(async () => {
    try {
      adoptSession(await api.me());
    } catch {
      // Сеть пропала — оставляем данные, которые уже есть на экране.
    }
  }, [adoptSession]);

  const value = useMemo(
    () => ({ status, account, login, register, logout, logoutAll, changePassword, deleteAccount, refresh }),
    [status, account, login, register, logout, logoutAll, changePassword, deleteAccount, refresh],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount должен использоваться внутри AccountProvider');
  return context;
}

/** Логин последнего удачного входа — для автозаполнения формы. */
export function lastLoginName(): string {
  const value = readStorage<string>(STORAGE_KEYS.lastLogin, '');
  return typeof value === 'string' ? value : '';
}
