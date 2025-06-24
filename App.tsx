import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getDeviceLanguage, t, SUPPORTED_LANGUAGES, LanguageCode } from './src/utils/language';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Game configuration
const GAME_TIME = 300; // 5 minutes

// Types for level data
interface LevelMapping {
    [key: string]: string;
}

interface WordData {
    word: string;
    estimated_uncommonness: number;
    combined_score: number;
    length: number;
}

interface LevelData {
    seed_word: string;
    words_list: WordData[];
}

// Static imports for level mappings
import enLevelMapping from './public/data/en/_level-mapping.json';
import deLevelMapping from './public/data/de/_level-mapping.json';

// Level mapping lookup
const getLevelMapping = (language: LanguageCode): LevelMapping => {
    switch (language) {
        case 'de':
            return deLevelMapping;
        case 'en':
        default:
            return enLevelMapping;
    }
};

// Type assertion function to normalize data
const normalizeLevelData = (data: any): LevelData => {
    return {
        seed_word: data.seed_word,
        words_list: data.words_list.map((word: any) => ({
            word: word.word,
            estimated_uncommonness: typeof word.estimated_uncommonness === 'string' 
                ? (parseInt(word.estimated_uncommonness) || 1)
                : (word.estimated_uncommonness || 1),
            combined_score: word.combined_score || word.combined_ROE || 0,
            length: word.length || word.word.length
        }))
    };
};

// Dynamic file reading function
const readLevelFile = async (language: LanguageCode, filename: string): Promise<LevelData> => {
    try {
        if (Platform.OS === 'web') {
            // For web, use fetch to load the JSON file from the public directory
            const response = await fetch(`/data/${language}/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
            }
            const data = await response.json();
            return normalizeLevelData(data);
        } else {
            // On native platforms, use FileSystem
            const fileUri = `${FileSystem.documentDirectory}src/data/${language}/${filename}`;
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            const data = JSON.parse(fileContent);
            return normalizeLevelData(data);
        }
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        throw new Error(`Failed to read level file ${filename}: ${error}`);
    }
};

// Load level data
const loadLevelData = async (levelNumber: number, language: LanguageCode): Promise<LevelData> => {
    try {
        const mapping = getLevelMapping(language);
        const fileName = mapping[levelNumber.toString()];
        
        if (!fileName) {
            throw new Error(`No level ${levelNumber} found in mapping`);
        }
        
        return await readLevelFile(language, fileName);
    } catch (error) {
        console.error('Error loading level data:', error);
        throw new Error(`Failed to load level ${levelNumber}: ${error}`);
    }
};

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
    
    // Level management
    const [currentLevel, setCurrentLevel] = useState(1);
    const [levelData, setLevelData] = useState<LevelData | null>(null);
    const [validWords, setValidWords] = useState<{ [key: string]: { length: number; estimatedUncommonness: number; combinedScore: number } }>({});
    const [seedWord, setSeedWord] = useState('');
    const [seedLetters, setSeedLetters] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Load level data
    useEffect(() => {
        const loadCurrentLevel = async () => {
            try {
                setLoading(true);
                const data = await loadLevelData(currentLevel, language);
                setLevelData(data);
                setSeedWord(data.seed_word.toUpperCase());
                setSeedLetters(data.seed_word.toUpperCase().split(''));
                
                // Convert words list to the required format
                const wordsMap = data.words_list.reduce((acc: { [key: string]: { length: number; estimatedUncommonness: number; combinedScore: number } }, word: WordData) => {
                    acc[word.word] = {
                        length: word.length,
                        estimatedUncommonness: word.estimated_uncommonness,
                        combinedScore: word.combined_score
                    };
                    return acc;
                }, {});
                setValidWords(wordsMap);
                
                console.log(`Level ${currentLevel} loaded successfully:`, {
                    seedWord: data.seed_word,
                    wordsListLength: data.words_list.length
                });
            } catch (error) {
                console.error('Error loading level:', error);
                setMessage({ text: `Failed to load level ${currentLevel}`, type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        
        loadCurrentLevel();
    }, [currentLevel, language]);

    // Calculate letter frequencies in seed word
    useEffect(() => {
        if (seedLetters.length > 0) {
            const frequencies: { [key: string]: number } = {};
            seedLetters.forEach((letter: string) => {
                frequencies[letter] = (frequencies[letter] || 0) + 1;
            });
            setLetterFrequencies(frequencies);
            setUsedLetters(frequencies);
        }
    }, [seedLetters]);

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
        if (timeLeft > 0 && !gameOver && !loading) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !gameOver) {
            setGameOver(true);
        }
    }, [timeLeft, gameOver, loading]);

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
        if (!validWords[word]) {
            setMessage({ text: t('game.invalidWord', language), type: 'error' });
            return;
        }

        // Calculate score
        const wordData = validWords[word];
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

    const nextLevel = async () => {
        try {
            const mapping = getLevelMapping(language);
            const nextLevelNumber = currentLevel + 1;
            
            if (mapping[nextLevelNumber.toString()]) {
                setCurrentLevel(nextLevelNumber);
                resetGame();
            } else {
                // No more levels, show completion message
                setMessage({ text: t('game.allLevelsComplete', language), type: 'success' });
            }
        } catch (error) {
            console.error('Error loading next level:', error);
            setMessage({ text: 'Failed to load next level', type: 'error' });
        }
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
        setMessage(null);
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
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>
                        {t('game.loading', language)}
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('game.title', language)}</Text>
                        <View style={styles.headerRight}>
                            <Text style={styles.levelText}>
                                {t('game.level', language, { level: currentLevel })}
                            </Text>
                            <TouchableOpacity
                                style={styles.languageButton}
                                onPress={handleLanguageSwitch}
                            >
                                <Text style={styles.languageButtonText}>
                                    {language.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
                        {t('game.seedWord', language, { word: seedWord })}
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
                                {word} ({validWords[word].combinedScore} points)
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
                            <View style={styles.gameOverButtons}>
                                <TouchableOpacity
                                    style={styles.playAgainButton}
                                    onPress={resetGame}
                                >
                                    <Text style={styles.playAgainButtonText}>
                                        {t('game.playAgain', language)}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.nextLevelButton}
                                    onPress={nextLevel}
                                >
                                    <Text style={styles.nextLevelButtonText}>
                                        {t('game.nextLevel', language)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </>
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelText: {
        fontSize: 18,
        marginRight: 10,
        color: '#E0E0E0',
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
    nextLevelButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 5,
        marginLeft: 10,
    },
    nextLevelButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    gameOverButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
