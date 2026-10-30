/**
 * Кто админ: логин указан в секрете Cloudflare ADMIN_LOGINS (несколько через запятую).
 * Пароль — обычный пароль этого аккаунта. Без секрета админки нет ни у кого.
 */
import type { Env } from '../env';

/** Логины из ADMIN_LOGINS в нижнем регистре (логины в базе тоже хранятся в нижнем регистре). */
export function adminLogins(env: Env): string[] {
  return (env.ADMIN_LOGINS ?? '')
    .split(',')
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminLogin(env: Env, login: string): boolean {
  return adminLogins(env).includes(login.trim().toLowerCase());
}
