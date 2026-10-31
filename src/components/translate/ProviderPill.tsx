/**
 * Пилюля режима перевода (этап 8) вместо маленького списка «Переводчик».
 * Пункты: «Быстрый перевод» (Авто), «Точный перевод (ИИ)» (кнопка «Спросить у AI»),
 * затем подключённые сервисы и «… — мой ключ» (как в ProviderSelect).
 */
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CLASSIC_PROVIDERS } from '../../../shared/types';
import type { ProviderChoice } from '../../hooks/useTranslator';
import { PERSONAL_AI_CHOICES } from '../../hooks/useTranslator';
import { useAccount } from '../../hooks/useAccount';
import { useSiteProviders } from '../../hooks/useSiteProviders';
import { shortModelName, useSiteAiModels } from '../../hooks/useSiteAiModels';
import { useNavigate } from 'react-router-dom';
import { keyStateFor } from '../../lib/accountKeys';
import { providerLabel } from '../../lib/errors';
import { DropdownMenu } from '../ui/DropdownMenu';
import type { MenuItem } from '../ui/DropdownMenu';

interface ProviderPillProps {
  value: ProviderChoice;
  onChange: (next: ProviderChoice) => void;
  /** «Точный перевод (ИИ)»: идёт запрос. */
  aiLoading: boolean;
  onAskAi: () => void;
  /** Есть ли текст для перевода. */
  hasText: boolean;
}

export function ProviderPill({ value, onChange, aiLoading, onAskAi, hasText }: ProviderPillProps) {
  const { t } = useTranslation();
  const site = useSiteProviders();
  const { account } = useAccount();
  const siteAi = useSiteAiModels();
  const navigate = useNavigate();
  // Нейросети сайта (0.9.3): вошедшим — выбор, гостям (если «только для зарегистрированных») — видны, но закрыты.
  const siteModels = siteAi?.models ?? [];
  const siteLocked = Boolean(siteAi?.regOnly) && !account;

  // Подключённые сервисы и личные ключи — тот же список, что в ProviderSelect.
  const options = useMemo<ProviderChoice[]>(() => {
    const classic = site ? CLASSIC_PROVIDERS.filter((id) => site[id]) : [];
    const personal = PERSONAL_AI_CHOICES.filter(
      (id) =>
        (site ? site[id] !== false : true) &&
        keyStateFor(id, id === 'paid' ? null : (account?.keys[id] ?? null)).mask !== null,
    );
    const siteChoices = siteLocked ? [] : siteModels.map((item) => `site:${item.id}` as ProviderChoice);
    return [...classic, ...personal, ...siteChoices];
  }, [site, account, siteLocked, siteModels]);

  // Сервис, который выключили или ключ которого удалили, возвращает выбор к «Быстрый перевод».
  useEffect(() => {
    if (value !== 'auto' && site && !options.includes(value)) onChange('auto');
  }, [value, site, options, onChange]);

  const personal = (id: ProviderChoice) =>
    PERSONAL_AI_CHOICES.includes(id as (typeof PERSONAL_AI_CHOICES)[number]);

  const items: MenuItem[] = [
    {
      id: 'auto',
      label: t('translate.modeFast'),
      checked: value === 'auto',
      onSelect: () => onChange('auto'),
    },
  ];

  // «Точный перевод» — не выбор сервиса, а кнопка: сбрасывает обычный выбор и просит ИИ.
  items.push({
    id: 'ai',
    label: t('translate.modeAccurate'),
    hint: aiLoading ? t('common.loading') : undefined,
    disabled: !hasText || aiLoading,
    onSelect: onAskAi,
  });

  for (const id of options) {
    if (id.startsWith('site:')) continue;
    items.push({
      id: `provider-${id}`,
      label: providerLabel(id),
      hint: personal(id) ? t('translate.mine') : undefined,
      checked: value === id,
      onSelect: () => onChange(id),
    });
  }

  for (const item of siteModels) {
    const id = `site:${item.id}` as ProviderChoice;
    items.push({
      id: `provider-${id}`,
      label: `✦ ${shortModelName(item.model)}`,
      hint: siteLocked ? t('translate.afterLogin') : t('translate.siteAi'),
      checked: value === id,
      disabled: siteLocked,
      onSelect: () => onChange(id),
    });
  }
  if (siteLocked && siteModels.length > 0) {
    items.push({ id: 'register', label: t('translate.moreAiAfterLogin'), onSelect: () => navigate('/profile') });
  }

  const current =
    value === 'auto'
      ? t('translate.modeFast')
      : value.startsWith('site:')
        ? shortModelName(value.split('|').pop() ?? value)
        : providerLabel(value);
  const firstExtra = items.find((item) => item.id.startsWith('provider-'))?.id ?? null;

  return (
    <DropdownMenu
      label={t('translate.mode')}
      items={items}
      separatorBeforeId={firstExtra}
      trigger={
        <>
          <span className="max-w-[9rem] truncate">{current}</span>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </>
      }
      buttonClassName="border-transparent bg-accentSoft text-accent hover:bg-accent hover:text-accentInk"
    />
  );
}
