/** Озвучка и голосовой ввод через бесплатные Web Speech API браузера. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LanguageCode } from '../../shared/types';
import { getLanguage } from '../../shared/languages';

export type SpeechError = 'unsupported' | 'denied' | 'no-speech' | 'failed' | null;

export type SpeechController = ReturnType<typeof useSpeech>;

function speechCode(language: LanguageCode | 'auto'): string {
  if (language === 'auto') return 'de-DE';
  return getLanguage(language)?.speechCode ?? 'de-DE';
}

export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const supported = useMemo(
    () => ({
      synthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
      recognition:
        typeof window !== 'undefined' &&
        Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition),
    }),
    [],
  );

  // Останавливаем озвучку при уходе со страницы.
  useEffect(() => {
    return () => {
      if (supported.synthesis) window.speechSynthesis.cancel();
      recognitionRef.current?.abort();
    };
  }, [supported.synthesis]);

  const stopSpeaking = useCallback(() => {
    if (supported.synthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [supported.synthesis]);

  const speak = useCallback(
    (text: string, language: LanguageCode | 'auto', id = 'default') => {
      if (!supported.synthesis) {
        setError('unsupported');
        return;
      }
      const clean = text.trim();
      if (!clean) return;

      // Повторное нажатие на ту же кнопку останавливает озвучку.
      if (speakingId === id) {
        stopSpeaking();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = speechCode(language);
      utterance.rate = 0.95;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => {
        setSpeakingId(null);
        setError('failed');
      };
      setError(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [speakingId, stopSpeaking, supported.synthesis],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const listen = useCallback(
    (language: LanguageCode | 'auto', onText: (text: string) => void) => {
      const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!supported.recognition || !Recognition) {
        setError('unsupported');
        return;
      }
      if (listening) {
        stopListening();
        return;
      }

      const recognition = new Recognition();
      recognition.lang = speechCode(language);
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = Array.from(
          { length: event.results.length },
          (_, index) => event.results[index][0].transcript,
        )
          .join(' ')
          .trim();
        if (transcript) onText(transcript);
      };
      recognition.onerror = (event) => {
        setError(event.error === 'not-allowed' ? 'denied' : 'no-speech');
        setListening(false);
      };
      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setError(null);
      setListening(true);
      try {
        recognition.start();
      } catch {
        setError('failed');
        setListening(false);
      }
    },
    [listening, stopListening, supported.recognition],
  );

  return {
    supported,
    speakingId,
    listening,
    error,
    speak,
    stopSpeaking,
    listen,
    stopListening,
  };
}
