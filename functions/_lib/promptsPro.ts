/**
 * «Суперточный перевод (ИИ Pro)» (0.10.2, Claude): обычный перевод + 3 лёгких примера и один цепляющий совет.
 * Вынесено из prompts.ts, чтобы тот оставался до ~250 строк без сокращения инструкций.
 */
import type { ProviderPrompt } from './providers/types';
import { UI_NAMES, buildTranslatePrompt } from './prompts';

type TranslateInput = Parameters<typeof buildTranslatePrompt>[0];

export function buildTranslateProPrompt(input: TranslateInput): ProviderPrompt {
  const base = buildTranslatePrompt(input);
  const ui = UI_NAMES[input.uiLang];
  const extra = `- "examples": exactly 3 short, easy, everyday sentences (level A1-A2, 4-9 words) in the TARGET language that use the key word(s) of "translatedText" in different natural situations; each with "translation" into ${ui}. If the text is a long sentence or paragraph, give 3 short sentences with its key word or construction.
- "tip": ONE short catchy tip in ${ui} (max 2 sentences) that helps to remember or use the translation: a memory hook, a false friend, a typical mistake, the article/plural trick or a fun fact. No generic advice.`;
  const system = base.system
    .replace('- Never add explanations or notes.', `${extra}\n- Never add any other explanations or notes.`)
    .replace(
      '"detectedLang":"de|ru|uk|en|fr|es|it|pt|pl|nl|tr|ar|null"}',
      '"detectedLang":"de|ru|uk|en|fr|es|it|pt|pl|nl|tr|ar|null","examples":[{"text":"string","translation":"string"}],"tip":"string"}',
    );
  return { ...base, system };
}
