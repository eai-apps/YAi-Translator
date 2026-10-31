/**
 * Компактный выбор нейросети для «Спросить у AI» и словаря (этап 9).
 * Варианты: «Бесплатно (Gemini/Groq)», «ИИ Pro» (модель по умолчанию, без имени), ✦ модели сайта, «мой ключ».
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../hooks/useAccount';
import { shortModelName, useSiteAiModels } from '../../hooks/useSiteAiModels';
import { keyStateFor } from '../../lib/accountKeys';
import { DropdownMenu } from '../ui/DropdownMenu';
import type { MenuItem } from '../ui/DropdownMenu';

const STORAGE_KEY = 'yai.askModel';

export function useAskModelPreference(): [string, (val: string) => void] {
  const { account } = useAccount();
  const siteAi = useSiteAiModels();
  const siteLocked = Boolean(siteAi?.regOnly) && !account;

  const getEffective = (): string => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (saved !== 'free' && saved !== 'personal' && siteLocked) return 'free';
      return saved;
    }
    if (account && siteAi?.defaultId) return siteAi.defaultId;
    return 'free';
  };

  const val = getEffective();

  const setVal = (next: string) => {
    localStorage.setItem(STORAGE_KEY, next);
  };

  return [val, setVal];
}

interface AskModelSelectProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function AskModelSelect({ value, onChange, className }: AskModelSelectProps) {
  const { t } = useTranslation();
  const { account } = useAccount();
  const siteAi = useSiteAiModels();
  const siteLocked = Boolean(siteAi?.regOnly) && !account;

  const defaultId = siteAi?.defaultId;
  const siteModels = siteAi?.models ?? [];
  const hasPersonalKey =
    keyStateFor('paid', null).mask !== null ||
    keyStateFor('gemini', account?.keys?.gemini ?? null).mask !== null ||
    keyStateFor('groq', account?.keys?.groq ?? null).mask !== null;

  // Если текущая выбранная модель заблокирована для гостя, сбрасываем на free
  useEffect(() => {
    if (value !== 'free' && value !== 'personal' && siteLocked) {
      onChange('free');
    }
  }, [value, siteLocked, onChange]);

  const items: MenuItem[] = [
    {
      id: 'free',
      label: t('ask.modelFree'),
      checked: value === 'free',
      onSelect: () => onChange('free'),
    },
  ];

  if (defaultId) {
    items.push({
      id: `default-${defaultId}`,
      label: t('translate.modeAccuratePro'),
      hint: siteLocked ? t('translate.afterLogin') : undefined,
      disabled: siteLocked,
      checked: value === defaultId,
      onSelect: () => onChange(defaultId),
    });
  }

  let firstExtra = true;
  for (const m of siteModels) {
    if (m.id === defaultId) continue;
    items.push({
      id: `site-${m.id}`,
      label: `✦ ${shortModelName(m.model)}`,
      hint: siteLocked ? t('translate.afterLogin') : undefined,
      disabled: siteLocked,
      dot: m.ok === true ? 'green' : m.ok === false ? 'red' : undefined,
      separatorBefore: firstExtra,
      checked: value === m.id,
      onSelect: () => onChange(m.id),
    });
    firstExtra = false;
  }

  if (hasPersonalKey) {
    items.push({
      id: 'personal',
      label: t('ask.modelPersonal'),
      hint: t('translate.mine'),
      checked: value === 'personal',
      separatorBefore: firstExtra,
      onSelect: () => onChange('personal'),
    });
  }

  const currentLabel =
    value === 'free'
      ? t('ask.modelFree')
      : value === 'personal'
        ? t('ask.modelPersonal')
        : value === defaultId
          ? t('translate.modeAccuratePro')
          : `✦ ${shortModelName(value.split('|').pop() ?? value)}`;

  return (
    <div className={className}>
      <DropdownMenu
        label={t('ask.chooseModel')}
        items={items}
        trigger={
          <>
            <span className="text-xs text-muted mr-1">{t('ask.modelPrefix')}:</span>
            <span className="max-w-[12rem] truncate text-xs font-semibold">{currentLabel}</span>
            <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-60" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </>
        }
        buttonClassName="h-7 px-2.5 py-0 rounded-lg text-xs border border-line bg-soft/50 text-ink hover:bg-soft"
      />
    </div>
  );
}
