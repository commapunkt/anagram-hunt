import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getDeviceLanguage, t, SUPPORTED_LANGUAGES, LanguageCode } from './src/utils/language';
import level1Data from './src/data/en/level-1.json';

// Game configuration
const CURRENT_LEVEL = 1;
const GAME_TIME = 300; // 5 minutes

// Load level data with error handling
let levelData: LevelData;
try {
    levelData = level1Data;
    if (!levelData) {
        throw new Error('Level data is undefined');
    }
    if (!levelData.seed_word) {
        throw new Error('Seed word is missing from level data');
    }
    if (!levelData.words_list) {
        throw new Error('Words list is missing from level data');
    }
    console.log('Level data loaded successfully:', {
        seedWord: levelData.seed_word,
        wordsListLength: levelData.words_list.length
    });
} catch (error: any) {
    console.error('Error loading level data:', error);
    throw new Error(`Failed to load level data: ${error?.message || 'Unknown error'}`);
}

const SEED_WORD = levelData.seed_word.toUpperCase();

const SEED_LETTERS = SEED_WORD.split('');

// Convert words list to the required format
const VALID_WORDS = levelData.words_list.reduce((acc: { [key: string]: { length: number; estimatedUncommonness: string; combinedScore: number } }, word: WordData) => {
    acc[word.word] = {
        length: word.length,
        estimatedUncommonness: word.estimated_uncommonness,
        combinedScore: word.combined_score
    };
    return acc;
}, {});

