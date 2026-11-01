import { describe, it, expect } from 'vitest';
import {
  DAY_MS,
  emptyProgress,
  nextProgress,
  pickSession,
  computeStreak,
} from '../src/lib/srs';
import type { StudyCard, StudyDay } from '../shared/study';

describe('Spaced Repetition System (SRS)', () => {
  const now = new Date(2026, 9, 31, 12, 0, 0).getTime();

  it('1. New card + "good" -> 1 day interval, reps 1, introducedAt = now', () => {
    const first = nextProgress(null, 'de:haus', 'good', now);
    expect(first.interval).toBe(1);
    expect(first.reps).toBe(1);
    expect(first.introducedAt).toBe(now);
    expect(first.due).toBe(now + DAY_MS);
  });

  it('2. Repetition ladder: 1 -> 3 -> 7 days', () => {
    const first = nextProgress(null, 'de:haus', 'good', now);
    const second = nextProgress(first, 'de:haus', 'good', now + DAY_MS);
    const third = nextProgress(second, 'de:haus', 'good', now + 4 * DAY_MS);

    expect(first.interval).toBe(1);
    expect(second.interval).toBe(3);
    expect(third.interval).toBe(7);
  });

  it('3. "again" resets interval to 0, due = now, lapses + 1, ease - 0.2', () => {
    const base = {
      ...emptyProgress('de:haus', now),
      interval: 7,
      ease: 2.5,
      reps: 3,
      due: now,
    };
    const again = nextProgress(base, 'de:haus', 'again', now + 11 * DAY_MS);
    expect(again.interval).toBe(0);
    expect(again.due).toBe(now + 11 * DAY_MS);
    expect(again.lapses).toBe(1);
    expect(again.ease).toBeCloseTo(2.3);
  });

  it('4. "easy" from interval 3 jumps ladder to 16 days, ease + 0.15', () => {
    const first = nextProgress(null, 'de:haus', 'good', now);
    const easyBase = { ...first, interval: 3, ease: 2.5, due: now };
    const easy = nextProgress(easyBase, 'de:haus', 'easy', now);
    expect(easy.interval).toBe(16);
    expect(easy.ease).toBeCloseTo(2.65);
  });

  it('5. "hard" from interval 7 retreats to 3 days, ease - 0.15', () => {
    const first = nextProgress(null, 'de:haus', 'good', now);
    const hardBase = { ...first, interval: 7, ease: 2.5, due: now };
    const hard = nextProgress(hardBase, 'de:haus', 'hard', now);
    expect(hard.interval).toBe(3);
    expect(hard.ease).toBeCloseTo(2.35);
    expect(hard.due).toBe(now + 3 * DAY_MS);
  });

  it('6. pickSession: overdue cards first, limits new cards', () => {
    const makeCard = (id: string): StudyCard => ({
      id,
      lemma: id.slice(3),
      lang: 'de',
      article: 'das',
      plural: null,
      partOfSpeech: 'noun',
      translations: ['слово'],
      example: null,
      perfekt: null,
      addedAt: now,
      updatedAt: now,
    });

    const cards = ['de:eins', 'de:zwei', 'de:drei', 'de:vier', 'de:fuenf'].map(makeCard);
    const progress = [
      { ...emptyProgress('de:eins', now), due: now - 1000, interval: 3, reps: 2, introducedAt: now - 3 * DAY_MS },
      { ...emptyProgress('de:zwei', now), due: now - 5000, interval: 1, reps: 1, introducedAt: now - 2 * DAY_MS },
    ];

    const session = pickSession(cards, progress, { now, newPerDay: 2, limit: 10 });
    expect(session.length).toBe(4); // 2 overdue + 2 new
    // Overdue first, ordered by due ascending
    expect(session[0].card.id).toBe('de:zwei');
    expect(session[1].card.id).toBe('de:eins');
    expect(session[0].isNew).toBe(false);
    expect(session[1].isNew).toBe(false);
    // New cards
    expect(session[2].isNew).toBe(true);
    expect(session[3].isNew).toBe(true);
  });

  it('7. computeStreak: correctly counts consecutive active days', () => {
    const today = new Date(now).toISOString().slice(0, 10);
    const yesterday = new Date(now - DAY_MS).toISOString().slice(0, 10);
    const days: StudyDay[] = [
      { day: yesterday, reviews: 10, exercises: 0 },
      { day: today, reviews: 10, exercises: 0 },
    ];
    const streak = computeStreak(days, now, 10);
    expect(streak).toBe(2);
  });
});
