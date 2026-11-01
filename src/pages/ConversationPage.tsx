/**
 * Режим «Разговор двух людей» (/conversation, Часть 17).
 * Две половины экрана: для вас и собеседника напротив.
 * Верхняя половина переворачивается на 180° (кнопка ↻),
 * у каждой половины свой язык и микрофон,
 * автоматическая озвучка перевода и лента диалога.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../../shared/types';
import { api } from '../api/client';
import { useSpeech } from '../hooks/useSpeech';
import { useSettings } from '../hooks/useSettings';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import {
  IconMic,
  IconRotate,
  IconSwap,
  IconTrash,
  IconVolume,
} from '../components/layout/icons';
import { cn } from '../lib/cn';

interface DialogueMessage {
  id: string;
  sender: 'user' | 'partner';
  original: string;
  translation: string;
  fromLang: LanguageCode;
  toLang: LanguageCode;
  timestamp: number;
}

const CONV_LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'uk', label: '🇺🇦 Українська' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'pl', label: '🇵🇱 Polski' },
  { code: 'tr', label: '🇹🇷 Türkçe' },
];

export default function ConversationPage() {
  const { t } = useTranslation();
  const { uiLanguage } = useSettings();
  const speech = useSpeech();

  // Языки: для собеседника (сверху) и для пользователя (снизу)
  const [partnerLang, setPartnerLang] = useState<LanguageCode>('de');
  const [userLang, setUserLang] = useState<LanguageCode>(uiLanguage === 'de' ? 'ru' : (uiLanguage as LanguageCode));

  const [rotated, setRotated] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Активный микрофон: 'partner' | 'user' | null
  const [activeSide, setActiveSide] = useState<'partner' | 'user' | null>(null);
  const [translating, setTranslating] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSwapLanguages = () => {
    setPartnerLang(userLang);
    setUserLang(partnerLang);
  };

  const processUtterance = async (speaker: 'user' | 'partner', rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;

    const fromLang = speaker === 'user' ? userLang : partnerLang;
    const toLang = speaker === 'user' ? partnerLang : userLang;

    setTranslating(true);
    try {
      const res = await api.translate({
        text: clean,
        sourceLang: fromLang,
        targetLang: toLang,
        mode: 'classic',
      });

      const translated = res.translatedText?.trim() || clean;
      const msgId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const newMsg: DialogueMessage = {
        id: msgId,
        sender: speaker,
        original: clean,
        translation: translated,
        fromLang,
        toLang,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newMsg]);

      // Автоматическая озвучка на языке слушателя
      if (autoSpeak) {
        speech.speak(translated, toLang, msgId);
      }
    } catch (err) {
      console.error('Conversation translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  const handleStartListening = (side: 'partner' | 'user') => {
    if (activeSide) {
      speech.stopListening();
      setActiveSide(null);
      return;
    }

    const lang = side === 'partner' ? partnerLang : userLang;
    setActiveSide(side);

    speech.listen(lang, (transcript) => {
      setActiveSide(null);
      if (transcript && transcript.trim()) {
        void processUtterance(side, transcript.trim());
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 max-w-4xl mx-auto h-[calc(100dvh-6.5rem)] min-h-[560px]">
      {/* ВЕРХНЯЯ ПОЛОВИНА: Собеседник напротив (может переворачиваться на 180 градусов) */}
      <Card
        className={cn(
          'flex flex-col flex-1 p-4 transition-transform duration-300 relative overflow-hidden',
          rotated && 'rotate-180'
        )}
      >
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">{t('conversation.partnerLabel')}:</span>
            <select
              value={partnerLang}
              onChange={(e) => setPartnerLang(e.target.value as LanguageCode)}
              className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-bold text-ink outline-none"
            >
              {CONV_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {activeSide === 'partner' ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
              {t('translate.voiceListening')}
            </span>
          ) : null}
        </div>

        {/* Последняя реплика собеседника */}
        <div className="flex-1 flex flex-col justify-center items-center text-center p-3 overflow-y-auto">
          {messages.length > 0 ? (
            (() => {
              const lastPartnerMsg = [...messages].reverse().find((m) => m.sender === 'partner');
              const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
              const displayMsg = lastPartnerMsg || lastUserMsg;
              if (!displayMsg) return null;

              const isMine = displayMsg.sender === 'partner';
              return (
                <div className="space-y-1.5 max-w-md">
                  <p className="text-lg font-semibold text-ink sm:text-xl">
                    {isMine ? displayMsg.original : displayMsg.translation}
                  </p>
                  <p className="text-xs text-muted">
                    {isMine ? displayMsg.translation : displayMsg.original}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      speech.speak(
                        isMine ? displayMsg.original : displayMsg.translation,
                        partnerLang,
                        displayMsg.id
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline pt-1"
                  >
                    <IconVolume className="h-3.5 w-3.5" />
                    <span>{t('translate.speak')}</span>
                  </button>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-muted">{t('conversation.partnerHint')}</p>
          )}
        </div>

        {/* Большая кнопка микрофона для собеседника */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => handleStartListening('partner')}
            className={cn(
              'flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all shadow-md active:scale-95',
              activeSide === 'partner'
                ? 'bg-danger text-white ring-4 ring-danger/30 animate-pulse'
                : 'bg-accent text-white hover:opacity-90'
            )}
            aria-label={t('conversation.speakPartner')}
          >
            {activeSide === 'partner' ? (
              <span className="h-4 w-4 rounded-sm bg-white" />
            ) : (
              <IconMic className="h-7 w-7" />
            )}
          </button>
        </div>
      </Card>

      {/* СРЕДНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ (Разделитель с кнопками действий) */}
      <div className="flex items-center justify-between px-3 py-1 bg-soft rounded-2xl border border-line">
        <button
          type="button"
          onClick={() => setRotated((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors',
            rotated ? 'bg-accent text-white' : 'text-muted hover:text-ink'
          )}
          title={t('conversation.rotateOpposite')}
        >
          <IconRotate className="h-4 w-4" />
          <span className="hidden sm:inline">{t('conversation.rotateOpposite')}</span>
          <span className="sm:hidden">180°</span>
        </button>

        <button
          type="button"
          onClick={handleSwapLanguages}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-card hover:text-ink"
          title={t('translate.swapLanguages')}
        >
          <IconSwap className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setAutoSpeak((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors',
            autoSpeak ? 'bg-card text-ink shadow-xs border border-line' : 'text-muted line-through'
          )}
          title={t('conversation.autoSpeak')}
        >
          <IconVolume className="h-4 w-4" />
          <span className="hidden sm:inline">{t('conversation.autoSpeak')}</span>
        </button>

        {messages.length > 0 ? (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-card hover:text-danger"
            title={t('common.clear')}
          >
            <IconTrash className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* НИЖНЯЯ ПОЛОВИНА: Вы (владелец устройства) */}
      <Card className="flex flex-col flex-1 p-4 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">{t('conversation.youLabel')}:</span>
            <select
              value={userLang}
              onChange={(e) => setUserLang(e.target.value as LanguageCode)}
              className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-bold text-ink outline-none"
            >
              {CONV_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {translating ? (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Spinner className="h-3 w-3" />
              {t('translate.translating')}
            </span>
          ) : activeSide === 'user' ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
              <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
              {t('translate.voiceListening')}
            </span>
          ) : null}
        </div>

        {/* Последняя реплика пользователя */}
        <div className="flex-1 flex flex-col justify-center items-center text-center p-3 overflow-y-auto">
          {messages.length > 0 ? (
            (() => {
              const lastMsg = messages[messages.length - 1];
              const isMine = lastMsg.sender === 'user';
              return (
                <div className="space-y-1.5 max-w-md">
                  <p className="text-lg font-semibold text-ink sm:text-xl">
                    {isMine ? lastMsg.original : lastMsg.translation}
                  </p>
                  <p className="text-xs text-muted">
                    {isMine ? lastMsg.translation : lastMsg.original}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      speech.speak(
                        isMine ? lastMsg.original : lastMsg.translation,
                        userLang,
                        lastMsg.id
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline pt-1"
                  >
                    <IconVolume className="h-3.5 w-3.5" />
                    <span>{t('translate.speak')}</span>
                  </button>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-muted">{t('conversation.youHint')}</p>
          )}
        </div>

        {/* Большая кнопка микрофона для пользователя */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => handleStartListening('user')}
            className={cn(
              'flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all shadow-md active:scale-95',
              activeSide === 'user'
                ? 'bg-danger text-white ring-4 ring-danger/30 animate-pulse'
                : 'bg-accent text-white hover:opacity-90'
            )}
            aria-label={t('conversation.speakYou')}
          >
            {activeSide === 'user' ? (
              <span className="h-4 w-4 rounded-sm bg-white" />
            ) : (
              <IconMic className="h-7 w-7" />
            )}
          </button>
        </div>
      </Card>
      <div ref={chatBottomRef} />
    </div>
  );
}
