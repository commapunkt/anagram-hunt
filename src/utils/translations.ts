import enTranslations from '../translations/en.json';
import deTranslations from '../translations/de.json';
import { Language } from '../types';

const translations = {
  en: enTranslations,
  de: deTranslations,
};

export const t = (key: string, language: Language, params?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return the key if translation not found
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters in the string
  if (params) {
    return Object.entries(params).reduce((str, [param, replacement]) => {
      return str.replace(new RegExp(`{${param}}`, 'g'), String(replacement));
    }, value);
  }

  return value;
}; 