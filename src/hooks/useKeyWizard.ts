/**
 * Логика мастера ключа: проверка, сохранение в аккаунт (если вошёл) или на устройство,
 * повторная проверка и удаление сохранённого ключа.
 * Тексты подписей живут в компонентах (keys.*), здесь только действия и состояние.
 */
import { useCallback, useRef, useState } from 'react';
import type { KeyProvider } from '../../shared/types';
import { api, ApiClientError } from '../api/client';
import { keyStateFor } from '../lib/accountKeys';
import { useAccountErrorText } from '../lib/accountError';
import { pasteFromClipboard } from '../lib/clipboard';
import { useAccount } from './useAccount';
import { useKeyTest } from './useKeyTest';
import { useSettings } from './useSettings';

export type WizardCheck = 'idle' | 'testing' | 'ok' | 'fail';

export function useKeyWizard(provider: KeyProvider) {
  const { keys, saveKey, removeKey } = useSettings();
  const { account, status: accountStatus, refresh } = useAccount();
  const errorText = useAccountErrorText();

  const [value, setValue] = useState('');
  const [check, setCheck] = useState<WizardCheck>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<'account' | 'device' | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const { test, reset } = useKeyTest();

  const signedIn = accountStatus === 'signedIn';
  const state = keyStateFor(provider, account?.keys[provider] ?? null, keys);

  const verify = useCallback(
    async (key: string) => {
      setCheck('testing');
      setMessage(null);
      const result = await test(provider, key);
      setCheck(result.ok ? 'ok' : 'fail');
      setLatencyMs(result.latencyMs);
      setMessage(result.message);
      return result.ok;
    },
    [provider, test],
  );

  /** Ввёл или вставил ключ — сразу проверяем, ничего нажимать не нужно. */
  const updateValue = useCallback(
    (next: string) => {
      setValue(next);
      setSaveError(null);
      setSavedNotice(null);
      reset();
      setCheck('idle');
      setMessage(null);
      const trimmed = next.trim();
      if (trimmed.length >= 20) void verify(trimmed);
    },
    [reset, verify],
  );

  const paste = useCallback(async (): Promise<'pasted' | 'manual-focus'> => {
    const text = await pasteFromClipboard();
    if (text) {
      updateValue(text.trim());
      return 'pasted';
    }
    // iPhone может не дать прочитать буфер обмена — просто ставим курсор в поле.
    inputRef.current?.focus();
    return 'manual-focus';
  }, [updateValue]);

  const save = useCallback(async (): Promise<boolean> => {
    const key = value.trim();
    if (!key) return false;
    setSaving(true);
    setSaveError(null);
    try {
      // Перед сохранением ещё раз убеждаемся, что ключ рабочий.
      const ok = await verify(key);
      if (!ok) return false; // причина уже показана под полем

      if (signedIn && account?.keysStorageEnabled) {
        try {
          const stored = await api.saveAccountKey(provider, { key });
          await refresh();
          if (stored.key.last4) removeKey(provider);
          setSavedNotice('account');
        } catch (error) {
          // Сервер выключил хранение ключей — сохраняем на устройстве, как раньше.
          // Остальные ошибки показываем: молча класть ключ не туда нельзя.
          if (error instanceof ApiClientError && error.code === 'KEYS_STORAGE_DISABLED') {
            saveKey(provider, key);
            setSavedNotice('device');
          } else {
            throw error;
          }
        }
      } else {
        saveKey(provider, key);
        setSavedNotice('device');
      }
      setValue('');
      inputRef.current?.blur();
      return true;
    } catch (error) {
      setSaveError(errorText(error));
      return false;
    } finally {
      setSaving(false);
    }
  }, [account, errorText, provider, refresh, removeKey, saveKey, signedIn, value, verify]);

  /** Проверка уже сохранённого ключа (в аккаунте или на устройстве). */
  const retest = useCallback(async () => {
    setCheck('testing');
    setMessage(null);
    try {
      if (state.stored) {
        const response = await api.testAccountKey(provider);
        setCheck(response.ok ? 'ok' : 'fail');
        setLatencyMs(response.latencyMs);
        setMessage(response.message);
        return;
      }
      const localKey = keys[provider];
      if (localKey) await verify(localKey);
    } catch (error) {
      setCheck('fail');
      setMessage(errorText(error));
    }
  }, [errorText, keys, provider, state.stored, verify]);

  const remove = useCallback(async () => {
    try {
      if (state.stored) {
        await api.deleteAccountKey(provider);
        await refresh();
      }
      if (state.local) removeKey(provider);
      setCheck('idle');
      setLatencyMs(null);
      setMessage(null);
      setSavedNotice(null);
    } catch (error) {
      // Удалить не удалось — показываем понятную причину, ключ остаётся на месте.
      setSaveError(errorText(error));
    }
  }, [errorText, provider, refresh, removeKey, state.local, state.stored]);

  return {
    provider,
    value,
    updateValue,
    inputRef,
    paste,
    check,
    latencyMs,
    message,
    retest,
    save,
    saving,
    saveError,
    savedNotice,
    remove,
    state,
    signedIn,
    keysStorageEnabled: account?.keysStorageEnabled ?? false,
  };
}
