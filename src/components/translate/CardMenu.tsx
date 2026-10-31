/**
 * Меню «⋯» (этап 8): «Разобрать», «Проверить мой немецкий», «Поделиться».
 * Одно и то же меню стоит у перевода и в заголовке карточки слова.
 */
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { DropdownMenu } from '../ui/DropdownMenu';
import type { MenuItem } from '../ui/DropdownMenu';
import { IconCheck, IconSparkles } from '../layout/icons';

interface CardMenuProps {
  onExplain: () => void;
  onCheck: () => void;
  onShare: () => void;
  /** Есть ли текст для «Разобрать» и «Проверить». */
  canUseTools: boolean;
  /** Телефон умеет системное «Поделиться» — иначе пункт копирует перевод. */
  shareSupported: boolean;
  /** Только значок («⋯» в заголовке) или пункт «⋯» в строке действий. */
  variant?: 'dots' | 'button';
  className?: string;
}

export function CardMenu({
  onExplain,
  onCheck,
  onShare,
  canUseTools,
  shareSupported,
  variant = 'dots',
  className,
}: CardMenuProps) {
  const { t } = useTranslation();

  const items: MenuItem[] = [
    {
      id: 'explain',
      label: t('translate.explain'),
      onSelect: onExplain,
      disabled: !canUseTools,
    },
    {
      id: 'check',
      label: t('translate.check'),
      onSelect: onCheck,
      disabled: !canUseTools,
    },
    {
      id: 'share',
      label: shareSupported ? t('translate.share') : t('translate.shareCopy'),
      onSelect: onShare,
    },
  ];

  return (
    <DropdownMenu
      label={t('translate.moreActions')}
      align="right"
      items={items}
      className={className}
      trigger={
        variant === 'button' ? (
          <span className="flex items-center gap-1">
            <span className="text-base leading-none">⋯</span>
            <span className="text-xs">{t('translate.more')}</span>
          </span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        )
      }
      buttonClassName={
        variant === 'button'
          ? 'border-line bg-card text-muted hover:bg-soft hover:text-ink'
          : 'border-line bg-card px-2.5 text-muted hover:bg-soft hover:text-ink'
      }
    />
  );
}

/** Кнопки «Разобрать» / «Проверить» для пустого экрана, где меню «⋯» слишком мелкое. */
export function ToolsButtons({
  onExplain,
  onCheck,
  canUseTools,
}: Pick<CardMenuProps, 'onExplain' | 'onCheck' | 'canUseTools'>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        icon={<IconSparkles className="h-4 w-4" />}
        onClick={onExplain}
        disabled={!canUseTools}
      >
        {t('translate.explain')}
      </Button>
      <Button size="sm" variant="secondary" icon={<IconCheck className="h-4 w-4" />} onClick={onCheck} disabled={!canUseTools}>
        {t('translate.check')}
      </Button>
    </div>
  );
}
