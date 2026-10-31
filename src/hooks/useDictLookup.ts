/**
 * Фоновые запросы к словарям (этап 4): карточка из словарей грузится параллельно с ИИ,
 * чтобы страница не ждала два ответа по очереди.
 */
import { useCallback, useRef, useState } from 'react';
import type { DictResponse, LanguageCode } from '../../shared/types';
import { api } from '../api/client';
import { toTranslatorError } from '../lib/errors';
import type { TranslatorError } from '../lib/errors';

/** Карточка из настоящих словарей (этап 4). */
export interface DictState {
  loading: boolean;
  data: DictResponse | null;
  error: TranslatorError | null;
}

export const EMPTY_DICT: DictState = { loading: false, data: null, error: null };

export function useDictLookup() {
  const [dict, setDict] = useState<DictState>(EMPTY_DICT);
  // Номер последнего запроса: ответ на старое слово не должен перезаписать новое.
  const requestRef = useRef(0);

  const resetDict = useCallback(() => {
    requestRef.current += 1;
    setDict(EMPTY_DICT);
  }, []);

  /**
   * Ошибка словарей не показывается: если ИИ тоже не справится, пользователь увидит понятное сообщение.
   * «Словари не знают слова» — не ошибка: карточка просто будет от ИИ.
   */
  const loadDict = useCallback(
    async (word: string, target: LanguageCode, signal: AbortSignal, source: LanguageCode | 'auto' = 'auto') => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setDict({ loading: true, data: null, error: null });
      try {
        const data = await api.dict({ word, sourceLang: source, targetLang: target }, signal);
        if (requestId !== requestRef.current) return;
        setDict({ loading: false, data, error: null });
      } catch (caught) {
        if (signal.aborted || requestId !== requestRef.current) return;
        const code = caught instanceof Error && 'code' in caught ? String(caught.code) : '';
        setDict({
          loading: false,
          data: null,
          error: code === 'WORD_NOT_FOUND' ? null : toTranslatorError(caught, ''),
        });
      }
    },
    [],
  );

  return { dict, loadDict, resetDict };
}
