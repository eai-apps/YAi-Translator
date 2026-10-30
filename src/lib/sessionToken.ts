/**
 * Токен входа на устройстве. Нужен будущим приложениям (Capacitor), где cookie
 * между приложением и сервером не сохраняется: тогда токен уходит в Authorization.
 * На сайте сессия живёт в cookie HttpOnly, а копия в localStorage просто лежит рядом.
 */
import { STORAGE_KEYS } from '../config';
import { readStorage, removeStorage, writeStorage } from './storage';

export function getSessionToken(): string {
  const value = readStorage<string>(STORAGE_KEYS.session, '');
  return typeof value === 'string' ? value : '';
}

export function setSessionToken(token: string): void {
  if (token) writeStorage(STORAGE_KEYS.session, token);
  else removeStorage(STORAGE_KEYS.session);
}

export function clearSessionToken(): void {
  removeStorage(STORAGE_KEYS.session);
}
