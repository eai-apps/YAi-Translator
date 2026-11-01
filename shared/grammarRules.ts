/**
 * Шаблонные грамматические правила и подсказки (этап 15Б, версия 0.17.5).
 * Вычисляются из морфологии слова детерминированно, без обращения к ИИ.
 */
import type { GrammarPoint } from './typeWord';
import { getFalseFriend } from './falseFriends';

/** Немецкие глаголы с дательным падежом (Dativ) */
export const DE_DATIV_VERBS = new Set([
  'helfen', 'danken', 'gefallen', 'gehören', 'glauben', 'gratulieren', 'passen',
  'schaden', 'schmecken', 'vertrauen', 'verzeihen', 'wehtun', 'antworten',
  'befehlen', 'begegnen', 'beistehen', 'beitreten', 'drohen', 'einfallen',
  'entkommen', 'fehlen', 'folgen', 'genügen', 'gehorchen', 'missfallen',
  'nähern', 'nützen', 'raten', 'widersprechen', 'zuhören', 'zusehen', 'zustimmen',
  'dienen', 'schaden', 'winken', 'zureden', 'zujubeln', 'schmeicheln',
]);

/** Немецкие глаголы с sein в Perfekt */
export const DE_SEIN_VERBS = new Set([
  'sein', 'werden', 'bleiben', 'gehen', 'fahren', 'laufen', 'fliegen', 'kommen',
  'reisen', 'schwimmen', 'steigen', 'fallen', 'sterben', 'aufstehen', 'aufwachen',
  'einschlafen', 'passieren', 'geschehen', 'gelingen', 'misslingen', 'verschwinden',
  'wachsen', 'ertrinken', 'rennen', 'kriechen', 'wandern', 'hüpfen', 'springen',
]);

/** Немецкие отделяемые приставки */
export const DE_SEPARABLE_PREFIXES = [
  'zurück', 'zusammen', 'weiter', 'vorbei', 'heraus', 'hinein', 'herum',
  'weg', 'aus', 'ein', 'auf', 'ab', 'an', 'bei', 'mit', 'nach', 'vor', 'zu',
  'los', 'her', 'hin', 'fest', 'fern',
];

/** Неотделяемые приставки */
export const DE_INSEPARABLE_PREFIXES = ['be', 'ge', 'emp', 'ent', 'er', 'ver', 'zer', 'miss'];

/** Управление немецких глаголов (предлог + падеж) */
export const DE_VERB_GOVERNANCE: Record<string, string[]> = {
  warten: ['auf + Akk. (ждать кого-то/что-то)'],
  denken: ['an + Akk. (думать о ком-то/чём-то)'],
  bitten: ['um + Akk. (просить о чём-то)'],
  danken: ['für + Akk. (благодарить за что-то)', '+ Dat. (кому)'],
  hoffen: ['auf + Akk. (надеяться на что-то)'],
  freuen: ['auf + Akk. (радоваться предстоящему)', 'über + Akk. (радоваться прошедшему/факту)'],
  interessieren: ['für + Akk. (интересоваться чем-то)'],
  teilnehmen: ['an + Dat. (принимать участие в чём-то)'],
  sprechen: ['mit + Dat. (говорить с кем-то)', 'über + Akk. (о чём-то)', 'von + Dat. (о ком-то)'],
  gehören: ['zu + Dat. (относиться к / входить в состав)', '+ Dat. (принадлежать кому-то)'],
  suchen: ['nach + Dat. (искать что-то)'],
  fragen: ['nach + Dat. (спрашивать о чём-то)', '+ Akk. (спрашивать кого-то)'],
  helfen: ['bei + Dat. (помогать в чём-то)', '+ Dat. (помогать кому-то)'],
  passen: ['zu + Dat. (подходить к чему-то)', '+ Dat. (быть впору кому-то)'],
  abhängen: ['von + Dat. (зависеть от чего-то)'],
  beginnen: ['mit + Dat. (начинать с чего-то)'],
  aufhören: ['mit + Dat. (прекращать что-то)'],
  gratulieren: ['zu + Dat. (поздравлять с чем-то)', '+ Dat. (кого-то)'],
  zweifeln: ['an + Dat. (сомневаться в чём-то)'],
  achten: ['auf + Akk. (обращать внимание на что-то)'],
  glauben: ['an + Akk. (верить в кого-то/что-то)', '+ Dat. (верить кому-то)'],
  schützen: ['vor + Dat. (защищать от чего-то)'],
  warnen: ['vor + Dat. (предупреждать о чём-то)'],
};

