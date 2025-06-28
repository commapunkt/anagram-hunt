const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');
const languages = ['en', 'de'];

const letterValues = {
    en: {
        'a': 1, 'b': 3, 'c': 3, 'd': 2, 'e': 1, 'f': 4, 'g': 2, 'h': 4, 'i': 1, 'j': 8, 'k': 5, 'l': 1, 'm': 3, 'n': 1, 'o': 1, 'p': 3, 'q': 10, 'r': 1, 's': 1, 't': 1, 'u': 1, 'v': 4, 'w': 4, 'x': 8, 'y': 4, 'z': 10
    },
    de: {
        'a': 1, 'b': 3, 'c': 4, 'd': 1, 'e': 1, 'f': 4, 'g': 2, 'h': 2, 'i': 1, 'j': 6, 'k': 4, 'l': 2, 'm': 3, 'n': 1, 'o': 2, 'p': 4, 'q': 10, 'r': 1, 's': 1, 't': 1, 'u': 1, 'v': 6, 'w': 3, 'x': 8, 'y': 10, 'z': 3, 'ä': 6, 'ö': 8, 'ü': 6, 'ß': 3
    }
};

function calculateUncommonness(word, lang) {
    return word.toLowerCase().split('').reduce((score, char) => {
        return score + (letterValues[lang][char] || 0);
    }, 0);
}

function processLevelFile(filePath, lang) {
    console.log(`Processing ${filePath}...`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const levelFileObject = JSON.parse(fileContent);

    if (!levelFileObject || !Array.isArray(levelFileObject.words_list)) {
        console.log(`Skipping invalid file format: ${filePath}`);
        return;
    }

    const words = levelFileObject.words_list;

    if (words.length === 0) {
        console.log(`Skipping empty word list in: ${filePath}`);
        return;
    }

    const wordsWithScores = words.map(item => ({
        word: item.word,
        uncommonness: calculateUncommonness(item.word, lang),
        length: item.word.length
    }));

    const minLength = Math.min(...wordsWithScores.map(w => w.length));
    const maxLength = Math.max(...wordsWithScores.map(w => w.length));
    const minUncommonness = Math.min(...wordsWithScores.map(w => w.uncommonness));
    const maxUncommonness = Math.max(...wordsWithScores.map(w => w.uncommonness));

    const lengthRange = maxLength - minLength;
    const uncommonnessRange = maxUncommonness - minUncommonness;

    const updatedWordsList = wordsWithScores.map(item => {
        const normalizedLength = lengthRange > 0 ? (item.length - minLength) / lengthRange : 1;
        const normalizedUncommonness = uncommonnessRange > 0 ? (item.uncommonness - minUncommonness) / uncommonnessRange : 1;

        const combinedNormalizedScore = (normalizedLength + normalizedUncommonness) / 2;
        const combined_score = Math.round(10 + combinedNormalizedScore * 990);

        const estimated_uncommonness = Math.round(1 + normalizedUncommonness * 4);

        const finalWord = lang === 'en'
            ? item.word.charAt(0).toUpperCase() + item.word.slice(1)
            : item.word;

        return {
            word: finalWord,
            estimated_uncommonness: estimated_uncommonness,
            combined_score: combined_score
        };
    });

    const updatedFileObject = {
        ...levelFileObject,
        words_list: updatedWordsList
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedFileObject, null, 2));
    console.log(`✅ Updated ${filePath}`);
}

languages.forEach(lang => {
    const langDir = path.join(dataDir, lang);
    fs.readdirSync(langDir).forEach(file => {
        if (file.endsWith('.json') && file !== '_level-mapping.json') {
            processLevelFile(path.join(langDir, file), lang);
        }
    });
});

console.log('\nAll level files have been updated!'); 