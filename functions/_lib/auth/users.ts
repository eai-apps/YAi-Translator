/** Пользователи в D1: создание, поиск по логину, смена пароля. */
import type { Env } from '../env';
import { ensureSchema } from '../schema';
import { ApiError } from '../http';
import { hashPassword, verifyPassword } from './password';

/** Фиктивные хеш и соль для выравнивания времени ответа (значения не важны). */
const DUMMY_SALT = '00000000000000000000000000000000';
const DUMMY_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface UserRow {
  id: string;
  login: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
  last_login_at: number | null;
}

export async function findUserByLogin(env: Env, login: string): Promise<UserRow | null> {
  if (!env.DB) throw new ApiError('INTERNAL', 500);
  await ensureSchema(env);
  return env.DB.prepare('SELECT * FROM users WHERE login = ? LIMIT 1').bind(login).first<UserRow>();
}

export async function findUserById(env: Env, id: string): Promise<UserRow | null> {
  if (!env.DB) throw new ApiError('INTERNAL', 500);
  await ensureSchema(env);
  return env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(id).first<UserRow>();
}

/** Создаёт пользователя. Занятый логин — ошибка LOGIN_TAKEN. */
export async function createUser(env: Env, login: string, password: string): Promise<UserRow> {
  if (!env.DB) throw new ApiError('INTERNAL', 500);
  await ensureSchema(env);

  const existing = await findUserByLogin(env, login);
  if (existing) throw new ApiError('LOGIN_TAKEN', 409);

  const { hash, salt } = await hashPassword(password);
  const now = Date.now();
  const user: UserRow = {
    id: crypto.randomUUID(),
    login,
    password_hash: hash,
    password_salt: salt,
    created_at: now,
    last_login_at: now,
  };

  try {
    await env.DB.prepare(
      `INSERT INTO users (id, login, password_hash, password_salt, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(user.id, user.login, user.password_hash, user.password_salt, user.created_at, now)
      .run();
  } catch (error) {
    // Двое одновременно заняли один логин — UNIQUE в базе решает гонку.
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new ApiError('LOGIN_TAKEN', 409);
    }
    throw error;
  }
  return user;
}

/** Проверяет пароль и отмечает время входа. */
export async function authenticate(
  env: Env,
  login: string,
  password: string,
): Promise<UserRow | null> {
  const user = await findUserByLogin(env, login);
  // Неверный логин и неверный пароль дают одну и ту же ошибку у вызывающего кода.
  // Для несуществующего логина всё равно считаем хеш: иначе по скорости ответа
  // можно было бы узнать, какие логины зарегистрированы.
  if (!user) {
    await verifyPassword(password, DUMMY_HASH, DUMMY_SALT);
    return null;
  }
  const ok = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) return null;

  await env.DB!.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(Date.now(), user.id).run();
  return user;
}

/** Меняет пароль; при неверном старом — INVALID_CREDENTIALS. */
export async function changePassword(
  env: Env,
  user: UserRow,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const ok = await verifyPassword(oldPassword, user.password_hash, user.password_salt);
  if (!ok) throw new ApiError('INVALID_CREDENTIALS', 401);

  const { hash, salt } = await hashPassword(newPassword);
  await env.DB!.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
    .bind(hash, salt, user.id)
    .run();
}
