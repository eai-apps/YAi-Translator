/**
 * Промпт «Спросить про слово» в словаре (этап 8В, Antigravity). Вынесен из prompts.ts, чтобы тот
 * оставался до ~250 строк без сокращения инструкций карточки слова.
 */
import type { UiLanguage } from '../../shared/types';
import type { ProviderPrompt } from './providers/types';
import { GRAMMAR_TOPIC_CODES, JSON_RULES, UI_NAMES, asData } from './prompts';

const ASK_SCHEMA = '{"summary":"string","sections":[{"heading":"string","text":"string"}],"examples":[{"text":"string","translation":"string"}],"topics":["slug"]}';

/** Ответ учителя в словаре «в одном окне»: слово + краткий контекст + вопрос. */
export function buildWordAskPrompt(input: {
  word: string;
  wordContext: string;
  question: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  uiLang: UiLanguage;
}): ProviderPrompt {
  const { word, wordContext, question, history, uiLang } = input;
  const interfaceLanguage = UI_NAMES[uiLang];
  const system = `You are a friendly, precise German tutor. A learner is studying "${word}" and asks follow-up questions.
Word context:\n${wordContext}
Rules:
- Answer in ${interfaceLanguage}. Be short and useful.
- "summary": 1-3 sentences direct answer first.
- "sections": 1-4 blocks; "heading" short title in ${interfaceLanguage}, "text" 1-3 sentences.
- "examples": 2-5 German sentences with translation.
- "topics": 0-4 slugs from: ${GRAMMAR_TOPIC_CODES}.
- No facts invention, no URLs.
${JSON_RULES}
JSON schema:
${ASK_SCHEMA}`;

  const historyLines = history.slice(-12).map((m) => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.content}`).join('\n');
  const userText = historyLines ? `Previous messages:\n${historyLines}\n\n${asData('New question', question)}` : asData('Learner question', question);
  return { task: 'ask', system, user: userText };
}
