/** О приложении: лимиты, подключённые сервисы, версия. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HealthResponse, ProviderId } from '../../../shared/types';
import { api } from '../../api/client';
import { APP_VERSION } from '../../config';
import { cn } from '../../lib/cn';
import { providerLabel } from '../../lib/errors';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

const PROVIDERS: ProviderId[] = ['gemini', 'groq', 'deepl', 'workersai'];

export function AboutCard() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .health(controller.signal)
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
    return () => controller.abort();
  }, []);

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('profile.limitsTitle')}</SectionTitle>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {t('profile.limitsText', { limit: health ? health.limits.freeRequestsPerDay : '—' })}
      </p>

      <div className="mt-4">
        <SectionTitle>{t('profile.providersTitle')}</SectionTitle>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {PROVIDERS.map((provider) => {
            const active = health?.providers[provider] ?? false;
            return (
              <li
                key={provider}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
                  active ? 'bg-soft text-ink' : 'bg-soft text-muted line-through',
                )}
              >
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-success' : 'bg-muted')}
                  aria-hidden="true"
                />
                {providerLabel(provider)}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
        <p>
          {t('profile.versionLabel')}: {APP_VERSION}
        </p>
        <p>{t('profile.privacy')}</p>
      </div>
    </Card>
  );
}
