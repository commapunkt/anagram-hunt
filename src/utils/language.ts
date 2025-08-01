import { NativeModules, Platform } from 'react-native';
import enTranslations from '../translations/en.json';
import deTranslations from '../translations/de.json';
import { Language } from '../types';

// Define supported languages
export const SUPPORTED_LANGUAGES = {
    en: 'English',
    de: 'Deutsch'
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Define translation structure type
type TranslationStructure = {
    game: {
        title: string;
        timeRemaining: string;
        score: string;
        streak: string;
        seedWord: string;
        inputPlaceholder: string;
        submit: string;
        foundWords: string;
        gameOver: string;
        finalScore: string;
        playAgain: string;
        invalidWord: string;
        alreadyFound: string;
        tooShort: string;
        notInSeed: string;
        correct: string;
        streakBonus: string;
        [key: string]: string;
    };
    settings: {
        title: string;
        language: string;
        sound: string;
        music: string;
        difficulty: string;
        [key: string]: string;
    };
    [key: string]: { [key: string]: string };
};

// Load translations
const translations: Record<LanguageCode, TranslationStructure> = {
    en: enTranslations,
    de: deTranslations
};

// Get device language
export const getDeviceLanguage = (): Language => {
    let locale: string;

    if (Platform.OS === 'web') {
        // On web, use the browser's language
        locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
    } else {
        // For native, you would typically use a library like `expo-localization`.
        // We'll default to 'en' as a fallback.
        // To implement: import * as Localization from 'expo-localization';
        // locale = Localization.getLocales()[0].languageCode;
        locale = 'en';
    }

    const lang = locale.split(/[-_]/)[0];
    return lang === 'de' ? 'de' : 'en';
};

// Translation function
export const t = (key: string, language: LanguageCode = 'en', params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let translation: any = translations[language];
    
    // Navigate through nested keys
    for (const k of keys) {
        translation = translation?.[k];
        if (!translation) break;
    }
    
    // If translation not found, fallback to English
    if (!translation) {
        translation = keys.reduce((obj: any, k: string) => obj?.[k], translations.en);
    }
    
    // If still not found, return the key
    if (!translation) return key;
    
    // Replace parameters in the translation
    if (params) {
        return Object.entries(params).reduce(
            (str, [key, value]) => str.replace(`{${key}}`, String(value)),
            translation
        );
    }
    
    return translation;
}; 