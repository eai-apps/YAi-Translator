/**
 * Какая нейросеть сайта выбрана в запросе (0.10.1, Claude): «id|модель» — конкретная модель,
 * «default» — «Суперточный перевод (ИИ Pro)», то есть модель по умолчанию из админки.
 */
import type { Env } from '../env';
import { readSetting, SETTINGS_KEYS } from '../settings';

export async function resolveAiModel(env: Env, raw: unknown): Promise<string | undefined> {
  if (typeof raw !== 'string' || raw.length > 200) return undefined;
  if (raw === 'default') {
    const value = await readSetting<string>(env, SETTINGS_KEYS.paidDefaultModel);
    return value && value.includes('|') ? value : undefined;
  }
  return raw.includes('|') ? raw : undefined;
}

/** Нейросети сайта только для вошедших, если так настроено в админке. */
export async function paidRequiresLogin(env: Env): Promise<boolean> {
  return (await readSetting<boolean>(env, SETTINGS_KEYS.paidAiRegisteredOnly)) ?? true;
}
