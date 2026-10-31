/**
 * Заголовок главного экрана «Перевод»: название фирменным шрифтом с градиентом,
 * значок серии дней 🔥 с подсказкой и кнопка вызова истории перевода (часы).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAccount } from '../../hooks/useAccount';
import { IconClock, IconFlame } from '../layout/icons';

interface TranslateHeaderProps {
  onOpenHistory?: () => void;
  streak?: number;
  todayActive?: boolean;
}

export function TranslateHeader({ onOpenHistory, streak = 0, todayActive = false }: TranslateHeaderProps) {
  const { t } = useTranslation();
  const { account } = useAccount();
  const [streakTooltip, setStreakTooltip] = useState(false);

  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-x-5 gap-y-2 sm:mb-5">
      <div className="flex min-w-0 flex-col">
        <h1 className="bg-gradient-to-r from-accent via-[#8b7bff] to-[#c06cf0] bg-clip-text pb-0.5 font-display text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
          {t('translate.title')}
        </h1>
        <div className="min-w-0 max-w-xl pb-1">
          <p className="text-sm font-medium leading-snug text-ink sm:text-[15px]">{t('translate.tagline')}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{t('translate.taglineSub')}</p>
          {!account ? (
            <Link to="/profile" className="mt-0.5 inline-block text-xs font-medium leading-snug text-accent hover:underline">
              ★ {t('translate.taglineGuest')}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Быстрые действия в шапке: серия дней 🔥 и значок истории 🕒 */}
      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        {/* Серия дней с поповером */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStreakTooltip((prev) => !prev)}
            aria-label={t('translate.streakTitle', { count: streak })}
            title={t('translate.streakTitle', { count: streak })}
            className={`flex h-9 items-center gap-1 rounded-xl border px-2.5 text-xs font-semibold transition-colors ${
              todayActive
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                : streak > 0
                  ? 'border-line bg-card text-muted hover:border-amber-500/30 hover:text-amber-500'
                  : 'border-line bg-card text-muted hover:bg-soft hover:text-ink'
            }`}
          >
            <IconFlame className="h-4 w-4" />
            <span className="font-mono tabular-nums">{streak}</span>
          </button>

          {streakTooltip ? (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setStreakTooltip(false)}
                aria-hidden="true"
              />
              <div
                role="tooltip"
                className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-line bg-card p-3 shadow-xl text-xs leading-relaxed animate-fade-in"
              >
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <IconFlame className="h-4 w-4 text-amber-500" />
                  <span>{t('translate.streakTitle', { count: streak })}</span>
                </div>
                <p className="mt-1 text-muted">
                  {todayActive
                    ? t('translate.streakTodayComplete')
                    : t('translate.streakHint')}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Кнопка вызова панели истории */}
        {onOpenHistory ? (
          <button
            type="button"
            onClick={onOpenHistory}
            aria-label={t('translate.historyTitle')}
            title={t('translate.historyTitle')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-muted hover:bg-soft hover:text-ink transition-colors"
          >
            <IconClock className="h-[18px] w-[18px]" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
