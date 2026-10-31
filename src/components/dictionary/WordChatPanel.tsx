/**
 * Чат со словарем «в одном окне»: вопросы про слово прямо под карточкой.
 * Ответы ИИ с кликабельными немецкими словами (PickText).
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { UiLanguage } from '../../../shared/types';
import { useWordChat } from '../../hooks/useWordChat';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { IconAsk, IconSparkles } from '../layout/icons';
import { PickText } from '../word/pick';

interface WordChatPanelProps {
  word: string;
  wordSummary: string;
  uiLang: UiLanguage;
  onPickWord?: (text: string) => void;
}

export function WordChatPanel({ word, wordSummary, uiLang }: WordChatPanelProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const { messages, loading, ask } = useWordChat(word, wordSummary, uiLang);

  const prompts = [
    { label: t('dictionary.chatPromptExamples'), query: t('dictionary.chatQueryExamples', { word }) },
    { label: t('dictionary.chatPromptDiff'), query: t('dictionary.chatQueryDiff', { word }) },
    { label: t('dictionary.chatPromptMnemonic'), query: t('dictionary.chatQueryMnemonic', { word }) },
    { label: t('dictionary.chatPromptMistakes'), query: t('dictionary.chatQueryMistakes', { word }) },
  ];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading) return;
    ask(input);
    setInput('');
  };

  const handlePromptClick = (query: string) => {
    if (loading) return;
    ask(query);
  };

  return (
    <Card className="mt-4 p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-line pb-2 text-sm font-semibold text-ink">
        <IconAsk className="h-4 w-4 text-accent" />
        <span>{t('dictionary.chatTitle', { word })}</span>
      </div>

      {/* Готовые кнопки-подсказки над полем */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePromptClick(p.query)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-soft/60 px-2.5 py-1 text-xs text-ink transition-colors hover:border-accent hover:bg-soft disabled:opacity-50"
          >
            <IconSparkles className="h-3 w-3 text-accent" />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Список сообщений диалога */}
      {messages.length > 0 ? (
        <div className="mb-4 space-y-3">
          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-accent px-3.5 py-2 text-sm text-accentInk">
                    {m.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[95%] rounded-2xl border border-line bg-card p-3 text-sm text-ink sm:p-4">
                  {m.error ? (
                    <p className="text-danger">{m.error}</p>
                  ) : (
                    <div className="space-y-2.5">
                      {m.response?.summary ? (
                        <p className="font-medium leading-relaxed">{m.response.summary}</p>
                      ) : null}

                      {m.response?.sections?.map((sec, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                          {sec.heading ? (
                            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
                              {sec.heading}
                            </h4>
                          ) : null}
                          <p className="text-sm leading-relaxed text-ink/90">{sec.text}</p>
                        </div>
                      ))}

                      {m.response?.examples && m.response.examples.length > 0 ? (
                        <div className="mt-2 rounded-xl bg-soft/50 p-2.5 space-y-1.5 text-xs">
                          <p className="font-semibold text-muted">{t('word.examples')}:</p>
                          {m.response.examples.map((ex, eIdx) => (
                            <div key={eIdx} className="border-l-2 border-accent/40 pl-2 leading-relaxed">
                              <span className="font-medium text-ink">
                                <PickText text={ex.text} />
                              </span>
                              <span className="text-muted"> — {ex.translation}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Индикатор набора ответа */}
      {loading ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted">
          <Spinner className="h-4 w-4" />
          <span>{t('common.loading')}</span>
        </div>
      ) : null}

      {/* Поле ввода */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('dictionary.chatPlaceholder')}
          aria-label={t('dictionary.chatPlaceholder')}
          maxLength={300}
          disabled={loading}
          className="h-10 flex-1 rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="h-10 rounded-xl bg-accent px-4 text-xs font-semibold text-accentInk transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('common.send', 'Спросить')}
        </button>
      </form>
    </Card>
  );
}
