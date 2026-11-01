/** Пункты меню: одни и те же для боковой панели и нижней навигации. */
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { IconAsk, IconBook, IconChat, IconFileText, IconGrammar, IconLearn, IconTranslate, IconUser } from './icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

/** Пять вкладок нижней панели: на телефоне больше не помещается. */
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

/** Пункты бокового меню для больших экранов. */
export function useSidebarItems(): NavItem[] {
  const { t } = useTranslation();
  const [translate, dictionary, learn, conversation, profile] = useNavItems();
  return [
    translate,
    dictionary,
    { to: '/phrasebook', label: t('nav.phrasebook'), icon: IconBook },
    { to: '/grammar', label: t('nav.grammar'), icon: IconGrammar },
    { to: '/ask', label: t('nav.ask'), icon: IconAsk },
    { to: '/letter', label: t('nav.letter'), icon: IconFileText },
    learn,
    conversation,
    profile,
  ];
}
