/**
 * Секция управления вечным складом карточек слов и прогревом в админке (этап 15Б, версия 0.17.5).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { SectionTitle } from '../ui/SectionTitle';

interface AdminWarmCardsSectionProps {
  warmedCards?: { ready: number; total: number };
  onRefresh?: () => void;
}

export function AdminWarmCardsSection({ warmedCards, onRefresh }: AdminWarmCardsSectionProps) {
  const { t } = useTranslation();
  const [warming, setWarming] = useState(false);
  const [warmResult, setWarmResult] = useState<string | null>(null);

  const [recreateWord, setRecreateWord] = useState('');
  const [recreateLang, setRecreateLang] = useState('de');
  const [recreateExplain, setRecreateExplain] = useState('ru');
  const [recreating, setRecreating] = useState(false);
  const [recreateStatus, setRecreateStatus] = useState<string | null>(null);

  const ready = warmedCards?.ready ?? 0;
  const total = warmedCards?.total ?? 24000;
  const percent = total > 0 ? Math.min(100, Math.round((ready / total) * 100)) : 0;

  const handleWarm = async () => {
    setWarming(true);
    setWarmResult(null);
    try {
      const res = await api.adminWarmBatch(20);
      setWarmResult(
        t('audit.warmResult', res),
      );
      onRefresh?.();
    } catch (err) {
      setWarmResult(err instanceof Error ? err.message : t('admin.loadError'));
    } finally {
      setWarming(false);
    }
  };

  const handleRecreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recreateWord.trim()) return;

    setRecreating(true);
    setRecreateStatus(null);
    try {
      await api.adminRecreateCard({
        word: recreateWord.trim(),
        lang: recreateLang,
        explainLang: recreateExplain,
      });
      setRecreateStatus(t('audit.recreated', { word: recreateWord.trim() }));
      setRecreateWord('');
      onRefresh?.();
    } catch (err) {
      setRecreateStatus(err instanceof Error ? err.message : t('admin.loadError'));
    } finally {
      setRecreating(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div>
        <SectionTitle>{t('admin.overview.warmProgress')}</SectionTitle>
        <p className="mt-1 text-xs text-muted">
          {t('audit.cardStoreHint')}
        </p>

        {/* Прогресс-бар склада */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink">{t('audit.cardCount', { ready, total })}</span>
            <span className="text-muted font-semibold">{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" variant="primary" disabled={warming} onClick={handleWarm}>
            {warming ? (
              <span className="flex items-center gap-1.5">
                <Spinner /> {t('admin.overview.warmingRunning')}
              </span>
            ) : (
              t('admin.overview.runWarm')
            )}
          </Button>
          {warmResult ? <span className="text-xs text-muted">{warmResult}</span> : null}
        </div>
      </div>

      <div className="border-t border-line pt-3">
        <SectionTitle>{t('admin.overview.recreateCard')}</SectionTitle>
        <p className="mt-1 text-xs text-muted">{t('admin.overview.recreateDesc')}</p>

        <form onSubmit={handleRecreate} className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={recreateWord}
            onChange={(e) => setRecreateWord(e.target.value)}
            placeholder={t('audit.wordPlaceholder')}
            aria-label={t('audit.wordPlaceholder')}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
            disabled={recreating}
          />

          <select
            aria-label={t('translate.sourceLanguage')}
            value={recreateLang}
            onChange={(e) => setRecreateLang(e.target.value)}
            className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
            disabled={recreating}
          >
            <option value="de">Deutsch (de)</option>
            <option value="en">English (en)</option>
          </select>

          <span className="text-xs text-muted">→</span>

          <select
            aria-label={t('translate.targetLanguage')}
            value={recreateExplain}
            onChange={(e) => setRecreateExplain(e.target.value)}
            className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
            disabled={recreating}
          >
            <option value="ru">Русский (ru)</option>
            <option value="de">Deutsch (de)</option>
            <option value="en">English (en)</option>
            <option value="uk">Українська (uk)</option>
          </select>

          <Button size="sm" variant="ghost" type="submit" disabled={recreating || !recreateWord.trim()}>
            {recreating ? (
              <span className="flex items-center gap-1.5">
                <Spinner /> {t('word.recreating')}
              </span>
            ) : (
              t('word.recreate')
            )}
          </Button>
        </form>

        {recreateStatus ? (
          <p className="mt-2 text-xs font-medium text-accent">{recreateStatus}</p>
        ) : null}
      </div>
    </Card>
  );
}
