import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      it: { translation: it },
      nl: { translation: nl },
      ar: { translation: ar },
      zh: { translation: zh },
      ja: { translation: ja },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'fv_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
export const SUPPORTED_LANGUAGES = ['en','es','fr','de','pt','it','nl','ar','zh','ja'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch',
  pt: 'Português', it: 'Italiano', nl: 'Nederlands', ar: 'العربية',
  zh: '中文', ja: '日本語',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪',
  pt: '🇧🇷', it: '🇮🇹', nl: '🇳🇱', ar: '🇸🇦',
  zh: '🇨🇳', ja: '🇯🇵',
};

export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];
export const CJK_LANGUAGES: SupportedLanguage[] = ['zh', 'ja'];
export const SPRINT_2_LANGUAGES: SupportedLanguage[] = ['it','nl','ar','zh','ja'];
