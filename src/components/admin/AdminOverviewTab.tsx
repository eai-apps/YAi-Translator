/** Вкладка «Обзор»: пользователи, посетители, переводы за сегодня и график 30 дней. */
import { useTranslation } from 'react-i18next';
import type { AdminOverview } from '../../../shared/types';
import { getLanguage } from '../../../shared/languages';
import { providerLabel } from '../../lib/errors';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { AdminChart } from './AdminChart';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-soft px-3 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function AdminOverviewTab({ data }: { data: AdminOverview }) {
  const { t } = useTranslation();
  const percent = `${Math.round(data.cacheHitRate * 100)}%`;
  const services = Object.entries(data.translationsToday).sort((left, right) => right[1] - left[1]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle>{t('admin.overview.usersTitle')}</SectionTitle>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label={t('admin.overview.usersTotal')} value={data.users.total} />
            <Stat label={t('admin.overview.usersToday')} value={data.users.today} />
            <Stat label={t('admin.overview.usersWeek')} value={data.users.week} />
            <Stat label={t('admin.overview.usersMonth')} value={data.users.month} />
            <Stat label={t('admin.overview.activeWeek')} value={data.users.activeWeek} />
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle>{t('admin.overview.visitorsTitle')}</SectionTitle>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t('admin.overview.visitorsHint')}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label={t('admin.overview.visitorsToday')} value={data.visitors.today} />
            <Stat label={t('admin.overview.visitorsWeek')} value={data.visitors.week} />
            <Stat label={t('admin.overview.visitorsMonth')} value={data.visitors.month} />
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle>{t('admin.overview.translationsTitle')}</SectionTitle>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label={t('admin.overview.translationsTotal')} value={data.translationsTodayTotal} />
            <Stat label={t('admin.overview.cacheHitRate')} value={percent} />
            <Stat label={t('admin.overview.aiRequests')} value={data.aiRequestsToday} />
          </div>
          <p className="mt-3 text-xs font-medium text-muted">{t('admin.overview.studyTitle')}</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Stat label={t('admin.overview.studyReviews')} value={data.study.reviewsToday} />
            <Stat label={t('admin.overview.studyExercises')} value={data.study.exercisesToday} />
          </div>
          <p className="mt-3 text-xs font-medium text-muted">{t('admin.overview.byService')}</p>
          {services.length === 0 ? (
            <p className="mt-1 text-sm text-muted">{t('admin.overview.noTranslations')}</p>
          ) : (
            <ul className="mt-1 divide-y divide-line">
              {services.map(([provider, count]) => (
                <li key={provider} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{providerLabel(provider)}</span>
                  <span className="tabular-nums text-muted">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <SectionTitle>{t('admin.overview.pairsTitle')}</SectionTitle>
          {data.popularPairs.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t('admin.overview.noPairs')}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {data.popularPairs.map((pair) => (
                <li
                  key={`${pair.from}-${pair.to}`}
                  className="flex items-center justify-between rounded-lg bg-soft px-2.5 py-1.5 text-sm"
                >
                  <span>
                    {getLanguage(pair.from)?.nativeName ?? pair.from} →{' '}
                    {getLanguage(pair.to)?.nativeName ?? pair.to}
                  </span>
                  <span className="tabular-nums text-muted">{pair.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <SectionTitle>{t('admin.overview.chartTitle')}</SectionTitle>
        <div className="mt-2 text-ink">
          <AdminChart data={data.daily} />
        </div>
      </Card>
    </div>
  );
}
