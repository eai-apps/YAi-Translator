/** Ключи пользователя хранятся только на устройстве и уходят на сервер в заголовках. */
import { STORAGE_KEYS } from '../config';
import { readStorage } from './storage';

export interface UserKeys {
  gemini: string;
  groq: string;
}

export function getUserKeys(): UserKeys {
  const stored = readStorage<Partial<UserKeys>>(STORAGE_KEYS.keys, {});
  return {
    gemini: typeof stored.gemini === 'string' ? stored.gemini : '',
    groq: typeof stored.groq === 'string' ? stored.groq : '',
  };
}
