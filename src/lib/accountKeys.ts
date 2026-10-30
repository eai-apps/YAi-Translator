/**
 * Где хранится ключ ИИ: в аккаунте (шифруется на сервере, виден на всех устройствах)
 * или только на этом устройстве (localStorage, уходит в заголовке X-User-*).
 */
import type { KeyProvider, StoredKeyInfo } from '../../shared/types';
import { getUserKeys } from './userKeys';

export interface KeyState {
  /** Ключ лежит в аккаунте — сервер присылает только последние 4 символа. */
  stored: StoredKeyInfo | null;
  /** Ключ введён и сохранён на этом устройстве. */
  local: boolean;
  /** Короткая маска вида «••••1234» для экрана; null — ключа нет. */
  mask: string | null;
}

export function keyStateFor(
  provider: KeyProvider,
  stored: StoredKeyInfo | null,
  localKeys = getUserKeys(),
): KeyState {
  const local = Boolean(localKeys[provider]);
  const last4 = stored?.last4 ?? (local ? localKeys[provider].slice(-4) : '');
  return {
    stored,
    local,
    mask: stored || local ? `••••${last4}` : null,
  };
}
