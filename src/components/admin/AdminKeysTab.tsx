/**
 * Вкладка «Ключи сайта»: список ключей каждого сервиса с состоянием,
 * проверка, добавление (проверяется настоящим запросом) и удаление.
 * Логика — в useAdminKeys.ts.
 */
import { useTranslation } from 'react-i18next';
import type { KeyHealth, SiteKeyInfo } from '../../../shared/types';
import { SITE_KEY_PROVIDERS } from '../../../shared/types';
import { useAdminKeys } from '../../hooks/useAdminKeys';
import { providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { AddSiteKeyForm } from './AddSiteKeyForm';
import { ProviderSwitches } from './ProviderSwitches';

const HEALTH_CLASSES: Record<KeyHealth, string> = {
  ok: 'bg-success/15 text-success',
  resting: 'bg-accentSoft text-accent',
  invalid: 'bg-danger/15 text-danger',
};

/** «Работает» / «Отдыхает до 03:00» / «Неверный» на языке интерфейса. */
export function useKeyHealthLabel() {
  const { t, i18n } = useTranslation();
  return (item: SiteKeyInfo): string => {
    if (item.health === 'invalid') return t('admin.keys.statusInvalid');
    if (item.health === 'resting') {
      const time = item.exhaustedUntil
        ? new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(
            new Date(item.exhaustedUntil),
          )
        : '';
      return t('admin.keys.statusResting', { time });
    }
    return t('admin.keys.statusOk');
  };
}

export function AdminKeysTab({ onError }: { onError: (message: string | null) => void }) {
  const { t, i18n } = useTranslation();
  const keys = useAdminKeys(onError);
  const healthLabel = useKeyHealthLabel();

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionTitle>{t('admin.keys.title')}</SectionTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.keys.intro')}</p>
        {keys.data && !keys.data.storageEnabled ? (
          <p className="mt-2 rounded-xl bg-soft px-3 py-2 text-xs leading-relaxed text-muted">
            {t('admin.keys.storageDisabled')}
          </p>
        ) : null}
        {keys.notice ? <p className="mt-2 text-sm text-ink">{keys.notice}</p> : null}
      </Card>

      <ProviderSwitches onError={onError} />

      {SITE_KEY_PROVIDERS.map((current) => {
        const items = (keys.data?.keys ?? []).filter((item) => item.provider === current);
        return (
          <Card key={current} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionTitle>{providerLabel(current)}</SectionTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    // Выбираем этот сервис в форме добавления и прокручиваем к ней.
                    keys.setProvider(current);
                    document.getElementById('add-site-key')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  {t('admin.keys.addMore')}
                </Button>
                <Button
                  size="sm"
                  loading={keys.busy === `test-${current}`}
                  disabled={items.length === 0}
                  onClick={() => void keys.testProvider(current)}
                >
                  {t('admin.keys.test')}
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t('admin.keys.noKeys')}</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="font-mono text-sm">{item.mask}</span>
                    <span className="rounded-full bg-soft px-1.5 py-0.5 text-[10px] font-medium text-muted">
                      {item.source === 'cloudflare' ? t('admin.keys.sourceCloudflare') : t('admin.keys.sourceAdmin')}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${HEALTH_CLASSES[item.health]}`}>
                      {healthLabel(item)}
                    </span>
                    <span className="text-[11px] text-muted">
                      {item.lastUsedAt
                        ? new Intl.DateTimeFormat(i18n.language, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(item.lastUsedAt))
                        : t('admin.keys.neverUsed')}
                    </span>
                    {item.lastError && item.health !== 'ok' ? (
                      <span className="w-full truncate text-[11px] text-danger" title={item.lastError}>
                        {t('admin.keys.lastError')}: {item.lastError}
                      </span>
                    ) : null}
                    {item.source === 'admin' ? (
                      <Button
                        size="sm"
                        variant="danger"
                        className="ml-auto"
                        loading={keys.busy === `remove-${item.id}`}
                        onClick={() => void keys.removeKey(item)}
                      >
                        {t('admin.keys.remove')}
                      </Button>
                    ) : (
                      <span className="ml-auto text-[11px] text-muted" title={t('admin.keys.cloudflareHint')}>
                        {t('admin.keys.cloudflareOnly')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      <AddSiteKeyForm keys={keys} />
    </div>
  );
}
