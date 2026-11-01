/**
 * Озвучка и голосовой ввод:
 * - В браузере (Web) — через Web Speech API (speechSynthesis / SpeechRecognition).
 * - В приложении (Android) — синтез речи через нативный плагин @capacitor-community/text-to-speech.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { LanguageCode } from '../../shared/types';
import { getLanguage } from '../../shared/languages';
import { storeBuild } from '../config';

export type SpeechError = 'unsupported' | 'denied' | 'no-speech' | 'failed' | null;

export type SpeechController = ReturnType<typeof useSpeech>;

function speechCode(language: LanguageCode | 'auto'): string {
  if (language === 'auto') return 'de-DE';
  return getLanguage(language)?.speechCode ?? 'de-DE';
}

export function useSpeech() {
  const isAndroid = storeBuild() === 'android';
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const supported = useMemo(
    () => ({
      synthesis: isAndroid || (typeof window !== 'undefined' && 'speechSynthesis' in window),
      recognition:
        typeof window !== 'undefined' &&
        Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition),
    }),
    [isAndroid],
  );

  // Останавливаем озвучку при уходе со страницы.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (isAndroid) {
        TextToSpeech.stop().catch(() => undefined);
      } else if (supported.synthesis && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.abort();
    };
  }, [isAndroid, supported.synthesis]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isAndroid) {
      TextToSpeech.stop().catch(() => undefined);
    } else if (supported.synthesis && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  }, [isAndroid, supported.synthesis]);

  const playTts = useCallback(
    (clean: string, language: LanguageCode | 'auto') => {
      if (!supported.synthesis) {
        setError('unsupported');
        setSpeakingId(null);
        return;
      }
      if (isAndroid) {
        TextToSpeech.stop()
          .catch(() => undefined)
          .then(() =>
            TextToSpeech.speak({
              text: clean,
              lang: speechCode(language),
              rate: 0.95,
              pitch: 1.0,
              volume: 1.0,
            }),
          )
          .then(() => {
            setSpeakingId(null);
          })
          .catch(() => {
            setSpeakingId(null);
            setError('failed');
          });
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = speechCode(language);
        utterance.rate = 0.95;
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => {
          setSpeakingId(null);
          setError('failed');
        };
        window.speechSynthesis.speak(utterance);
      }
    },
    [isAndroid, supported.synthesis],
  );

  const speak = useCallback(
    (text: string, language: LanguageCode | 'auto', id = 'default', audioUrl?: string) => {
      const clean = text.trim();
      if (!clean) return;

      // Повторное нажатие на ту же кнопку останавливает озвучку.
      if (speakingId === id) {
        stopSpeaking();
        return;
      }

      stopSpeaking();
      setError(null);
      setSpeakingId(id);

      // Если передана запись человеческого голоса (Wikimedia Commons / Lingua Libre)
      if (audioUrl && typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        try {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => {
            setSpeakingId(null);
            audioRef.current = null;
          };
          const fallback = () => {
            if (audioRef.current !== audio) return;
            audioRef.current = null;
            audio.onerror = null;
            playTts(clean, language);
          };
          audio.onerror = fallback;
          audio.play().catch(fallback);
          return;
        } catch {
          audioRef.current = null;
          playTts(clean, language);
          return;
        }
      }

      playTts(clean, language);
    },
    [playTts, speakingId, stopSpeaking],
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
