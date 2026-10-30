/**
 * Шифрование ключей ИИ пользователя: AES-GCM.
 * Ключ шифрования — секрет Cloudflare KEY_ENCRYPTION_SECRET (32 случайных байта в base64).
 * Без секрета ключи в аккаунте не сохраняются (KEYS_STORAGE_DISABLED).
 */
import type { Env } from '../env';
import { bytesToHex, hexToBytes, randomHex } from './password';

const IV_BYTES = 12; // рекомендуемый размер для AES-GCM

let cachedKey: { secret: string; key: CryptoKey } | null = null;

function decodeSecret(secret: string): Uint8Array {
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(secret.trim()), (char) => char.charCodeAt(0));
  } catch {
    throw new Error('KEY_ENCRYPTION_SECRET должен быть в base64');
  }
  if (bytes.length !== 32) {
    throw new Error('KEY_ENCRYPTION_SECRET должен содержать 32 байта (base64)');
  }
  return bytes;
}

/** Есть ли на сервере секрет для шифрования ключей. */
export function isKeysStorageEnabled(env: Env): boolean {
  return typeof env.KEY_ENCRYPTION_SECRET === 'string' && env.KEY_ENCRYPTION_SECRET.trim().length > 0;
}

async function getEncryptionKey(env: Env): Promise<CryptoKey> {
  const secret = (env.KEY_ENCRYPTION_SECRET ?? '').trim();
  if (!secret) throw new Error('KEY_ENCRYPTION_SECRET не задан');
  if (cachedKey && cachedKey.secret === secret) return cachedKey.key;

  const key = await crypto.subtle.importKey('raw', decodeSecret(secret), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
  cachedKey = { secret, key };
  return key;
}

/** Шифрует ключ, возвращает hex-строки: шифротекст и IV. */
/**
 * «Привязка» шифротекста к владельцу (AES-GCM additionalData): ключ, переложенный
 * в базе в чужую строку, просто не расшифруется.
 */
function bindingData(context: string): Uint8Array {
  return new TextEncoder().encode(`yai-key:${context}`);
}

export async function encryptKey(
  env: Env,
  plain: string,
  /** Например «<userId>:gemini». */
  context: string,
): Promise<{ ciphertext: string; iv: string }> {
  const key = await getEncryptionKey(env);
  const ivHex = randomHex(IV_BYTES);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: hexToBytes(ivHex), additionalData: bindingData(context) },
    key,
    new TextEncoder().encode(plain),
  );
  return { ciphertext: bytesToHex(new Uint8Array(encrypted)), iv: ivHex };
}

/** Расшифровывает ключ обратно. */
export async function decryptKey(
  env: Env,
  ciphertext: string,
  iv: string,
  context: string,
): Promise<string> {
  const key = await getEncryptionKey(env);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(iv), additionalData: bindingData(context) },
    key,
    hexToBytes(ciphertext),
  );
  return new TextDecoder().decode(decrypted);
}

/** Последние 4 символа ключа — единственное, что видит пользователь на сервере. */
export function keyLast4(key: string): string {
  return key.slice(-4);
}
