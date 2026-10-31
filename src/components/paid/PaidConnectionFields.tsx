/**
 * Поля подключения платной нейросети (админка и профиль): 1) сервис из списка или свой адрес,
 * 2) ключ (сервис определяется по ключу сам), 3) «Загрузить модели» → список моделей с поиском и ценой.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CUSTOM_PRESET_ID, PAID_PRESETS, presetForKey, presetForUrl } from '../../lib/paidPresets';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

export interface PaidModelItem {
  id: string;
  priceIn?: number;
  slow?: boolean;
  isSlowOrExpensive?: boolean;
}

interface Props {
  baseUrl: string;
  onBaseUrl: (value: string) => void;
  apiKey: string;
  onApiKey: (value: string) => void;
  models: PaidModelItem[];
  model: string;
  onModel: (value: string) => void;
  onLoadModels: () => void;
  loading: boolean;
}

const FIELD = 'w-full h-9 rounded-lg border border-line bg-card px-3 text-sm text-ink';

function priceLabel(price: number | undefined): string | null {
  if (price === undefined || Number.isNaN(price)) return null;
  if (price === 0) return 'free';
  return `$${price < 1 ? price.toFixed(2) : price.toFixed(1)} / 1M`;
}

export function PaidConnectionFields(props: Props) {
  const { t } = useTranslation();
  const { baseUrl, onBaseUrl, apiKey, onApiKey, models, model, onModel, onLoadModels, loading } = props;
  const [query, setQuery] = useState('');
  const presetId = presetForUrl(baseUrl);
  const [custom, setCustom] = useState(presetId === CUSTOM_PRESET_ID);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? models.filter((item) => item.id.toLowerCase().includes(q)) : models;
  }, [models, query]);

  const choosePreset = (id: string) => {
    if (id === CUSTOM_PRESET_ID) {
      setCustom(true);
      return;
    }
    setCustom(false);
    const preset = PAID_PRESETS.find((item) => item.id === id);
    if (preset) onBaseUrl(preset.url);
  };

  const changeKey = (value: string) => {
    onApiKey(value);
    // Узнали сервис по ключу — подставляем его адрес (если человек не выбрал свой адрес вручную).
    const detected = presetForKey(value);
    if (detected && !custom) onBaseUrl(detected.url);
  };

  return (
    <div className="space-y-3 text-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('paidPicker.service')}</label>
        <select value={custom ? CUSTOM_PRESET_ID : presetId} onChange={(e) => choosePreset(e.target.value)} className={FIELD}>
          {PAID_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
          <option value={CUSTOM_PRESET_ID}>{t('paidPicker.custom')}</option>
        </select>
        {custom || presetId === CUSTOM_PRESET_ID ? (
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => onBaseUrl(e.target.value)}
            placeholder="https://…/v1"
            className={cn(FIELD, 'mt-2')}
          />
        ) : (
          <p className="mt-1 text-[11px] text-muted">Base URL: {baseUrl}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">{t('paidPicker.key')}</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => changeKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            className={cn(FIELD, 'flex-1')}
          />
          <Button type="button" size="sm" variant="secondary" loading={loading} onClick={onLoadModels}>
            {t('paidPicker.load')}
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted">{t('paidPicker.keyHint')}</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          {t('paidPicker.model')}
          {models.length > 0 ? ` · ${t('paidPicker.found', { count: models.length })}` : ''}
        </label>
        {models.length > 0 ? (
          <>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('paidPicker.search')}
              className={FIELD}
            />
            <ul className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line bg-card">
              {filtered.map((item) => {
                const price = priceLabel(item.priceIn);
                const slow = item.slow ?? item.isSlowOrExpensive;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onModel(item.id)}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left text-xs last:border-b-0 hover:bg-soft',
                        item.id === model && 'bg-accentSoft text-accent',
                      )}
                    >
                      <span className={cn('h-3 w-3 shrink-0 rounded-full border', item.id === model ? 'border-accent bg-accent' : 'border-line')} />
                      <span className="min-w-0 flex-1 truncate font-medium">{item.id}</span>
                      {slow ? <span className="shrink-0 text-[10px] text-warning">{t('paidPicker.slow')}</span> : null}
                      {price ? <span className="shrink-0 text-[10px] text-muted">{price}</span> : null}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 ? <li className="px-3 py-2 text-xs text-muted">{t('paidPicker.nothing')}</li> : null}
            </ul>
          </>
        ) : (
          <input
            type="text"
            value={model}
            onChange={(e) => onModel(e.target.value)}
            placeholder={t('paidPicker.modelPlaceholder')}
            className={FIELD}
          />
        )}
      </div>
    </div>
  );
}
