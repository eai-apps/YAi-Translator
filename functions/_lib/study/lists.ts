/**
 * Проверка списков слов «Мои списки» (этап 8Б) перед записью в D1.
 * Как и у карточек: битый запрос отклоняется целиком, а не портит списки пользователя.
 */
import type { StudyList } from '../../../shared/types';
import { STUDY_LIST_CARDS_MAX, STUDY_LIST_MAX } from '../../../shared/study';
import { ApiError } from '../http';
import { list } from './validate';

/** Подписи списка: как в src/lib/studyLists.ts (LIST_TITLE_MAX / LIST_EMOJI_MAX). */
const TITLE_MAX = 40;
const EMOJI_MAX = 8;
const CARD_ID_MAX = 140;

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') throw new ApiError('VALIDATION', 400);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new ApiError('VALIDATION', 400);
  return trimmed;
}

export function parseList(raw: unknown): StudyList {
  const item = raw as Partial<StudyList> | null;
  if (!item || typeof item !== 'object') throw new ApiError('VALIDATION', 400);

  const id = text(item.id, 60);
  if (!/^[a-z0-9]{3,60}$/.test(id)) throw new ApiError('VALIDATION', 400);

  const cardIds = Array.isArray(item.cardIds) ? item.cardIds : [];
  if (cardIds.length > STUDY_LIST_CARDS_MAX) throw new ApiError('VALIDATION', 400);

  const stamp = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new ApiError('VALIDATION', 400);
    return Math.round(value);
  };

  return {
    id,
    title: text(item.title, TITLE_MAX),
    emoji: typeof item.emoji === 'string' ? item.emoji.trim().slice(0, EMOJI_MAX) : '',
    cardIds: [...new Set(cardIds.map((cardId) => text(cardId, CARD_ID_MAX)))],
    createdAt: stamp(item.createdAt),
    updatedAt: stamp(item.updatedAt),
  };
}

/** Списки из тела запроса; больше лимита аккаунта не принимаем. */
export function parseLists(value: unknown): StudyList[] {
  const items = list(value).map(parseList);
  if (items.length > STUDY_LIST_MAX) throw new ApiError('VALIDATION', 400);
  return items;
}
