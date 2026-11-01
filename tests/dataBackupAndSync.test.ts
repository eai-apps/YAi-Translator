import { describe, it, expect, beforeEach } from 'vitest';
import { buildAnki, buildCsv } from '../src/lib/studyExport';
import { applyRemoteSettings, readLocalSettings } from '../src/lib/settingsSync';
import { importUserData } from '../src/lib/dataBackup';
import { STORAGE_KEYS } from '../src/config';
import type { StudyCard } from '../shared/study';

describe('Part 20 - Data Backup, Export and Settings Sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('buildAnki formats 3 columns (слово;перевод;пример) for Anki CSV export', () => {
    const cards: StudyCard[] = [
      {
        id: 'de:haus',
        lang: 'de',
        lemma: 'Haus',
        article: 'das',
        pos: 'n',
        translations: ['дом', 'здание'],
        addedAt: 1000,
        updatedAt: 1000,
        example: {
          text: 'Das ist ein schönes Haus.',
          translation: 'Это красивый дом.',
        },
      },
      {
        id: 'de:gehen',
        lang: 'de',
        lemma: 'gehen',
        pos: 'v',
        translations: ['идти'],
        addedAt: 1000,
        updatedAt: 1000,
      },
    ];

    const ankiText = buildAnki(cards);
    expect(ankiText).toContain('#separator:Semicolon');
    // First card: word with article; translations; example
    expect(ankiText).toContain('"das Haus";"дом, здание";"Das ist ein schönes Haus. — Это красивый дом."');
    // Second card: verb without article; translation; empty example
    expect(ankiText).toContain('"gehen";"идти";""');
  });

  it('applyRemoteSettings adheres to "last write wins" based on updatedAt', () => {
    // 1. Initial local setting updatedAt = 1000
    localStorage.setItem(STORAGE_KEYS.settingsUpdatedAt, '1000');
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify('dark'));

    // 2. Remote setting with older timestamp (500) -> ignored
    const olderApplied = applyRemoteSettings(
      JSON.stringify({ theme: 'light', updatedAt: 500 }),
      500,
    );
    expect(olderApplied).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.theme) || '""')).toBe('dark');

    // 3. Remote setting with newer timestamp (2000) -> applied
    const newerApplied = applyRemoteSettings(
      JSON.stringify({ theme: 'light', updatedAt: 2000 }),
      2000,
    );
    expect(newerApplied).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.theme) || '""')).toBe('light');
    expect(Number(localStorage.getItem(STORAGE_KEYS.settingsUpdatedAt))).toBe(2000);
  });

  it('importUserData successfully parses and merges backup records', () => {
    const backupJson = JSON.stringify({
      version: 1,
      appVersion: '0.22.0',
      exportedAt: 1234567,
      history: [
        {
          id: 'hist-1',
          text: 'Hallo',
          translation: 'Привет',
          sourceLang: 'de',
          targetLang: 'ru',
          createdAt: 2000,
          favorite: true,
        },
      ],
      study: {
        cards: [
          {
            id: 'de:buch',
            lang: 'de',
            lemma: 'Buch',
            article: 'das',
            pos: 'n',
            translations: ['книга'],
            addedAt: 1000,
            updatedAt: 2000,
          },
        ],
        lists: [
          {
            id: 'my-list-1',
            title: 'Важные слова',
            emoji: '⭐',
            cardIds: ['de:buch'],
            createdAt: 1000,
            updatedAt: 2000,
          },
        ],
      },
    });

    const summary = importUserData(backupJson);
    expect(summary.historyCount).toBe(1);
    expect(summary.cardsCount).toBe(1);
    expect(summary.listsCount).toBe(1);

    const storedHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
    expect(storedHistory).toHaveLength(1);
    expect(storedHistory[0].text).toBe('Hallo');

    const storedCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.studyCards) || '[]');
    expect(storedCards).toHaveLength(1);
    expect(storedCards[0].lemma).toBe('Buch');
  });
});
