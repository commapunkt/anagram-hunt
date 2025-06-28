import englishWords from 'an-array-of-english-words';
import germanWords from 'all-the-german-words';

const letterValues = {
    en: { 'a': 1, 'b': 3, 'c': 3, 'd': 2, 'e': 1, 'f': 4, 'g': 2, 'h': 4, 'i': 1, 'j': 8, 'k': 5, 'l': 1, 'm': 3, 'n': 1, 'o': 1, 'p': 3, 'q': 10, 'r': 1, 's': 1, 't': 1, 'u': 1, 'v': 4, 'w': 4, 'x': 8, 'y': 4, 'z': 10 },
    de: { 'a': 1, 'b': 3, 'c': 4, 'd': 1, 'e': 1, 'f': 4, 'g': 2, 'h': 2, 'i': 1, 'j': 6, 'k': 4, 'l': 2, 'm': 3, 'n': 1, 'o': 2, 'p': 4, 'q': 10, 'r': 1, 's': 1, 't': 1, 'u': 1, 'v': 6, 'w': 3, 'x': 8, 'y': 10, 'z': 3, 'ä': 6, 'ö': 8, 'ü': 6, 'ß': 3 }
};

const calculateUncommonness = (word: string, lang: 'en' | 'de'): number => {
    return word.toLowerCase().split('').reduce((score, char) => {
        return score + (letterValues[lang][char as keyof typeof letterValues['en']] || 0);
    }, 0);
};

const getCharMap = (word: string): { [key: string]: number } => {
    const charMap: { [key: string]: number } = {};
    for (const char of word.toLowerCase()) {
        charMap[char] = (charMap[char] || 0) + 1;
    }
    return charMap;
};

export interface WordResult {
    word: string;
    estimated_uncommonness: number;
    combined_score: number;
}

export const findAndScoreWords = (seedWord: string, language: 'en' | 'de'): WordResult[] => {
    if (!seedWord) return [];

    const dictionary = language === 'de' ? germanWords : englishWords;
    const seedCharMap = getCharMap(seedWord);
    const lowerCaseSeedWord = seedWord.toLowerCase();
    
    const foundWords: string[] = [];

    for (const word of dictionary) {
        if (word.length < 3 || word.length > seedWord.length || word === lowerCaseSeedWord) {
            continue;
        }

        const wordCharMap = getCharMap(word);
        let canBeFormed = true;
        for (const char in wordCharMap) {
            if (!seedCharMap[char] || wordCharMap[char] > seedCharMap[char]) {
                canBeFormed = false;
                break;
            }
        }
        if (canBeFormed) {
            foundWords.push(word);
        }
    }
    
    if (foundWords.length === 0) {
        return [];
    }

    const wordsWithScores = foundWords.map(word => ({
        word: word,
        uncommonness: calculateUncommonness(word, language),
        length: word.length
    }));

    const minLength = Math.min(...wordsWithScores.map(w => w.length));
    const maxLength = Math.max(...wordsWithScores.map(w => w.length));
    const minUncommonness = Math.min(...wordsWithScores.map(w => w.uncommonness));
    const maxUncommonness = Math.max(...wordsWithScores.map(w => w.uncommonness));

    const lengthRange = maxLength - minLength;
    const uncommonnessRange = maxUncommonness - minUncommonness;
    
    const finalResults = wordsWithScores.map(item => {
        const normalizedLength = lengthRange > 0 ? (item.length - minLength) / lengthRange : 1;
        const normalizedUncommonness = uncommonnessRange > 0 ? (item.uncommonness - minUncommonness) / uncommonnessRange : 1;
        
        const combinedNormalizedScore = (normalizedLength + normalizedUncommonness) / 2;
        const combined_score = Math.round(10 + combinedNormalizedScore * 990);

        const estimated_uncommonness = Math.round(1 + normalizedUncommonness * 4);

        const finalWord = language === 'en'
            ? item.word.charAt(0).toUpperCase() + item.word.slice(1)
            : item.word;

        return {
            word: finalWord,
            estimated_uncommonness: estimated_uncommonness,
            combined_score: combined_score
        };
    });

    return finalResults.sort((a, b) => b.combined_score - a.combined_score);
}; 