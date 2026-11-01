/**
 * Экран «Ещё» — шторка снизу со всеми разделами приложения.
 * Открывается из нижней панели навигации вместо 6-й+ вкладки.
 * На мобильном: плитки с иконками. Администратору — плитка «Админка».
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../hooks/useAccount';
import { cn } from '../../lib/cn';
import { ReportIssueModal } from './ReportIssueModal';
import {
  IconGrammar,
  IconAsk,
  IconBook,
  IconFileText,
  IconCompass,
  IconInfo,
  IconPhone,
  IconSparkles,
  IconClose,
  IconAlert,
} from '../layout/icons';

interface MoreScreenProps {
  open: boolean;
  onClose: () => void;
}

interface MoreItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const MORE_ITEMS: MoreItem[] = [
  { to: '/phrasebook', labelKey: 'nav.phrasebook', icon: IconBook },
  { to: '/letter', labelKey: 'nav.letter', icon: IconFileText },
  { to: '/grammar', labelKey: 'nav.grammar', icon: IconGrammar },
  { to: '/ask', labelKey: 'nav.ask', icon: IconAsk },
  { to: '/resources', labelKey: 'nav.resources', icon: IconCompass },
  { to: '/apps', labelKey: 'nav.apps', icon: IconPhone },
  { to: '/about', labelKey: 'nav.about', icon: IconInfo },
  { to: '/admin', labelKey: 'nav.admin', icon: IconSparkles, adminOnly: true },
];

export function MoreScreen({ open, onClose }: MoreScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account } = useAccount();
  const [reportOpen, setReportOpen] = useState(false);

  const items = MORE_ITEMS.filter((item) => !item.adminOnly || account?.isAdmin);

  const handleNav = (to: string) => {
    onClose();
    navigate(to);
  };

  if (!open && !reportOpen) return null;

  return (
    <>
      {/* Затемнение */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Шторка */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.more')}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card shadow-[0_-4px_30px_rgba(0,0,0,0.18)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        {/* Ручка */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 pb-4">
          <h2 className="text-base font-semibold">{t('nav.more')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-soft"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {/* Плитки */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => handleNav(item.to)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl bg-soft px-2 py-4',
                  'text-center text-xs font-medium text-muted transition-colors',
                  'hover:bg-accentSoft hover:text-accent active:scale-95',
                  'focus-visible:ring-2 focus-visible:ring-accent',
                )}
              >
                <Icon className="h-7 w-7" />
                <span className="leading-tight">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Кнопка «Сообщить о проблеме» */}
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-xs font-medium text-muted hover:bg-soft hover:text-ink transition-colors"
          >
            <IconAlert className="h-4 w-4 text-warning" />
            <span>{t('feedback.reportButton')}</span>
          </button>
        </div>

        {/* Ссылки на Политику конфиденциальности и Условия */}
        <div className="flex items-center justify-center gap-3 px-4 pb-2 text-[11px] text-muted">
          <button
            type="button"
            onClick={() => handleNav('/privacy')}
            className="hover:text-ink hover:underline"
          >
            {t('legal.privacy')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => handleNav('/terms')}
            className="hover:text-ink hover:underline"
          >
            {t('legal.terms')}
          </button>
        </div>
      </div>

      <ReportIssueModal
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          onClose();
        }}
      />
    </>
  );
}
