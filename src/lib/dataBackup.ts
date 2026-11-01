/**
 * Экспорт и импорт всех пользовательских данных (этап 20):
 * история переводов, избранное, вопросы ИИ, карточки учёбы, прогресс, списки и настройки.
 * Позволяет сделать локальный бэкап или перенести данные между устройствами без сервера.
 */
import { APP_VERSION, STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from './storage';
import { applyRemoteSettings, type SyncedSettingsPayload } from './settingsSync';
import { parseBackup, mergeBackupRows } from './backupMerge';
import { mergeStudyState } from './studyMerge';
import type { HistoryItem } from '../hooks/useHistory';
import type { AskHistoryItem } from '../hooks/useAskHistory';
import type { StudyCard, StudyDay, StudyList, StudyProgress } from '../../shared/study';

export interface UserBackupData {
  version: 1;
  appVersion: string;
  exportedAt: number;
  history: HistoryItem[];
  askHistory: AskHistoryItem[];
  study: {
    cards: StudyCard[];
    progress: StudyProgress[];
    days: StudyDay[];
    lists: StudyList[];
    goal?: number;
    newPerDay?: number;
  };
  settings: {
    theme?: string;
    uiLanguage?: string;
    translateSettings?: SyncedSettingsPayload['translateSettings'];
    sourceLang?: string;
    targetLang?: string;
    provider?: string;
    updatedAt?: number;
  };
}

export interface ImportSummary {
  historyCount: number;
  cardsCount: number;
  listsCount: number;
}

/** Собирает и скачивает все данные пользователя в JSON-файл. */
export function exportAllUserData(): void {
  const data: UserBackupData = {
    version: 1,
    appVersion: APP_VERSION,
    exportedAt: Date.now(),
    history: readStorage<HistoryItem[]>(STORAGE_KEYS.history, []),
    askHistory: readStorage<AskHistoryItem[]>(STORAGE_KEYS.askHistory, []),
    study: {
      cards: readStorage<StudyCard[]>(STORAGE_KEYS.studyCards, []),
      progress: readStorage<StudyProgress[]>(STORAGE_KEYS.studyProgress, []),
      days: readStorage<StudyDay[]>(STORAGE_KEYS.studyDays, []),
      lists: readStorage<StudyList[]>(STORAGE_KEYS.studyLists, []),
      goal: readStorage<number>(STORAGE_KEYS.studyGoal, 10),
      newPerDay: readStorage<number>(STORAGE_KEYS.studyNewPerDay, 5),
    },
    settings: {
      theme: readStorage<string>(STORAGE_KEYS.theme, 'system'),
      uiLanguage: readStorage<string>(STORAGE_KEYS.uiLanguage, 'ru'),
      translateSettings: readStorage<Record<string, boolean>>(STORAGE_KEYS.translateSettings, {}),
      sourceLang: readStorage<string>(STORAGE_KEYS.sourceLang, 'de'),
      targetLang: readStorage<string>(STORAGE_KEYS.targetLang, 'ru'),
      provider: readStorage<string>(STORAGE_KEYS.provider, 'auto'),
      updatedAt: readStorage<number>(STORAGE_KEYS.settingsUpdatedAt, Date.now()),
    },
  };

  const jsonText = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yai-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Разбирает и безопасно объединяет импортированные данные с локальными.
 * Конфликты разрешаются в пользу более свежей записи.
 */
export function importUserData(jsonText: string): ImportSummary {
  const parsed = parseBackup(jsonText);
  const history = readStorage<HistoryItem[]>(STORAGE_KEYS.history, []);
  const cards = readStorage<StudyCard[]>(STORAGE_KEYS.studyCards, []);
  const progress = readStorage<StudyProgress[]>(STORAGE_KEYS.studyProgress, []);
  const days = readStorage<StudyDay[]>(STORAGE_KEYS.studyDays, []);
  const lists = readStorage<StudyList[]>(STORAGE_KEYS.studyLists, []);
  const imported: Partial<UserBackupData['study']> = parsed.study ?? {};
  const mergedHistory = mergeBackupRows(history, parsed.history ?? [], v => v.id, v => v.updatedAt ?? v.createdAt);
  const merged = mergeStudyState({ cards, progress, days }, imported);
  const mergedLists = mergeBackupRows(lists, imported.lists ?? [], v => v.id, v => v.updatedAt);
  writeStorage(STORAGE_KEYS.history, mergedHistory);
  writeStorage(STORAGE_KEYS.askHistory, mergeBackupRows(
    readStorage<AskHistoryItem[]>(STORAGE_KEYS.askHistory, []), parsed.askHistory ?? [], v => v.id, v => v.createdAt,
  ));
  if (merged) {
    writeStorage(STORAGE_KEYS.studyCards, merged.cards);
    writeStorage(STORAGE_KEYS.studyProgress, merged.progress);
    writeStorage(STORAGE_KEYS.studyDays, merged.days);
  }
  writeStorage(STORAGE_KEYS.studyLists, mergedLists);
  const settings = { ...parsed.settings, studyGoal: imported.goal, studyNewPerDay: imported.newPerDay };
  if (parsed.settings || imported.goal !== undefined || imported.newPerDay !== undefined) {
    applyRemoteSettings(JSON.stringify(settings), parsed.settings?.updatedAt ?? parsed.exportedAt ?? 0);
  }
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('yai:data-imported'));
  window.setTimeout(() => window.dispatchEvent(new CustomEvent('yai:sync-now')), 50);
  return { historyCount: mergedHistory.length - history.length, cardsCount: (merged?.cards.length ?? cards.length) - cards.length, listsCount: mergedLists.length - lists.length };
}
