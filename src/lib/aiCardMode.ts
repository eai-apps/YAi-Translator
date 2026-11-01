/**
 * Когда загружать ИИ-разбор слова: сразу или по кнопке.
 * Админка задаёт режим для всех (по умолчанию — по кнопке, экономит общий лимит).
 * Пользователь со своим ключом ИИ может выбрать в «Профиль → Настройки»: как на сайте / сразу / по кнопке.
 */
import type { AccountInfo } from '../../shared/types';
import type { TranslateSettings } from './translateSettings';
import { getUserKeys } from './userKeys';

/** Есть ли у человека свой ключ ИИ — в аккаунте или на этом устройстве. */
export function hasOwnAiKey(account: AccountInfo | null): boolean {
  const local = getUserKeys();
  if (local.gemini || local.groq || (local.paidUrl && local.paidKey && local.paidModel)) return true;
  return Boolean(account && Object.values(account.keys ?? {}).some(Boolean));
}

export function shouldAutoLoadAiCard(
  settings: Pick<TranslateSettings, 'aiCardMode'>,
  siteAuto: boolean,
  ownKey: boolean,
): boolean {
  if (ownKey && settings.aiCardMode === 'auto') return true;
  if (ownKey && settings.aiCardMode === 'button') return false;
  return siteAuto;
}
