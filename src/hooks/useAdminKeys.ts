/**
 * Загрузка и действия вкладки «Ключи сайта»: список, проверка, добавление, удаление.
 * Всё состояние держит хук, чтобы компонент остался коротким.
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminSiteKeysResponse, SiteKeyInfo, SiteKeyProvider } from '../../shared/types';
import { api } from '../api/client';
import { providerLabel } from '../lib/errors';

export function useAdminKeys(onError: (message: string | null) => void) {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminSiteKeysResponse | null>(null);
  const [provider, setProvider] = useState<SiteKeyProvider>('gemini');
  const [keyValue, setKeyValue] = useState('');
  const [region, setRegion] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await api.adminKeys());
      onError(null);
    } catch {
      onError(t('admin.loadError'));
    }
  }, [onError, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addKey = async () => {
    setBusy('add');
    setNotice(null);
    try {
      await api.adminAddKey({
        provider,
        key: keyValue.trim(),
        ...(provider === 'microsoft' && region.trim() ? { region: region.trim() } : {}),
      });
      setKeyValue('');
      setRegion('');
      setNotice(t('admin.keys.added'));
      await reload();
    } catch {
      setNotice(t('admin.keys.addFailed'));
    } finally {
      setBusy(null);
    }
  };

  const testProvider = async (target: SiteKeyProvider) => {
    setBusy(`test-${target}`);
    setNotice(null);
    try {
      const result = await api.adminTestKey(target);
      setNotice(
        result.ok
          ? `${providerLabel(target)}: ${t('admin.keys.testOk', { ms: result.latencyMs })}`
          : `${providerLabel(target)}: ${t('admin.keys.testFail')} ${result.message ?? ''}`.trim(),
      );
    } catch {
      setNotice(t('admin.keys.testFail'));
    } finally {
      setBusy(null);
    }
  };

  const removeKey = async (item: SiteKeyInfo) => {
    if (!window.confirm(t('admin.keys.confirmRemove'))) return;
    setBusy(`remove-${item.id}`);
    setNotice(null);
    try {
      await api.adminRemoveKey(item.provider, item.id);
      setNotice(t('admin.keys.removed'));
      await reload();
    } catch {
      onError(t('admin.loadError'));
    } finally {
      setBusy(null);
    }
  };

  return {
    data,
    provider,
    setProvider,
    keyValue,
    setKeyValue,
    region,
    setRegion,
    busy,
    notice,
    addKey,
    testProvider,
    removeKey,
  };
}