/** Формирование грамматических правил для карточки слова */
export function buildGrammarNotes(
  lemma: string,
  lang: string,
  pos?: string,
  gender?: string | null,
  plural?: string | null,
  auxiliary?: string | null,
  explainLang: string = 'ru',
): { grammarNotes: string[]; governance: string[]; grammarPoints: GrammarPoint[] } {
  const notes: string[] = [];
  const governance: string[] = [];
  const points: GrammarPoint[] = [];

  const clean = lemma.trim().toLowerCase().replace(/^sich\s+/i, '');
  const cleanNoun = lemma.trim();

  // 1. Ложный друг переводчика
  if (lang === 'de' && explainLang === 'ru') {
    const ff = getFalseFriend(clean, 'de');
    if (ff) {
      notes.push(`⚠️ Ложный друг переводчика: «${lemma}» означает «${ff.realMeaning}», а не «${ff.mistakenAs}» (для этого используется «${ff.correctWord}»).`);
      points.push({
        title: 'Ложные друзья переводчика',
        explanation: `Слово «${lemma}» созвучно русскому «${ff.mistakenAs}», однако переводится как «${ff.realMeaning}». Чтобы сказать «${ff.mistakenAs}», используйте «${ff.correctWord}».`,
        examples: [],
      });
    }
  }

  // 2. Немецкие существительные: род по суффиксу и число
  if (lang === 'de' && (pos === 'n' || pos === 'noun')) {
    // Правила рода по окончаниям
    if (/ung$|heit$|keit$|schaft$|tion$|tät$|ik$|ie$|ei$|ur$|ade$|anz$|enz$/i.test(cleanNoun)) {
      notes.push(`Род по суффиксу: существительные с данным окончанием всегда женского рода (артикль die).`);
    } else if (/chen$|lein$|ment$|um$|tum$/i.test(cleanNoun)) {
      notes.push(`Род по суффиксу: уменьшительно-ласкательные и заимствованные основы с этим суффиксом среднего рода (артикль das).`);
    } else if (/ismus$|ling$|ist$|or$|ant$|ent$/i.test(cleanNoun)) {
      notes.push(`Род по суффиксу: существительные с данным суффиксом обычно мужского рода (артикль der).`);
    }

    // Множественное число
    if (plural && plural !== cleanNoun) {
      if (plural.endsWith('en') || plural.endsWith('n')) {
        notes.push(`Множественное число образуется при помощи окончания -(e)n (${plural}).`);
      } else if (plural.endsWith('er')) {
        notes.push(`Множественное число образуется с окончанием -er (часто с умлаутом: ${plural}).`);
      } else if (plural.endsWith('s')) {
        notes.push(`Множественное число с окончанием -s (типично для заимствованных и сокращённых слов).`);
      } else if (plural.endsWith('e')) {
        notes.push(`Множественное число образуется с окончанием -e (${plural}).`);
      }
    }
  }

  // 3. Немецкие глаголы
  if (lang === 'de' && (pos === 'v' || pos === 'verb')) {
    // Вспомогательный глагол в Perfekt
    const isSein = auxiliary === 'sein' || DE_SEIN_VERBS.has(clean);
    if (isSein) {
      notes.push(`Perfekt с вспомогательным глаголом sein (глагол движения / смены состояния / глаголы sein, werden, bleiben).`);
    } else {
      notes.push(`Perfekt с вспомогательным глаголом haben.`);
    }

    // Управление дательным падежом
    if (DE_DATIV_VERBS.has(clean)) {
      notes.push(`Требует дательного падежа (Dativ): ${lemma} + Dativ (кому/чему, без предлога).`);
      points.push({
        title: 'Управление падежом: Dativ',
        explanation: `Глагол «${lemma}» относится к группе глаголов, требующих дополнения исключительно в дательном падеже (Dativ).`,
        examples: [],
      });
    }

    // Отделяемые и неотделяемые приставки
    for (const prefix of DE_SEPARABLE_PREFIXES) {
      if (clean.startsWith(prefix) && clean.length > prefix.length + 2) {
        notes.push(`Отделяемая приставка «${prefix}-»: в Präsens и Präteritum в простом предложении отделяется и ставится в конец.`);
        break;
      }
    }
    for (const prefix of DE_INSEPARABLE_PREFIXES) {
      if (clean.startsWith(prefix) && clean.length > prefix.length + 2) {
        notes.push(`Неотделяемая приставка «${prefix}-»: ударение падает на корень слова; в Partizip II приставка ge- не добавляется.`);
        break;
      }
    }

    // Управление предлогами
    const gov = DE_VERB_GOVERNANCE[clean];
    if (gov) {
      governance.push(...gov);
    }
  }

  // 4. Предлоги и падежи
  if (lang === 'de' && (pos === 'prep' || pos === 'preposition')) {
    const akkPreps = ['bis', 'durch', 'für', 'gegen', 'ohne', 'um', 'entlang'];
    const datPreps = ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber', 'außer', 'ab'];
    const wechselPreps = ['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen'];
    const genPreps = ['während', 'wegen', 'trotz', 'statt', 'anstatt', 'außerhalb', 'innerhalb'];

    if (akkPreps.includes(clean)) {
      notes.push(`Предлог строго требует винительного падежа (Akkusativ).`);
    } else if (datPreps.includes(clean)) {
      notes.push(`Предлог строго требует дательного падежа (Dativ).`);
    } else if (wechselPreps.includes(clean)) {
      notes.push(`Предлог двойного управления (Wechselpräposition): с Akkusativ отвечает на вопрос «Куда?» (Wohin?), с Dativ — «Где?» (Wo?).`);
    } else if (genPreps.includes(clean)) {
      notes.push(`Предлог требует родительного падежа (Genitiv). В разговорной речи часто встречается с Dativ.`);
    }
  }

  return { grammarNotes: notes, governance, grammarPoints: points };
}
