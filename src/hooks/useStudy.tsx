/**
 * Учёба (этап 6): карточки слов, прогресс повторения, дни и настройки.
 * Живёт в localStorage; вошедшему пользователю прогресс синхронизируется с аккаунтом.
 * Упражнения и повторение берут данные отсюда — новых запросов к ИИ нет.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { StudyCard, StudyCardInput, StudyDay, StudyGrade, StudyProgress } from '../../shared/study';
import { STUDY_GOALS, STUDY_NEW_PER_DAY_DEFAULT, studyCardId } from '../../shared/study';
import { STORAGE_KEYS } from '../config';
import { readStorage, writeStorage } from '../lib/storage';
import { mergeStudyState, sanitizeState } from '../lib/studyMerge';
import type { MergeInput, StudyState } from '../lib/studyMerge';
import { computeStreak, dueCount, introducedToday, localDayKey } from '../lib/srs';
import { useAccount } from './useAccount';
import { useStudyActions } from './useStudyActions';
import { useStudySync } from './useStudySync';

interface StudyContextValue {
  cards: StudyCard[];
  progress: StudyProgress[];
  days: StudyDay[];
  /** Цель дня в карточках: 10, 20 или 30. */
  goal: number;
  /** Сколько новых карточек показывать в день. */
  newPerDay: number;
  today: StudyDay;
  streak: number;
  /** Сколько карточек ждёт повторения сейчас. */
  due: number;
  /** Сколько новых слов уже введено сегодня. */
  newToday: number;
  hasCard: (lemma: string) => boolean;
  addCard: (input: StudyCardInput) => boolean;
  addCards: (inputs: StudyCardInput[]) => number;
  removeCard: (cardId: string) => void;
  grade: (cardId: string, grade: StudyGrade) => void;
  recordExercise: (cardId: string, correct: boolean) => void;
  getProgress: (cardId: string) => StudyProgress | null;
  setGoal: (goal: number) => void;
  setNewPerDay: (count: number) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

const EMPTY_DAY: StudyDay = { day: localDayKey(), reviews: 0, exercises: 0, updatedAt: 0 };

function readGoal(): number {
  const stored = Number(readStorage<number>(STORAGE_KEYS.studyGoal, STUDY_GOALS[0]));
  return (STUDY_GOALS as readonly number[]).includes(stored) ? stored : STUDY_GOALS[0];
}

function readNewPerDay(): number {
  const stored = Number(readStorage<number>(STORAGE_KEYS.studyNewPerDay, STUDY_NEW_PER_DAY_DEFAULT));
  if (!Number.isFinite(stored)) return STUDY_NEW_PER_DAY_DEFAULT;
  return Math.min(50, Math.max(1, Math.round(stored)));
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const { status } = useAccount();
  const signedIn = status === 'signedIn';

  const [state, setState] = useState<StudyState>(() =>
    sanitizeState({
      cards: readStorage(STORAGE_KEYS.studyCards, []),
      progress: readStorage(STORAGE_KEYS.studyProgress, []),
      days: readStorage(STORAGE_KEYS.studyDays, []),
    }),
  );
  const [goal, setGoalState] = useState(readGoal);
  const [newPerDay, setNewPerDayState] = useState(readNewPerDay);
  const stateRef = useRef(state);
  stateRef.current = state;

  /** Одна точка записи: состояние, localStorage и синхронизация видят одно и то же. */
  const commit = useCallback((next: StudyState) => {
    stateRef.current = next;
    setState(next);
    writeStorage(STORAGE_KEYS.studyCards, next.cards);
    writeStorage(STORAGE_KEYS.studyProgress, next.progress);
    writeStorage(STORAGE_KEYS.studyDays, next.days);
  }, []);

  const { addCard, addCards, removeCard, grade, recordExercise } = useStudyActions({ stateRef, commit });

  const hasCard = useCallback<StudyContextValue['hasCard']>(
    (lemma) => stateRef.current.cards.some((card) => card.id === studyCardId(lemma)),
    [],
  );

  const progressById = useMemo(
    () => new Map(state.progress.map((item) => [item.cardId, item] as const)),
    [state.progress],
  );

  const getProgress = useCallback<StudyContextValue['getProgress']>(
    (cardId) => progressById.get(cardId) ?? null,
    [progressById],
  );

  const setGoal = useCallback<StudyContextValue['setGoal']>((value) => {
    const next = (STUDY_GOALS as readonly number[]).includes(value) ? value : STUDY_GOALS[0];
    setGoalState(next);
    writeStorage(STORAGE_KEYS.studyGoal, next);
  }, []);

  const setNewPerDay = useCallback<StudyContextValue['setNewPerDay']>((value) => {
    const next = Math.min(50, Math.max(1, Math.round(value)));
    setNewPerDayState(next);
    writeStorage(STORAGE_KEYS.studyNewPerDay, next);
  }, []);

  // Слияние с сервером: null означает «ничего нового», иначе был бы вечный цикл.
  const onMerge = useCallback((payload: MergeInput) => {
    const merged = mergeStudyState(stateRef.current, payload);
    if (merged) commit(merged);
  }, [commit]);

  useStudySync({
    signedIn,
    cards: state.cards,
    progress: state.progress,
    days: state.days,
    onMerge,
  });

  // Сегодняшний день нужен и кольцу, и серии — считаем один раз на изменение.
  const today = useMemo(
    () => state.days.find((item) => item.day === localDayKey()) ?? { ...EMPTY_DAY, day: localDayKey() },
    [state.days],
  );
  const streak = useMemo(() => computeStreak(state.days), [state.days]);
  const due = useMemo(() => dueCount(state.cards, state.progress), [state.cards, state.progress]);
  const newToday = useMemo(() => introducedToday(state.progress), [state.progress]);

  // Настройки должны пережить перезагрузку даже без единой карточки.
  useEffect(() => {
    writeStorage(STORAGE_KEYS.studyGoal, goal);
    writeStorage(STORAGE_KEYS.studyNewPerDay, newPerDay);
  }, [goal, newPerDay]);

  const value = useMemo<StudyContextValue>(
    () => ({
      cards: state.cards,
      progress: state.progress,
      days: state.days,
      goal,
      newPerDay,
      today,
      streak,
      due,
      newToday,
      hasCard,
      addCard,
      addCards,
      removeCard,
      grade,
      recordExercise,
      getProgress,
      setGoal,
      setNewPerDay,
    }),
    [
      state.cards,
      state.progress,
      state.days,
      goal,
      newPerDay,
      today,
      streak,
      due,
      newToday,
      hasCard,
      addCard,
      addCards,
      removeCard,
      grade,
      recordExercise,
      getProgress,
      setGoal,
      setNewPerDay,
    ],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy должен использоваться внутри StudyProvider');
  return context;
}
