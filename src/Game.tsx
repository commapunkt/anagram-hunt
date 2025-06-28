import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, ActivityIndicator, Modal, TouchableOpacity, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Language, LevelFile, LevelMapping, Word } from './types';
import { getDeviceLanguage } from './utils/language';
import CustomKeyboard from './components/CustomKeyboard';
import StreakIcon from './components/StreakIcon';
import StraightIcon from './components/StraightIcon';
import BonusInfoModal from './components/BonusInfoModal';
import AnimatedFoundWordRow from './components/AnimatedFoundWordRow';
import { t } from './utils/translations';

const shuffleArray = (array: string[]) => {
  return array.sort(() => Math.random() - 0.5);
};

const getCharMap = (str: string): Map<string, number> => {
  const map = new Map<string, number>();
  for (const char of str.toLowerCase()) {
    map.set(char, (map.get(char) || 0) + 1);
  }
  return map;
};

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

interface FoundWordInfo {
  word: string;
  score: number;
  bonus: {
    type: 'streak' | 'straight' | null;
    amount: number;
    count: number;
  };
}

const BONUS_RULES = {
  streak: {
    title: "streakTitle",
    description: "streakDescription"
  },
  straight: {
    title: "straightTitle", 
    description: "straightDescription"
  }
};

interface GameProps {
  language: Language;
}

