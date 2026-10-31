/**
 * Состояние переписки «Спроси про слово» в словаре «в одном окне».
 * Очищается автоматически при смене слова.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AskResponse, UiLanguage, WordAskHistoryItem } from '../../shared/types';
import { api } from '../api/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AskResponse;
  error?: string | null;
}

export function useWordChat(word: string, wordContext: string, uiLang: UiLanguage) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const currentWordRef = useRef(word);

  // Очистка переписки при открытии другого слова
  useEffect(() => {
    if (word !== currentWordRef.current) {
      currentWordRef.current = word;
      setMessages([]);
      setLoading(false);
    }
  }, [word]);

  const ask = useCallback(
    async (questionText: string) => {
      const q = questionText.trim();
      if (!q || !word || loading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}-${Math.random()}`,
        role: 'user',
        content: q,
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const history: WordAskHistoryItem[] = messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const resp = await api.wordAsk({
          word,
          wordContext,
          question: q,
          history,
          uiLang,
        });

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}-${Math.random()}`,
          role: 'assistant',
          content: resp.summary,
          response: resp,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const assistantErrorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '',
          error: err instanceof Error ? err.message : 'Error',
        };
        setMessages((prev) => [...prev, assistantErrorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, uiLang, word, wordContext],
  );

  return { messages, loading, ask };
}
