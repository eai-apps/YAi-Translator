/** Проверка резервной копии до записи: повреждённый файл не меняет локальные данные. */
import type { UserBackupData } from './dataBackup';

type Row = Record<string, unknown>;
const row = (v: unknown): v is Row => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string';
const time = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const strings = (v: unknown) => Array.isArray(v) && v.every(text);

export function parseBackup(json: string): Partial<UserBackupData> {
  const data: unknown = JSON.parse(json);
  if (!row(data) || data.version !== 1) throw new Error('INVALID_BACKUP_FORMAT');
  const check = (value: unknown, valid: (v: Row) => boolean) => {
    if (value === undefined) return;
    if (!Array.isArray(value) || !value.every(v => row(v) && valid(v))) throw new Error('INVALID_BACKUP_FORMAT');
  };
  check(data.history, v => text(v.id) && text(v.text) && text(v.translation) && time(v.createdAt) && text(v.sourceLang) && text(v.targetLang));
  check(data.askHistory, v => text(v.id) && text(v.question) && time(v.createdAt));
  if (data.study !== undefined) {
    if (!row(data.study)) throw new Error('INVALID_BACKUP_FORMAT');
    check(data.study.cards, v => text(v.id) && text(v.lemma) && strings(v.translations) && time(v.updatedAt));
    check(data.study.progress, v => text(v.cardId) && ['ease','interval','due','reps','lapses','introducedAt','updatedAt'].every(k => time(v[k])));
    check(data.study.days, v => text(v.day) && ['reviews','exercises','updatedAt'].every(k => time(v[k])));
    check(data.study.lists, v => text(v.id) && text(v.title) && strings(v.cardIds) && time(v.updatedAt));
  }
  if (data.settings !== undefined && !row(data.settings)) throw new Error('INVALID_BACKUP_FORMAT');
  return data as Partial<UserBackupData>;
}

export function mergeBackupRows<T>(local: T[], incoming: T[], key: (v: T) => string, stamp: (v: T) => number): T[] {
  const result = new Map(local.map(v => [key(v), v]));
  for (const v of incoming) {
    const previous = result.get(key(v));
    if (!previous || stamp(v) > stamp(previous)) result.set(key(v), v);
  }
  return [...result.values()];
}
