import { NativeModules, Platform } from 'react-native';
import enTranslations from '../translations/en.json';
import deTranslations from '../translations/de.json';

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
export const getDeviceLanguage = (): LanguageCode => {
    let deviceLanguage: string;
    
    try {
        if (Platform.OS === 'web') {
            // Web environment - use navigator.language
            deviceLanguage = typeof navigator !== 'undefined' && navigator.language 
                ? navigator.language 
                : 'en-US';
        } else if (Platform.OS === 'ios') {
            deviceLanguage = 
                NativeModules.SettingsManager?.settings?.AppleLocale ||
                NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                'en-US';
        } else if (Platform.OS === 'android') {
            deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'en-US';
        } else {
            // Fallback for other platforms
            deviceLanguage = 'en-US';
        }
    } catch (error) {
        console.warn('Error detecting device language:', error);
        deviceLanguage = 'en-US';
    }

    deviceLanguage = deviceLanguage || 'en-US';

    // Extract language code (e.g., 'en-US' -> 'en')
    const languageCode = deviceLanguage.split('-')[0].toLowerCase();
    
    // Return the language code if supported, otherwise default to English
    return Object.keys(SUPPORTED_LANGUAGES).includes(languageCode) 
        ? languageCode as LanguageCode 
        : 'en';
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