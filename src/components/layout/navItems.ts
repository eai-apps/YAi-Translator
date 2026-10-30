/** Пункты меню: одни и те же для боковой панели и нижней навигации. */
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBook, IconChat, IconLearn, IconTranslate, IconUser } from './icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function useNavItems(): NavItem[] {
  const { t } = useTranslation();
  return [
    { to: '/', label: t('nav.translate'), icon: IconTranslate },
    { to: '/dictionary', label: t('nav.dictionary'), icon: IconBook },
    { to: '/learn', label: t('nav.learn'), icon: IconLearn },
    { to: '/conversation', label: t('nav.conversation'), icon: IconChat },
    { to: '/profile', label: t('nav.profile'), icon: IconUser },
  ];
}