export default function App() {
    const [input, setInput] = useState('');
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_TIME);
    const [gameOver, setGameOver] = useState(false);
    const [streak, setStreak] = useState(0);
    const [lastWordLength, setLastWordLength] = useState(0);
    const [language, setLanguage] = useState(getDeviceLanguage());
    const [letterFrequencies, setLetterFrequencies] = useState<{ [key: string]: number }>({});
    const [usedLetters, setUsedLetters] = useState<{ [key: string]: number }>({});
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Calculate letter frequencies in seed word
    useEffect(() => {
        const frequencies: { [key: string]: number } = {};
        SEED_LETTERS.forEach((letter: string) => {
            frequencies[letter] = (frequencies[letter] || 0) + 1;
        });
        setLetterFrequencies(frequencies);
        setUsedLetters(frequencies);
    }, []);

    // Update used letters when input changes
    useEffect(() => {
        const newUsedLetters = { ...letterFrequencies };
        input.split('').forEach(letter => {
            if (newUsedLetters[letter] > 0) {
                newUsedLetters[letter]--;
            }
        });
        setUsedLetters(newUsedLetters);
    }, [input, letterFrequencies]);

    // Timer effect
    useEffect(() => {
        if (timeLeft > 0 && !gameOver) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !gameOver) {
            setGameOver(true);
        }
    }, [timeLeft, gameOver]);

    const handleLetterPress = (letter: string) => {
        if (usedLetters[letter] > 0) {
            setInput(prev => prev + letter);
        }
    };

    const handleBackspace = () => {
        if (input.length > 0) {
            setInput(prev => prev.slice(0, -1));
        }
    };

    const handleInputChange = (text: string) => {
        // Only allow letters that are available in the seed word
        const newInput = text.toUpperCase().split('').filter(letter => {
            const availableCount = letterFrequencies[letter] || 0;
            const usedCount = text.split('').filter(l => l === letter).length;
            return usedCount <= availableCount;
        }).join('');
        
        setInput(newInput);
    };

    const handleSubmit = () => {
        const word = input.toUpperCase();
        if (word.length < 3) {
            setMessage({ text: t('game.tooShort', language), type: 'error' });
            return;
        }
        if (foundWords.includes(word)) {
            setMessage({ text: t('game.alreadyFound', language), type: 'error' });
            return;
        }
        if (!VALID_WORDS[word]) {
            setMessage({ text: t('game.invalidWord', language), type: 'error' });
            return;
        }

        // Calculate score
        const wordData = VALID_WORDS[word];
        let points = wordData.combinedScore;

        // Apply streak bonus
        if (streak > 0 && word.length === lastWordLength) {
            points *= 2;
            setMessage({ text: t('game.streakBonus', language, { points }), type: 'success' });
        } else {
            setMessage({ text: t('game.correct', language, { points }), type: 'success' });
        }

        setScore(prev => prev + points);
        setFoundWords(prev => [...prev, word]);
        setInput('');
        setStreak(prev => prev + 1);
        setLastWordLength(word.length);
        setUsedLetters(letterFrequencies);
    };

    const resetGame = () => {
        setInput('');
        setFoundWords([]);
        setScore(0);
        setTimeLeft(GAME_TIME);
        setGameOver(false);
        setStreak(0);
        setLastWordLength(0);
        setUsedLetters(letterFrequencies);
    };

    const handleLanguageSwitch = () => {
        const languages = Object.keys(SUPPORTED_LANGUAGES);
        const currentIndex = languages.indexOf(language);
        const nextIndex = (currentIndex + 1) % languages.length;
        setLanguage(languages[nextIndex] as LanguageCode);
    };

    const renderKeyboard = () => {
        const letters = Object.keys(letterFrequencies).sort();
        return (
            <View style={styles.keyboard}>
                {letters.map(letter => (
                    <TouchableOpacity
                        key={letter}
                        style={[
                            styles.key,
                            usedLetters[letter] === 0 && styles.keyDisabled
                        ]}
                        onPress={() => handleLetterPress(letter)}
                        disabled={usedLetters[letter] === 0}
                    >
                        <View style={styles.keyContent}>
                            <Text style={styles.keyText}>{letter}</Text>
                            {letterFrequencies[letter] > 1 && (
                                <View style={styles.frequencyBubble}>
                                    <Text style={styles.frequencyText}>
                                        {usedLetters[letter]}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={[styles.key, styles.backspaceKey]}
                    onPress={handleBackspace}
                >
                    <Text style={styles.keyText}>⌫</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('game.title', language)}</Text>
                <TouchableOpacity
                    style={styles.languageButton}
                    onPress={handleLanguageSwitch}
                >
                    <Text style={styles.languageButtonText}>
                        {language.toUpperCase()}
                    </Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.timeRemaining}>
                {t('game.timeRemaining', language, { time: timeLeft })}
            </Text>
            <Text style={styles.score}>
                {t('game.score', language, { score })}
            </Text>
            <Text style={styles.streak}>
                {t('game.streak', language, { streak })}
            </Text>
            <Text style={styles.seedWord}>
                {t('game.seedWord', language, { word: SEED_WORD })}
            </Text>

            <TextInput
                style={styles.input}
                value={input}
                onChangeText={handleInputChange}
                placeholder={t('game.inputPlaceholder', language)}
                placeholderTextColor="#666"
                autoCapitalize="characters"
                editable={!gameOver}
            />

            {message && (
                <View style={[
                    styles.messageContainer,
                    message.type === 'error' && styles.errorMessage,
                    message.type === 'success' && styles.successMessage
                ]}>
                    <Text style={styles.messageText}>{message.text}</Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={gameOver}
            >
                <Text style={styles.submitButtonText}>
                    {t('game.submit', language)}
                </Text>
            </TouchableOpacity>

            {renderKeyboard()}

            <ScrollView style={styles.foundWordsContainer}>
                <Text style={styles.foundWordsTitle}>
                    {t('game.foundWords', language)}
                </Text>
                {[...foundWords].reverse().map((word, index) => (
                    <Text key={index} style={styles.foundWord}>
                        {word} ({VALID_WORDS[word].combinedScore} points)
                    </Text>
                ))}
            </ScrollView>

            {gameOver && (
                <View style={styles.gameOverContainer}>
                    <Text style={styles.gameOverText}>
                        {t('game.gameOver', language)}
                    </Text>
                    <Text style={styles.finalScore}>
                        {t('game.finalScore', language, { score })}
                    </Text>
                    <TouchableOpacity
                        style={styles.playAgainButton}
                        onPress={resetGame}
                    >
                        <Text style={styles.playAgainButtonText}>
                            {t('game.playAgain', language)}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        color: '#FFFFFF',
    },
    languageButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        marginLeft: 10,
    },
    languageButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    timeRemaining: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    score: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    streak: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    seedWord: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 20,
        color: '#BDBDBD',
    },
    input: {
        borderWidth: 1,
        borderColor: '#424242',
        borderRadius: 5,
        padding: 10,
        fontSize: 18,
        marginBottom: 10,
        backgroundColor: '#2D2D2D',
        color: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 5,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    keyboard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
    },
    key: {
        width: 40,
        height: 48,
        margin: 4,
        backgroundColor: '#2D2D2D',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#424242',
    },
    keyContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    keyDisabled: {
        opacity: 0.5,
    },
    backspaceKey: {
        width: 60,
        backgroundColor: '#FF6B6B',
    },
    frequencyBubble: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: '#2196F3',
        borderWidth: 1,
        borderColor: '#1976D2',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frequencyText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    foundWordsContainer: {
        flex: 1,
        marginTop: 20,
    },
    foundWordsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    foundWord: {
        fontSize: 16,
        marginBottom: 5,
        color: '#BDBDBD',
    },
    gameOverContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameOverText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    finalScore: {
        fontSize: 24,
        color: '#fff',
        marginBottom: 20,
    },
    playAgainButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 5,
    },
    playAgainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    messageContainer: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: '#1976D2',
    },
    errorMessage: {
        backgroundColor: '#D32F2F',
    },
    successMessage: {
        backgroundColor: '#388E3C',
    },
    messageText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#FFFFFF',
    },
});
