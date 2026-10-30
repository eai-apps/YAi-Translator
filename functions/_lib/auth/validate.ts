/** Проверка логина и пароля по правилам из AUTH (config.ts). */
import { AUTH } from '../config';
import { ApiError } from '../http';

/** Логин приводим к нижнему регистру и обрезаем: «Anna.Berger» и «anna.berger» — один аккаунт. */
export function normalizeLogin(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError('VALIDATION', 400);
  return value.trim().toLowerCase();
}

/** Проверяет логин и возвращает его в нижнем регистре. */
export function requireLogin(value: unknown): string {
  const login = normalizeLogin(value);
  if (!AUTH.loginPattern.test(login)) throw new ApiError('LOGIN_INVALID', 400);
  return login;
}

/** Пароль не обрезаем: пробелы внутри пароля — часть пароля. */
export function requirePassword(value: unknown, code: 'VALIDATION' | 'PASSWORD_TOO_SHORT' = 'VALIDATION'): string {
  if (typeof value !== 'string') throw new ApiError('VALIDATION', 400);
  if (value.length < AUTH.minPasswordLength) throw new ApiError(code, 400);
  if (value.length > AUTH.maxPasswordLength) throw new ApiError('TEXT_TOO_LONG', 413);
  return value;
}

/** Название устройства для списка «Мои устройства» (необязательное). */
export function optionalDevice(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** Подпись устройства по заголовку User-Agent — если клиент название не передал. */
export function deviceFromUserAgent(request: Request): string {
  const agent = request.headers.get('user-agent') ?? '';
  if (/iphone|ipod/i.test(agent)) return 'iPhone';
  if (/ipad/i.test(agent)) return 'iPad';
  if (/android/i.test(agent)) return 'Android';
  if (/windows/i.test(agent)) return 'Windows';
  if (/macintosh|mac os/i.test(agent)) return 'Mac';
  if (/linux/i.test(agent)) return 'Linux';
  return '';
}
