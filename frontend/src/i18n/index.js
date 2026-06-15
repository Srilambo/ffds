import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import si from './si.json';

const savedLang = localStorage.getItem('ffds_language') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
