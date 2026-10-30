/**
 * Хеширование паролей: PBKDF2-SHA256, 100 000 итераций (больше Workers не разрешает),
 * соль 16 байт на пользователя. Хеши сравниваются за постоянное время.
 */
import { AUTH } from '../config';

/** Случайные байты в hex. */
export function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return bytesToHex(buffer);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const result = new Uint8Array(clean.length / 2);
  for (let index = 0; index < result.length; index += 1) {
    result[index] = parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }
  return result;
}

async function derive(password: string, saltHex: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: hexToBytes(saltHex),
      iterations: AUTH.pbkdf2Iterations,
    },
    key,
    AUTH.hashBytes * 8,
  );
  return new Uint8Array(bits);
}

/** Хеш пароля и соль — обе строки в hex. */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomHex(AUTH.saltBytes);
  const hash = await derive(password, salt);
  return { hash: bytesToHex(hash), salt };
}

/** Сравнение за постоянное время: время не зависит от того, на каком символе нашлось отличие. */
export function constantTimeEqual(left: string, right: string): boolean {
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    diff |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return diff === 0;
}

/** Проверка пароля: пересчитываем хеш с сохранённой солью и сравниваем. */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
): Promise<boolean> {
  const candidate = bytesToHex(await derive(password, storedSalt));
  return constantTimeEqual(candidate, storedHash);
}
