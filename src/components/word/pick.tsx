/**
 * «Нажми на слово — переведи его»: синонимы, антонимы, выражения и примеры в карточке слова
 * становятся кнопками, как в Яндекс.Переводчике. Страница перевода передаёт сюда функцию,
 * которая подставляет текст в поле ввода; вне страницы перевода (контекста нет) — обычный текст.
 */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const PickContext = createContext<((text: string) => void) | null>(null);

export function usePick(): ((text: string) => void) | null {
  return useContext(PickContext);
}

/** Текст, который можно нажать, чтобы перевести и разобрать его. */
export function PickText({ text, className, children }: { text: string; className?: string; children?: ReactNode }) {
  const pick = usePick();
  if (!pick) return <span className={className}>{children ?? text}</span>;
  return (
    <button
      type="button"
      onClick={() => pick(text)}
      className={cn('cursor-pointer text-left hover:underline hover:decoration-dotted hover:underline-offset-4', className)}
    >
      {children ?? text}
    </button>
  );
}
