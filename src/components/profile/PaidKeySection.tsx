/**
 * Секция «Платная нейросеть» и «Где купить ключ от 1$» в профиле.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BuyLinkItem } from '../../../shared/types';
import { api } from '../../api/client';
import { storeBuild, STORAGE_KEYS } from '../../config';
import { getUserKeys } from '../../lib/userKeys';
import { writeStorage } from '../../lib/storage';
import { Button } from '../ui/Button';
import { PaidConnectionFields } from '../paid/PaidConnectionFields';
import { IconTrash } from '../layout/icons';

export function PaidKeySection() {
  const { t, i18n } = useTranslation();
  const build = storeBuild();
  const isIos = build === 'ios';
  const hideBuyLinks = isIos || build === 'android';

  const [keys, setKeys] = useState(getUserKeys);
  const [baseUrl, setBaseUrl] = useState(keys.paidUrl || 'https://openrouter.ai/api/v1');
  const [apiKey, setApiKey] = useState(keys.paidKey || '');
  const [model, setModel] = useState(keys.paidModel || '');
  const [models, setModels] = useState<Array<{ id: string; priceIn?: number; slow: boolean }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // Ссылки покупки
  const [buyLinks, setBuyLinks] = useState<BuyLinkItem[]>([]);
  const [openHowto, setOpenHowto] = useState<number | null>(null);

  useEffect(() => {
    if (!hideBuyLinks) {
      void api.publicBuyLinks().then((res) => setBuyLinks(res.items)).catch(() => {});
    }
  }, [hideBuyLinks]);

  const loadModels = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) return;
    setLoadingModels(true);
    setTestResult(null);
    try {
      const res = await api.fetchPaidModels(baseUrl.trim(), apiKey.trim());
      setModels(res.models);
      if (res.models.length > 0 && !model) {
        setModel(res.models[0].id);
      }
    } catch {
      setTestResult(t('keys.paid.loadModelsError'));
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTest = async () => {
    if (!baseUrl.trim() || !apiKey.trim() || !model.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testPaidModel(baseUrl.trim(), apiKey.trim(), model.trim());
      setTestResult(res.ok ? t('keys.paid.testSuccess') : res.message || t('keys.paid.testFail'));
    } catch {
      setTestResult(t('keys.paid.testFail'));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const updated = {
      ...keys,
      paidUrl: baseUrl.trim(),
      paidKey: apiKey.trim(),
      paidModel: model.trim(),
    };
    writeStorage(STORAGE_KEYS.keys, updated);
    setKeys(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleRemove = () => {
    const updated = {
      ...keys,
      paidUrl: undefined,
      paidKey: undefined,
      paidModel: undefined,
    };
    writeStorage(STORAGE_KEYS.keys, updated);
    setKeys(updated);
    setBaseUrl('https://openrouter.ai/api/v1');
    setApiKey('');
    setModel('');
    setTestResult(null);
  };

  const hasKey = Boolean(keys.paidUrl && keys.paidKey && keys.paidModel);

  return (
    <div className="rounded-2xl border border-line p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {isIos ? t('keys.paid.iosTitle') : t('keys.paid.title')}
        </h4>
        {hasKey && (
          <span className="rounded-full bg-accentSoft px-2 py-0.5 text-[11px] font-medium text-accent">
            {t('keys.paid.active')}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <PaidConnectionFields
          baseUrl={baseUrl}
          onBaseUrl={setBaseUrl}
          apiKey={apiKey}
          onApiKey={setApiKey}
          models={models}
          model={model}
          onModel={setModel}
          onLoadModels={() => void loadModels()}
          loading={loadingModels}
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="primary" onClick={handleSave}>
            {t('common.save')}
          </Button>
          <Button size="sm" variant="ghost" loading={testing} onClick={() => void handleTest()}>
            {t('keys.paid.testBtn')}
          </Button>
          {hasKey && (
            <Button size="sm" variant="ghost" onClick={handleRemove}>
              <IconTrash className="h-4 w-4 text-danger" />
            </Button>
          )}
          {savedNotice && <span className="text-xs text-success">{t('common.saved')}</span>}
          {testResult && <span className="text-xs text-ink">{testResult}</span>}
        </div>
      </div>

      {/* Блок «Купить ключ от 1$» */}
      {!hideBuyLinks && buyLinks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-line space-y-2">
          <h5 className="text-xs font-semibold text-ink">{t('keys.buy.title')}</h5>
          <p className="text-xs text-muted">{t('keys.buy.hint')}</p>
          <div className="space-y-1.5 pt-1">
            {buyLinks.map((link) => {
              const howto =
                i18n.language === 'de' ? link.howtoDe : i18n.language === 'en' ? link.howtoEn : link.howtoRu;
              return (
                <div key={link.id} className="rounded-xl border border-line bg-soft p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <span>{link.title}</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                    {howto && (
                      <button
                        type="button"
                        onClick={() => setOpenHowto(openHowto === link.id ? null : link.id)}
                        className="text-[11px] text-muted hover:text-ink underline"
                      >
                        {openHowto === link.id ? t('keys.buy.hideHowto') : t('keys.buy.showHowto')}
                      </button>
                    )}
                  </div>
                  {openHowto === link.id && howto && (
                    <div className="mt-2 text-muted whitespace-pre-line border-t border-line/60 pt-2 text-[11px] leading-relaxed">
                      {howto}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
