/**
 * «Сервисы сайта»: какие сервисы настроены, какой это тип (ИИ или переводчик)
 * и кнопка настоящей проверки — каждый сервис получает маленький запрос.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HealthResponse, ProviderId, ServiceCheck } from '../../../shared/types';
import { api } from '../../api/client';
import { useAccountErrorText } from '../../lib/accountError';
import { providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { IconAlert, IconCheck } from '../layout/icons';

/** Порядок показа: сначала ИИ, затем переводчики. */
const AI_PROVIDERS: ProviderId[] = ['gemini', 'groq', 'workersai'];
const TRANSLATOR_PROVIDERS: ProviderId[] = ['deepl', 'microsoft', 'google', 'mymemory', 'm2m100'];
const ALL_PROVIDERS: ProviderId[] = [...AI_PROVIDERS, ...TRANSLATOR_PROVIDERS];

/** Результат проверки для значка у сервиса. */
function CheckMark({ check }: { check: ServiceCheck }) {
  if (check.ok) {
    return <IconCheck className="h-3.5 w-3.5 text-success" />;
  }
  return <IconAlert className="h-3.5 w-3.5 text-danger" />;
}

export function SiteServicesCard() {
  const { t } = useTranslation();
  const errorText = useAccountErrorText();

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // При открытии профиля — только список «настроен / не настроен», без трат лимитов.
  useEffect(() => {
    const controller = new AbortController();
    api
      .health(controller.signal)
      .then((data) => setHealth(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const runCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      setHealth(await api.healthCheck());
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setChecking(false);
    }
  };

  const checks = health?.checks;

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle>{t('services.title')}</SectionTitle>
      <p className="mt-2 text-xs leading-relaxed text-muted">{t('services.intro')}</p>

      <ul className="mt-3 divide-y divide-line">
        {ALL_PROVIDERS.map((provider) => {
          const configured = health?.providers[provider] ?? false;
          const check = checks?.[provider] ?? null;
          const isAi = AI_PROVIDERS.includes(provider);
          return (
            <li key={provider} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm">
                  {providerLabel(provider)}
                  <span className="rounded-full bg-soft px-1.5 py-0.5 text-[10px] font-medium text-muted">
                    {isAi ? t('services.kindAi') : t('services.kindTranslator')}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {check
                    ? check.ok
                      ? t('services.answered', { ms: check.latencyMs })
                      : (check.message ?? t('services.noAnswer'))
                    : configured
                      ? t('services.configured')
                      : t('services.notConfigured')}
                </p>
              </div>
              <div className="shrink-0">
                {check ? (
                  <CheckMark check={check} />
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full ${configured ? 'bg-success' : 'bg-muted'} block`}
                    aria-hidden="true"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {checks && health?.checksCached ? (
        <p className="mt-2 text-xs text-muted">{t('services.cached')}</p>
      ) : null}

      <Button size="sm" variant="primary" className="mt-3" loading={checking} onClick={() => void runCheck()}>
        {checking ? t('services.checking') : t('services.checkAll')}
      </Button>
    </Card>
  );
}
