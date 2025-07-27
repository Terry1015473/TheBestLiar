import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // loads translations from your public folder
  .use(LanguageDetector) // detects user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: 'en', // use en if detected language is not available
    debug: false, // set to true for debugging in development
    interpolation: {
      escapeValue: false, // react already escapes by default
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['navigator'], // Try to detect the user's language from the browser
    }
  });

export default i18n;