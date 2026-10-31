/**
 * Запись голоса через MediaRecorder и транскрипция через Workers AI Whisper (/api/transcribe).
 * Знаки препинания (?, !, запятые) ставятся автоматически.
 * Фолбэк на Web Speech API при отсутствии MediaRecorder или ошибке сети.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageCode } from '../../shared/types';
import { api } from '../api/client';
import type { SpeechController } from './useSpeech';

export interface UseAudioVoiceOptions {
  speech: SpeechController;
  onText: (text: string) => void;
  lang: LanguageCode | 'auto';
}

function getBestMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}

const MAX_RECORDING_SEC = 30;

export function useAudioVoice(options: UseAudioVoiceOptions) {
  const { speech, onText, lang } = options;
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const fallbackToWebSpeech = useCallback(() => {
    speech.listen(lang, (transcript) => {
      if (transcript.trim()) {
        onText(transcript.trim());
      }
    });
  }, [lang, onText, speech]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (recording) {
      stop();
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      fallbackToWebSpeech();
      return;
    }

    const mimeType = getBestMimeType();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Пользователь запретил или нет микрофона — пробуем web speech
      fallbackToWebSpeech();
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      fallbackToWebSpeech();
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const totalSize = chunksRef.current.reduce((acc, c) => acc + c.size, 0);
      if (totalSize === 0) {
        return;
      }

      const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      chunksRef.current = [];

      setTranscribing(true);
      try {
        const resp = await api.transcribe(audioBlob, lang === 'auto' ? undefined : lang);
        if (resp.text && resp.text.trim()) {
          onText(resp.text.trim());
        }
      } catch (err) {
        console.warn('Whisper transcribe error, falling back to Web Speech:', err);
        fallbackToWebSpeech();
      } finally {
        setTranscribing(false);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(500); // нарезать чанки по 500 мс
    setRecording(true);
    setSeconds(0);

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SEC) {
        stop();
      }
    }, 500);
  }, [fallbackToWebSpeech, lang, onText, recording, stop]);

  return {
    recording,
    transcribing,
    seconds,
    error,
    start,
    stop,
    active: recording || speech.listening || transcribing,
  };
}
