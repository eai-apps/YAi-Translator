/**
 * «Что нового»: сервисы сайта с настоящей проверкой (общая карточка профиля и «О приложении»)
 * и история версий списком.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HealthResponse, ProviderId, ServiceCheck, UiLanguage } from '../../../shared/types';
import { api } from '../../api/client';
import { changelogItems } from '../../data/changelog';
import { useAccountErrorText } from '../../lib/accountError';
import { providerLabel } from '../../lib/errors';
import { Button } from '../ui/Button';
import { SectionTitle } from '../ui/SectionTitle';
import { IconAlert, IconCheck } from '../layout/icons';

/** Порядок показа: сначала ИИ, затем переводчики. */
export const AI_PROVIDERS: ProviderId[] = ['gemini', 'groq', 'workersai'];
export const TRANSLATOR_PROVIDERS: ProviderId[] = ['deepl', 'lara', 'microsoft', 'google', 'mymemory', 'm2m100'];
export const ALL_PROVIDERS: ProviderId[] = [...AI_PROVIDERS, ...TRANSLATOR_PROVIDERS];

function CheckMark({ check }: { check: ServiceCheck }) {
  if (check.ok) return <IconCheck className="h-3.5 w-3.5 text-success" />;
  return <IconAlert className="h-3.5 w-3.5 text-danger" />;
}

/** Список сервисов: «настроен / не настроен» и кнопка настоящей проверки. */
export function ServicesStatus() {
  const { t } = useTranslation();
  const errorText = useAccountErrorText();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // При открытии — только список, без трат лимитов сервисов.
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
    <>
      <ul className="mt-3 divide-y divide-line">
        {ALL_PROVIDERS.map((provider) => {
          const configured = health?.providers[provider] ?? false;
          const check = checks?.[provider] ?? null;
          const isAi = AI_PROVIDERS.includes(provider);
          return (
            <li key={provider} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-sm">
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
                    className={`block h-2 w-2 rounded-full ${configured ? 'bg-success' : 'bg-muted'}`}
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
    </>
  );
}

/** История версий: новые сверху. */
export function ChangelogList({ uiLang }: { uiLang: UiLanguage }) {
  const { t, i18n } = useTranslation();
  const entries = changelogItems(uiLang);

  return (
    <>
      <SectionTitle>{t('about.whatsNew')}</SectionTitle>
      <ol className="mt-2 space-y-4">
        {entries.map((entry) => (
          <li key={entry.version} className="rounded-xl border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accentSoft px-2 py-0.5 text-xs font-semibold text-accent">
                {entry.version}
              </span>
              <time className="text-xs text-muted" dateTime={entry.date}>
                {new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(
                  new Date(`${entry.date}T00:00:00Z`),
                )}
              </time>
            </div>
            <ul className="mt-2 space-y-1.5">
              {entry.items.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
