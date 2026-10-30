/** Настройка i18next: русский по умолчанию, немецкий и английский рядом. */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isUiLanguage } from '../shared/languages';
import { STORAGE_KEYS } from './config';
import { readStorage } from './lib/storage';
import ru from './locales/ru.json';
import de from './locales/de.json';
import en from './locales/en.json';

const stored = readStorage<string>(STORAGE_KEYS.uiLanguage, 'ru');
const initialLanguage = isUiLanguage(stored) ? stored : 'ru';

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    de: { translation: de },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  returnNull: false,
});

document.documentElement.lang = initialLanguage;

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

export default i18n;
