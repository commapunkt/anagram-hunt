#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const englishWords = require('an-array-of-english-words');

// Try to use external dictionary library, fallback to local file
let dictionary = [];

async function loadDictionary() {
    try {
        // Try to use 'an-array-of-english-words' library
        dictionary = englishWords.filter(word => word.length >= 3);
        console.log(`Loaded ${dictionary.length} words from 'an-array-of-english-words' library`);
        return true;
    } catch (error) {
        console.log('External dictionary library not found, trying local file...');
        
        // Fallback to local dictionary file
        const DICTIONARY_PATH = path.join(__dirname, '../data/dictionary.txt');
        
        if (!fs.existsSync(DICTIONARY_PATH)) {
            console.error('No dictionary found! Please install a dictionary library or provide a dictionary.txt file.');
            console.log('\nTo install a dictionary library, run:');
            console.log('npm install an-array-of-english-words');
            console.log('\nOr download a dictionary file and save it as data/dictionary.txt');
            console.log('You can download from: https://github.com/dwyl/english-words');
            return false;
        }
        
        // Read local dictionary
        const dictionaryText = fs.readFileSync(DICTIONARY_PATH, 'utf8');
        dictionary = dictionaryText
            .split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length >= 3 && /^[a-z]+$/.test(word));
        
        console.log(`Loaded ${dictionary.length} words from local dictionary file`);
        return true;
    }
}

// Function to check if a word can be made from the given letters
function canMakeWord(word, letterCounts) {
    const wordLetters = word.toLowerCase().split('');
    const availableLetters = { ...letterCounts };
    
    for (const letter of wordLetters) {
        if (!availableLetters[letter] || availableLetters[letter] <= 0) {
            return false;
        }
        availableLetters[letter]--;
    }
    
    return true;
}

// Function to calculate word score based on length and commonness
function calculateWordScore(word) {
    const length = word.length;
    let score = length * 10; // Base score
    
    // Bonus for longer words
    if (length >= 6) score += 50;
    if (length >= 8) score += 100;
    if (length >= 10) score += 200;
    
    // Penalty for very common short words
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    if (commonWords.includes(word.toLowerCase())) {
        score = Math.max(10, score - 20);
    }
    
    return score;
}

// Function to estimate word uncommonness
function estimateUncommonness(word, score) {
    if (score >= 200) return 'Very Uncommon';
    if (score >= 150) return 'Uncommon';
    if (score >= 100) return 'Common';
    return 'Very Common';
}

// Main function to find words
async function findWords(seedWord, letterCounts, minLength = 3) {
    try {
        // Load dictionary
        const dictionaryLoaded = await loadDictionary();
        if (!dictionaryLoaded) {
            return;
        }
        
        // Find valid words
        const validWords = [];
        for (const word of dictionary) {
            if (canMakeWord(word, letterCounts) && word.toLowerCase() !== seedWord.toLowerCase()) {
                const score = calculateWordScore(word);
                validWords.push({
                    word: word.toUpperCase(),
                    length: word.length,
                    estimated_uncommonness: estimateUncommonness(word, score),
                    combined_score: score
                });
            }
        }
        
        // Sort by score (highest first)
        validWords.sort((a, b) => b.combined_score - a.combined_score);
        
        console.log(`\nFound ${validWords.length} valid words:`);
        console.log('\nTop 20 words by score:');
        validWords.slice(0, 20).forEach((word, index) => {
            console.log(`${index + 1}. ${word.word} (${word.length} letters, ${word.estimated_uncommonness}, ${word.combined_score} points)`);
        });
        
        // Generate JSON output
        const output = {
            seed_word: seedWord.toUpperCase(),
            words_list: validWords
        };
        
        // Save to file with seed word as filename
        const filename = `${seedWord.toLowerCase()}.json`;
        const outputPath = path.join(__dirname, '../src/data/en', filename);
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\nFull word list saved to: ${outputPath}`);
        
        return validWords;
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// CLI interface
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node find-words.js <seed_word> [letter_counts]');
        console.log('\nExamples:');
        console.log('node find-words.js "understanding"');
        console.log('node find-words.js "understanding" "u:1,n:2,d:2,e:1,r:1,s:1,t:1,a:1,i:1,g:1"');
        console.log('node find-words.js "computer" "c:1,o:1,m:1,p:1,u:1,t:1,e:1,r:1"');
        console.log('node find-words.js "hello" "h:1,e:1,l:2,o:1"');
        console.log('\nNote: If only seed word is provided, letter counts will be automatically calculated.');
        console.log('Note: Install dictionary library with: npm install an-array-of-english-words');
        return;
    }
    
    const seedWord = args[0].toLowerCase();
    let letterCounts = {};
    
    if (args.length === 1) {
        // Automatically count letters from seed word
        for (const letter of seedWord) {
            if (/[a-z]/.test(letter)) {
                letterCounts[letter] = (letterCounts[letter] || 0) + 1;
            }
        }
        console.log('Automatically counted letters from seed word');
    } else {
        // Parse provided letter counts
        const letterCountsInput = args[1].toLowerCase();
        const pairs = letterCountsInput.split(',');
        for (const pair of pairs) {
            const [letter, count] = pair.split(':');
            if (letter && count) {
                letterCounts[letter] = parseInt(count);
            }
        }
    }
    
    console.log('Seed word:', seedWord.toUpperCase());
    console.log('Letter counts:', letterCounts);
    
    findWords(seedWord, letterCounts);
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { findWords, canMakeWord, calculateWordScore }; 