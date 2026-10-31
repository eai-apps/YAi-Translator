/**
 * Верхняя компактная строка экрана «Перевод» (этап 12):
 * - Никаких громоздких рекламных заголовков: экран сразу готов к переводу.
 * - Огонёк серии дней 🔥 и часы истории 🕒 — понятные аккуратные кнопки с подписями в одной строке.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconClock, IconFlame } from '../layout/icons';
import { hapticImpact } from '../../lib/haptics';

interface TranslateHeaderProps {
  onOpenHistory?: () => void;
  streak?: number;
  todayActive?: boolean;
}

export function TranslateHeader({ onOpenHistory, streak = 0, todayActive = false }: TranslateHeaderProps) {
  const { t } = useTranslation();
  const [streakTooltip, setStreakTooltip] = useState(false);

  const handleToggleStreak = () => {
    void hapticImpact();
    setStreakTooltip((prev) => !prev);
  };

  const handleOpenHistory = () => {
    void hapticImpact();
    onOpenHistory?.();
  };

  return (
    <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
      {/* Кнопка серии дней с иконкой и подписью */}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleStreak}
          aria-label={t('translate.streakTitle', { count: streak })}
          className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
            todayActive
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
              : streak > 0
                ? 'border-line bg-card text-muted hover:border-amber-500/30 hover:text-amber-500'
                : 'border-line bg-card text-muted hover:bg-soft hover:text-ink'
          }`}
        >
          <IconFlame className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-semibold text-ink">
            {streak > 0 ? t('translate.streakTitle', { count: streak }) : t('translate.streak')}
          </span>
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
              className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-line bg-card p-3 shadow-xl text-xs leading-relaxed animate-fade-in"
            >
              <div className="flex items-center gap-1.5 font-semibold text-ink">
                <IconFlame className="h-4 w-4 text-amber-500" />
                <span>{t('translate.streakTitle', { count: streak })}</span>
              </div>
              <p className="mt-1 text-muted">
                {todayActive ? t('translate.streakTodayComplete') : t('translate.streakHint')}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Кнопка истории с иконкой и подписью */}
      {onOpenHistory ? (
        <button
          type="button"
          onClick={handleOpenHistory}
          className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink active:scale-95"
          aria-label={t('translate.historyTitle')}
        >
          <IconClock className="h-3.5 w-3.5" />
          <span>{t('translate.historyTitle')}</span>
        </button>
      ) : null}
    </div>
  );
}
