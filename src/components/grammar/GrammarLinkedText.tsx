/**
 * Параграфы с кликабельными терминами грамматики (версия 0.6.0).
 * Стили и отступы — класс linked-text из src/styles/index.css.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { grammarTermsInText } from './grammarHighlight';
import { useGrammar } from './useGrammar';

/** Кнопка-термин: открывает тему, не уводя со страницы. */
function TermButton({ term, slug, hint }: { term: string; slug: string; hint: string }) {
  const { open } = useGrammar();
  return (
    <button
      type="button"
      onClick={() => open(slug)}
      title={hint}
      className="rounded underline decoration-accent/60 decoration-dotted underline-offset-2 transition-colors hover:bg-accentSoft hover:text-accent"
    >
      {term}
    </button>
  );
}

/** Текст с терминами — одна строка или несколько абзацев. */
export function GrammarLinkedText({ items }: { items: string[] }) {
  const { t } = useTranslation();
  const hint = t('grammar.openTerm');
  return (
    <div className="linked-text">
      {items.map((item, index) => (
        <p key={index}>{renderParts(item, hint)}</p>
      ))}
    </div>
  );
}

/** Одно предложение с терминами (заголовок раздела, ответ учителя). */
export function GrammarLinkedInline({ text }: { text: string }) {
  const { t } = useTranslation();
  return <>{renderParts(text, t('grammar.openTerm'))}</>;
}

function renderParts(text: string, hint: string): ReactNode[] {
  return grammarTermsInText(text).map((part, index) =>
    part.slug ? (
      <TermButton key={index} term={part.text} slug={part.slug} hint={hint} />
    ) : (
      <span key={index}>{part.text}</span>
    ),
  );
}