export default function Game({ language }: GameProps) {
  const [levelWords, setLevelWords] = useState<Word[] | null>(null);
  const [seedWord, setSeedWord] = useState('');
  const [wordMap, setWordMap] = useState<Map<string, Word>>(new Map());
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [seedLetterMap, setSeedLetterMap] = useState<Map<string, number>>(new Map());
  
  const [currentInput, setCurrentInput] = useState('');
  const [foundWords, setFoundWords] = useState<FoundWordInfo[]>([]);
  const [score, setScore] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300);

  const [lastWordLength, setLastWordLength] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [straightCount, setStraightCount] = useState(0);

  const [bonusInfo, setBonusInfo] = useState<{ title: string; description: string } | null>(null);
  const [isInvalidWord, setIsInvalidWord] = useState(false);

  const loadData = useCallback(async (level: number, lang: Language) => {
    try {
      setIsLoading(true);

      const basePath = Platform.OS === 'web' ? 'data' : 'asset:/data';
      const mappingUrl = `${basePath}/${lang}/_level-mapping.json`;
      const mappingResponse = await fetch(mappingUrl);

      if (!mappingResponse.ok) throw new Error(`Failed to fetch level mapping`);
      const levelMapping: LevelMapping = await mappingResponse.json();
      
      const levelFile = levelMapping[level.toString()]; 
      if (!levelFile) {
        alert(t('game.allLevelsComplete', language));
        setIsGameOver(true);
        setIsLoading(false);
        return;
      }

      const levelUrl = `${basePath}/${lang}/${levelFile}`;
      const levelResponse = await fetch(levelUrl);
      if (!levelResponse.ok) throw new Error(`Failed to fetch level data`);

      const data: LevelFile = await levelResponse.json();
      if (!data || !Array.isArray(data.words_list)) throw new TypeError(`Level data is not in the correct format.`);

      const words = data.words_list;
      const seed = data.seed_word;
      const seedLower = seed.toLowerCase();
      
      setLevelWords(words);
      setSeedWord(seed);
      setWordMap(new Map(words.map((w: Word) => [w.word.toLowerCase(), w])));
      
      const newSeedMap = getCharMap(seedLower);
      setSeedLetterMap(newSeedMap);
      setScrambledLetters(shuffleArray(Array.from(newSeedMap.keys())));

      // Reset game state for the new level
      setScore(0);
      setFoundWords([]);
      setTimeLeft(300);
      setIsGameOver(false);
      setLastWordLength(0);
      setStreakCount(0);
      setStraightCount(0);
      setIsInvalidWord(false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadData(currentLevel, language);
  }, [currentLevel, language, loadData]);

  useEffect(() => {
    if (isGameOver || isLoading) return;

    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }

    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isGameOver, isLoading]);

  // Physical keyboard support
  useEffect(() => {
    if (Platform.OS !== 'web' || isGameOver || isLoading) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for game keys
      if (event.key === 'Enter' || event.key === 'Backspace' || 
          (event.key.length === 1 && /[a-zA-Z]/.test(event.key))) {
        event.preventDefault();
      }

      if (event.key === 'Enter') {
        handleSubmit();
      } else if (event.key === 'Backspace') {
        setCurrentInput(prev => prev.slice(0, -1));
      } else if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
        const letter = event.key.toLowerCase();
        handleKeyPress(letter);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isLoading, currentInput, foundWords, wordMap, lastWordLength, streakCount, straightCount]);

  const handleBonusInfoPress = (bonusType: 'streak' | 'straight') => {
    const rule = BONUS_RULES[bonusType];
    setBonusInfo({
      title: t(`bonus.${rule.title}`, language),
      description: t(`bonus.${rule.description}`, language)
    });
  };

  const handleKeyPress = (letter: string) => {
    const usedCounts = getCharMap(currentInput);
    const availableCount = seedLetterMap.get(letter) || 0;
    const usedCount = usedCounts.get(letter) || 0;

    if (usedCount < availableCount) {
      setCurrentInput(prev => prev + letter);
    }
  };

  const remainingLetterCounts = useMemo(() => {
    const usedCounts = getCharMap(currentInput);
    const remaining = new Map<string, number>();
    for (const [letter, count] of seedLetterMap.entries()) {
      remaining.set(letter, count - (usedCounts.get(letter) || 0));
    }
    return remaining;
  }, [currentInput, seedLetterMap]);

  const handleSubmit = () => {
    if (isGameOver) return;

    const lowerInput = currentInput.toLowerCase();
    if (foundWords.some(fw => fw.word === lowerInput)) {
      // Word already found - show invalid state
      setIsInvalidWord(true);
      setTimeout(() => setIsInvalidWord(false), 5000);
    } else if (wordMap.has(lowerInput)) {
      const wordData = wordMap.get(lowerInput)!;
      const newWordLength = wordData.word.length;
      
      let bonusScore = 0;
      let currentStreak = streakCount;
      let currentStraight = straightCount;
      let bonusInfo: FoundWordInfo['bonus'] | null = null;

      if (lastWordLength > 0 && newWordLength === lastWordLength) { // Streak
        currentStreak++;
        currentStraight = 1;
        if (currentStreak >= 2) {
            const streakBonus = (currentStreak - 1) * 50;
            bonusScore += streakBonus;
            bonusInfo = { type: 'streak', amount: streakBonus, count: currentStreak };
        }
      } else if (lastWordLength > 0 && newWordLength === lastWordLength + 1) { // Straight
        currentStraight++;
        currentStreak = 1;
        if (currentStraight >= 2) {
            const straightBonus = (currentStraight - 1) * 100;
            bonusScore += straightBonus;
            bonusInfo = { type: 'straight', amount: straightBonus, count: currentStraight };
        }
      } else {
        currentStreak = 1;
        currentStraight = 1;
      }
      
      setStreakCount(currentStreak);
      setStraightCount(currentStraight);
      setLastWordLength(newWordLength);
      
      const totalPoints = wordData.combined_score + bonusScore;
      setScore(prev => prev + totalPoints);

      const newFoundWord: FoundWordInfo = {
        word: lowerInput,
        score: wordData.combined_score,
        bonus: bonusInfo || { type: null, amount: 0, count: 0 }
      };
      setFoundWords(prev => [newFoundWord, ...prev]);
      
    } else {
      // Invalid word - show invalid state
      setIsInvalidWord(true);
      setTimeout(() => setIsInvalidWord(false), 5000);
      setStreakCount(0);
      setStraightCount(0);
    }
    setCurrentInput('');
  };

  const handleNextLevel = () => {
      setCurrentLevel(prev => prev + 1);
  };

  if (isLoading && !isGameOver) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>{t('game.loading', language)} Level {currentLevel}...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <BonusInfoModal
        isVisible={!!bonusInfo}
        onClose={() => setBonusInfo(null)}
        title={bonusInfo?.title || ''}
        description={bonusInfo?.description || ''}
      />

      <Modal
        visible={isGameOver}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {timeLeft <= 0 ? t('game.timesUp', language) : t('game.levelComplete', language)}
            </Text>
            <Text style={styles.modalScore}>{t('game.finalScore', language, { score })}</Text>
            <TouchableOpacity style={styles.nextLevelButton} onPress={handleNextLevel}>
              <Text style={styles.nextLevelButtonText}>{t('game.nextLevel', language)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.score}>{t('game.score', language, { score })}</Text>
        <Text style={styles.foundCount}>
          {t('game.foundCount', language, { found: foundWords.length, total: levelWords?.length || 0 })}
        </Text>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.seedWordText}>{seedWord.toUpperCase()}</Text>
        <Text style={styles.instructionText}>
          {t('game.instruction', language, { word: seedWord.toUpperCase() })}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>{currentInput.toUpperCase()}</Text>
        </View>

        <CustomKeyboard
          scrambledLetters={scrambledLetters}
          initialCounts={seedLetterMap}
          remainingCounts={remainingLetterCounts}
          onKeyPress={handleKeyPress}
          onDelete={() => setCurrentInput(prev => prev.slice(0, -1))}
          onSubmit={handleSubmit}
          language={language}
          isInvalidWord={isInvalidWord}
        />
      </View>

      <View style={styles.foundWordsContainer}>
          <Text style={styles.foundWordsTitle}>{t('game.foundWords', language)}</Text>
          <FlatList
            data={foundWords}
            keyExtractor={(item) => item.word}
            renderItem={({ item, index }) => (
              <AnimatedFoundWordRow 
                item={item} 
                index={index} 
                onBonusInfoPress={handleBonusInfoPress} 
              />
            )}
            style={styles.foundWordsList}
          />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 18,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  seedWordText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 5,
  },
  instructionText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  timerText: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  score: {
    color: '#fff',
    fontSize: 20,
  },
  foundCount: {
    color: '#aaa',
    fontSize: 20,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  inputContainer: {
    backgroundColor: '#333',
    minHeight: 60,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 15,
  },
  inputText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  foundWordsContainer: {
    height: '35%',
    width: '90%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  foundWordsTitle: {
      color: '#fff',
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 10,
      fontWeight: 'bold'
  },
  foundWordsList: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  modalScore: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 20,
  },
  nextLevelButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  nextLevelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
}); 