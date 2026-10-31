/**
 * Строка действий под переводом (этап 8): 🔊, копировать, «В карточки», ⭐ «Избранное» и «⋯».
 * Вынесено из TranslatePage, чтобы страница оставалась короткой и читаемой.
 */
import { useTranslation } from 'react-i18next';
import type { LanguageCode, StudyCardInput, TranslateResponse } from '../../../shared/types';
import type { SpeechController } from '../../hooks/useSpeech';
import { CopyButton } from '../ui/CopyButton';
import { IconButton } from '../ui/IconButton';
import { SpeakButton } from '../ui/SpeakButton';
import { IconStar } from '../layout/icons';
import { AddToCardsButton } from '../study/AddToCardsButton';
import { CardMenu } from './CardMenu';

interface TranslateActionsProps {
  result: TranslateResponse;
  targetLang: LanguageCode;
  speech: SpeechController;
  isFavorite: boolean;
  /** «⭐» работает, только когда перевод сохранён в историю. */
  canFavorite: boolean;
  onToggleFavorite: () => void;
  studyInput: StudyCardInput | null;
  onExplain: () => void;
  onCheck: () => void;
  canUseTools: boolean;
  onShare: () => void;
  shareSupported: boolean;
}

export function TranslateActions(props: TranslateActionsProps) {
  const { t } = useTranslation();
  const { result, targetLang, speech } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SpeakButton
        text={result.translatedText}
        language={targetLang}
        id="result"
        speech={speech}
        label={t('translate.speakResult')}
      />
      <CopyButton text={result.translatedText} label={t('translate.copyResult')} />
      <AddToCardsButton input={props.studyInput} iconOnly />
      <IconButton
        label={props.isFavorite ? t('translate.favoriteRemove') : t('translate.favoriteAdd')}
        icon={<IconStar className="h-[18px] w-[18px]" filled={props.isFavorite} />}
        active={props.isFavorite}
        disabled={!props.canFavorite}
        onClick={props.onToggleFavorite}
      />
      <CardMenu
        onExplain={props.onExplain}
        onCheck={props.onCheck}
        onShare={props.onShare}
        canUseTools={props.canUseTools}
        shareSupported={props.shareSupported}
        className="ml-auto"
      />
    </div>
  );
}
