/**
 * Обновление локалей (ru.json, de.json, en.json) для Части 17.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ruPath = path.join(ROOT, 'src', 'locales', 'ru.json');
const dePath = path.join(ROOT, 'src', 'locales', 'de.json');
const enPath = path.join(ROOT, 'src', 'locales', 'en.json');

const ru = JSON.parse(readFileSync(ruPath, 'utf-8'));
const de = JSON.parse(readFileSync(dePath, 'utf-8'));
const en = JSON.parse(readFileSync(enPath, 'utf-8'));

// 1. nav
ru.nav.phrasebook = 'Разговорник';
de.nav.phrasebook = 'Sprachführer';
en.nav.phrasebook = 'Phrasebook';

ru.nav.letter = 'Письмо из Behörde';
de.nav.letter = 'Behördenbrief';
en.nav.letter = 'Official Letter';

// 2. translate
ru.translate.photo = 'Перевести с фото';
de.translate.photo = 'Aus Foto übersetzen';
en.translate.photo = 'Translate from photo';

ru.translate.ocrProgress = 'Распознаём текст...';
de.translate.ocrProgress = 'Text wird erkannt...';
en.translate.ocrProgress = 'Recognizing text...';

// 3. about
ru.about.licenseTesseractJs = 'Оптическое распознавание текста (OCR) — лицензия Apache-2.0, библиотека Tesseract.js.';
de.about.licenseTesseractJs = 'Optische Zeichenerkennung (OCR) — Apache-2.0-Lizenz, Tesseract.js-Bibliothek.';
en.about.licenseTesseractJs = 'Optical Character Recognition (OCR) — Apache-2.0 license, Tesseract.js library.';

// 4. phrasebook
ru.phrasebook = {
  title: 'Разговорник',
  subtitle: 'Популярные фразы по 12 жизненным темам с переводом и озвучкой',
  searchPlaceholder: 'Поиск фразы на любом языке...',
  allTopics: 'Все темы',
  learningLang: 'Изучаемый язык',
  translationLang: 'Язык перевода',
  notFound: 'Ничего не найдено по вашему запросу.',
  topics: {
    greetings: 'Приветствие',
    behoerde: 'Behörde / Ведомства',
    doctor: 'Врач и аптека',
    housing: 'Жильё и аренда',
    shopping: 'Покупки',
    restaurant: 'Ресторан и кафе',
    transport: 'Транспорт и поезда',
    emergency: 'Экстренные случаи',
    work: 'Работа и резюме',
    school: 'Школа и детсад',
    phone: 'Телефон',
    bank: 'Банк и почта',
  },
};

de.phrasebook = {
  title: 'Sprachführer',
  subtitle: 'Praktische Redewendungen zu 12 Alltagsthemen mit Übersetzung und Audio',
  searchPlaceholder: 'Phrase in beliebiger Sprache suchen...',
  allTopics: 'Alle Themen',
  learningLang: 'Lernsprache',
  translationLang: 'Übersetzungssprache',
  notFound: 'Keine Phrasen gefunden.',
  topics: {
    greetings: 'Begrüßung',
    behoerde: 'Behörde & Amt',
    doctor: 'Arzt & Apotheke',
    housing: 'Wohnung & Miete',
    shopping: 'Einkaufen',
    restaurant: 'Restaurant & Café',
    transport: 'Verkehr & Bahn',
    emergency: 'Notfall & Hilfe',
    work: 'Arbeit & Bewerbung',
    school: 'Schule & Kita',
    phone: 'Telefon',
    bank: 'Bank & Post',
  },
};

en.phrasebook = {
  title: 'Phrasebook',
  subtitle: 'Essential everyday phrases across 12 practical topics with audio',
  searchPlaceholder: 'Search phrase in any language...',
  allTopics: 'All topics',
  learningLang: 'Learning language',
  translationLang: 'Translation language',
  notFound: 'No phrases found matching your search.',
  topics: {
    greetings: 'Greetings',
    behoerde: 'Public Office',
    doctor: 'Doctor & Pharmacy',
    housing: 'Housing & Rent',
    shopping: 'Shopping',
    restaurant: 'Restaurant & Cafe',
    transport: 'Transport & Train',
    emergency: 'Emergency & Help',
    work: 'Work & Job Search',
    school: 'School & Daycare',
    phone: 'Phone Calls',
    bank: 'Bank & Post',
  },
};

// 5. letter
ru.letter = {
  title: 'Письмо из Behörde',
  subtitle: 'Быстрый разбор официальных писем: кто пишет, чего хотят, срок ответа и готовый шаблон',
  headerLink: 'Письмо из ведомства',
  inputTitle: 'Текст или фото письма',
  placeholder: 'Вставьте текст письма из Jobcenter, Finanzamt, Krankenkasse или сфотографируйте его...',
  photoBtn: 'С фото / скана',
  samplesTitle: 'Примеры для проверки',
  samples: {
    jobcenter: 'Приглашение в Jobcenter',
    mahnung: 'Напоминание об оплате (Mahnung)',
  },
  privacyNotice: 'Текст письма не сохраняется на сервере',
  analyzeBtn: 'Разобрать письмо',
  analyzing: 'Анализируем письмо...',
  analyzingSub: 'Ищем отправителя, срок, суть требований и готовим ответ',
  disclaimerTitle: 'Не является юридической консультацией',
  disclaimerText: 'Этот разбор подготовлен искусственным интеллектом для предварительного понимания. В важных юридических и финансовых вопросах консультируйтесь с квалифицированными специалистами или социальными службами.',
  sender: 'Отправитель',
  deadline: 'Срок ответа',
  noDeadline: 'Срок не указан / Информационное',
  summaryTitle: 'В чём суть',
  stepsTitle: 'Что нужно сделать',
  replyTemplateTitle: 'Шаблон ответа на немецком',
  emptyPrompt: 'Здесь появится разбор письма',
  emptyPromptSub: 'Вставьте текст или загрузите фото официального письма слева',
  ocrError: 'Не удалось распознать текст с фото. Попробуйте более чёткий снимок.',
  error: 'Не удалось проанализировать письмо. Попробуйте ещё раз.',
};

de.letter = {
  title: 'Behördenbrief-Assistent',
  subtitle: 'Schnelle Analyse von Behördenschreiben: Absender, Frist, Schritte und Antwortvorlage',
  headerLink: 'Behördenbrief',
  inputTitle: 'Text oder Foto des Schreibens',
  placeholder: 'Fügen Sie den Text des Behördenschreibens ein oder machen Sie ein Foto...',
  photoBtn: 'Foto / Scan',
  samplesTitle: 'Beispielschreiben',
  samples: {
    jobcenter: 'Einladung Jobcenter',
    mahnung: 'Mahnung / Zahlung',
  },
  privacyNotice: 'Brieftext wird nicht auf dem Server gespeichert',
  analyzeBtn: 'Brief analysieren',
  analyzing: 'Brief wird analysiert...',
  analyzingSub: 'Prüfe Absender, Frist, Anliegen und Antwortentwurf',
  disclaimerTitle: 'Keine Rechtsberatung',
  disclaimerText: 'Diese Auswertung wurde von KI erstellt. Bei wichtigen rechtlichen oder finanziellen Fragen wenden Sie sich an Beratungsstellen oder Rechtsbeistand.',
  sender: 'Absender',
  deadline: 'Frist',
  noDeadline: 'Keine Frist / Informationsschreiben',
  summaryTitle: 'Kernaussage',
  stepsTitle: 'Erforderliche Schritte',
  replyTemplateTitle: 'Antwortvorlage auf Deutsch',
  emptyPrompt: 'Hier erscheint die Analyse des Schreibens',
  emptyPromptSub: 'Fügen Sie links einen Text ein oder laden Sie ein Foto hoch',
  ocrError: 'Texterkennung fehlgeschlagen. Bitte ein schärferes Foto hochladen.',
  error: 'Analyse fehlgeschlagen. Bitte erneut versuchen.',
};

en.letter = {
  title: 'Official Letter Assistant',
  subtitle: 'Quick analysis of official German letters: sender, deadline, action steps, and reply template',
  headerLink: 'Official letter',
  inputTitle: 'Letter text or photo',
  placeholder: 'Paste the letter text from Jobcenter, Finanzamt, Krankenkasse, or take a photo...',
  photoBtn: 'From photo / scan',
  samplesTitle: 'Sample letters',
  samples: {
    jobcenter: 'Jobcenter invitation',
    mahnung: 'Payment reminder',
  },
  privacyNotice: 'Letter text is not stored on the server',
  analyzeBtn: 'Analyze letter',
  analyzing: 'Analyzing letter...',
  analyzingSub: 'Checking sender, deadline, requirements, and reply draft',
  disclaimerTitle: 'Not legal advice',
  disclaimerText: 'This analysis is AI-generated for general understanding. For critical legal or financial matters, please consult official advisory services or legal counsel.',
  sender: 'Sender',
  deadline: 'Deadline',
  noDeadline: 'No strict deadline / Informational',
  summaryTitle: 'Summary',
  stepsTitle: 'Action steps',
  replyTemplateTitle: 'German reply template',
  emptyPrompt: 'Letter analysis will appear here',
  emptyPromptSub: 'Paste the text or upload a photo on the left',
  ocrError: 'Failed to recognize text from photo. Please try a clearer image.',
  error: 'Failed to analyze letter. Please try again.',
};

// 6. conversation
ru.conversation = {
  partnerLabel: 'Собеседник',
  youLabel: 'Вы',
  rotateOpposite: 'Перевернуть на 180°',
  autoSpeak: 'Автоозвучка',
  speakPartner: 'Слушать собеседника',
  speakYou: 'Слушать вас',
  partnerHint: 'Нажмите микрофон вверху, чтобы собеседник начал говорить',
  youHint: 'Нажмите микрофон внизу, чтобы говорить на своём языке',
};

de.conversation = {
  partnerLabel: 'Gesprächspartner',
  youLabel: 'Sie',
  rotateOpposite: 'Um 180° drehen',
  autoSpeak: 'Automatisch vorlesen',
  speakPartner: 'Partner zuhören',
  speakYou: 'Ihnen zuhören',
  partnerHint: 'Tippen Sie oben auf das Mikrofon, damit der Partner spricht',
  youHint: 'Tippen Sie unten auf das Mikrofon, um in Ihrer Sprache zu sprechen',
};

en.conversation = {
  partnerLabel: 'Partner',
  youLabel: 'You',
  rotateOpposite: 'Rotate 180°',
  autoSpeak: 'Auto-speak',
  speakPartner: 'Listen to partner',
  speakYou: 'Listen to you',
  partnerHint: 'Tap the top microphone for your partner to speak',
  youHint: 'Tap the bottom microphone to speak in your language',
};

// Сохраняем обновленные файлы
writeFileSync(ruPath, JSON.stringify(ru, null, 2) + '\n', 'utf-8');
writeFileSync(dePath, JSON.stringify(de, null, 2) + '\n', 'utf-8');
writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf-8');

console.log('Локали успешно обновлены!');
