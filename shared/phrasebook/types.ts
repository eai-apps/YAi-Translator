/**
 * Типы разговорника.
 */
export interface PhraseItem {
  id: string;
  topicId: string;
  de: string;
  en: string;
  ru: string;
  uk: string;
  context?: string;
}

export interface PhraseTopic {
  id: string;
  icon: string;
  titleKey: string;
  phrases: PhraseItem[];
}
