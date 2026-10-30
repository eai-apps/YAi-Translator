/** Типы провайдеров ИИ. Один провайдер = один файл в папке providers. */
import type { ProviderId, TaskKind } from '../../../shared/types';
import type { Env } from '../env';

export interface ProviderPrompt {
  task: TaskKind;
  system: string;
  user: string;
}

export interface GenerateInput {
  prompt: ProviderPrompt;
  env: Env;
  /** Ключ конкретного вызова: либо пользователя, либо общий ключ сайта. */
  apiKey?: string;
  /** Общий сигнал отмены (клиент ушёл или истёк общий таймаут). */
  signal: AbortSignal;
}

export interface AiProvider {
  id: ProviderId;
  /** Задачи, которые провайдер умеет решать в формате JSON. */
  tasks: TaskKind[];
  /** Возвращает сырой текст ответа модели. Проверка JSON — в router.ts. */
  generate(input: GenerateInput): Promise<string>;
}
