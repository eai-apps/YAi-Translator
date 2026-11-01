/**
 * Модальное окно с карточкой слова (этап 13).
 * Открывается при нажатии на чип или подчёркнутое слово в переводе.
 * На телефоне — удобный лист снизу, на ПК — диалог.
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DictEntry } from '../../../shared/types';
import type { LexiconMatch } from '../../hooks/useLexicon';
import type { SpeechController } from '../../hooks/useSpeech';
import { Modal } from '../ui/Modal';
import { InstantWordCard } from './InstantWordCard';
import { AddToStudyQuickButton } from '../study/AddToStudyQuickButton';
import { Button } from '../ui/Button';
import { IconBook } from '../layout/icons';

interface WordDetailModalProps {
  match: LexiconMatch | null;
  open: boolean;
  onClose: () => void;
  speech?: SpeechController;
  translation?: string;
}

export function WordDetailModal({
  match,
  open,
  onClose,
  speech,
  translation,
}: WordDetailModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!match) return null;

  const article = match.entry.pos === 'n' ? match.entry.g : null;
  const translations = translation ? [translation] : undefined;

  const handleOpenInDictionary = () => {
    onClose();
    navigate(`/dictionary?q=${encodeURIComponent(match.lemma)}`);
  };

  const pos =
    match.entry.pos === 'n'
      ? 'noun'
      : match.entry.pos === 'v'
      ? 'verb'
      : match.entry.pos === 'adj'
      ? 'adjective'
      : 'other';

  const mockDictEntry: DictEntry | null = translation
    ? {
        word: match.lemma,
        sourceLang: 'de',
        targetLang: 'ru',
        gender: article,
        plural: match.entry.pos === 'n' ? match.entry.pl ?? null : null,
        partOfSpeech: pos,
        transcription: match.entry.ipa ?? null,
        forms: [],
        senses: [
          {
            source: 'wiktionary',
            partOfSpeech: pos,
            definition: translation,
            translation,
            translationLang: 'ru',
          },
        ],
        examples: [],
        definitions: [],
        synonyms: [],
        sources: [],
      }
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={match.lemma}
      className="sm:max-w-md"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-4 bg-soft">
          <AddToStudyQuickButton
            lemma={match.lemma}
            article={article}
            translations={translations}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<IconBook className="h-4 w-4" />}
            onClick={handleOpenInDictionary}
          >
            {t('dictionary.title')}
          </Button>
        </div>
      }
    >
      <div className="p-5">
        <InstantWordCard
          match={match}
          speech={speech}
          dictEntry={mockDictEntry}
        />
      </div>
    </Modal>
  );
}
