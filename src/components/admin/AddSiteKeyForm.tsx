/** Форма «Добавить ключ»: сервис, ключ (для Lara «id:secret»), регион Microsoft. */
import { useTranslation } from 'react-i18next';
import type { SiteKeyProvider } from '../../../shared/types';
import { SITE_KEY_PROVIDERS } from '../../../shared/types';
import type { useAdminKeys } from '../../hooks/useAdminKeys';
import { providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

export function AddSiteKeyForm({ keys }: { keys: ReturnType<typeof useAdminKeys> }) {
  const { t } = useTranslation();

  return (
    <Card className="p-4">
      <SectionTitle>{t('admin.keys.addTitle')}</SectionTitle>
      <div className="mt-2 space-y-2">
        <label className="block text-xs text-muted">
          <span>{t('admin.keys.provider')}</span>
          <select
            value={keys.provider}
            onChange={(event) => keys.setProvider(event.target.value as SiteKeyProvider)}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink"
          >
            {SITE_KEY_PROVIDERS.map((item) => (
              <option key={item} value={item}>
                {providerLabel(item)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-muted">
          <span>{t('admin.keys.key')}</span>
          <input
            type="password"
            value={keys.keyValue}
            onChange={(event) => keys.setKeyValue(event.target.value)}
            placeholder={t('admin.keys.keyPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3 font-mono text-sm text-ink"
          />
        </label>

        {keys.provider === 'lara' ? (
          <p className="text-[11px] leading-relaxed text-muted">{t('admin.keys.laraHint')}</p>
        ) : null}

        {keys.provider === 'microsoft' ? (
          <label className="block text-xs text-muted">
            <span>{t('admin.keys.region')}</span>
            <input
              type="text"
              value={keys.region}
              onChange={(event) => keys.setRegion(event.target.value)}
              placeholder="westeurope"
              autoComplete="off"
              className="mt-1 h-11 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink"
            />
          </label>
        ) : null}

        <Button
          variant="primary"
          loading={keys.busy === 'add'}
          disabled={!keys.keyValue.trim() || !keys.data?.storageEnabled}
          onClick={() => void keys.addKey()}
        >
          {keys.busy === 'add' ? t('admin.keys.adding') : t('admin.keys.add')}
        </Button>
      </div>
    </Card>
  );
}
