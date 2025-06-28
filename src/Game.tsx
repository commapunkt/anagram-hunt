import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, ActivityIndicator, Modal, TouchableOpacity, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Language, LevelFile, LevelMapping, Word } from './types';
import { getDeviceLanguage } from './utils/language';
import CustomKeyboard from './components/CustomKeyboard';
import StreakIcon from './components/StreakIcon';
import StraightIcon from './components/StraightIcon';
import BonusInfoModal from './components/BonusInfoModal';

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
    title: "Streak Bonus",
    description: "Get a 50pt bonus for each word of the same length found in a row. The bonus is multiplied by the streak length (e.g., a 3-word streak gives a 100pt bonus)."
  },
  straight: {
    title: "Straight Bonus",
    description: "Get a 100pt bonus for finding words of sequentially increasing length. The bonus is multiplied by the straight length (e.g., a 3-word straight gives a 200pt bonus)."
  }
};

export default function Game() {
  const [language, setLanguage] = useState<Language>('en');
  const [levelWords, setLevelWords] = useState<Word[] | null>(null);
  const [seedWord, setSeedWord] = useState('');
  const [wordMap, setWordMap] = useState<Map<string, Word>>(new Map());
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [seedLetterMap, setSeedLetterMap] = useState<Map<string, number>>(new Map());
  
  const [currentInput, setCurrentInput] = useState('');
  const [foundWords, setFoundWords] = useState<FoundWordInfo[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300);

  const [lastWordLength, setLastWordLength] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [straightCount, setStraightCount] = useState(0);

  const [bonusInfo, setBonusInfo] = useState<{ title: string; description: string } | null>(null);

  const loadData = useCallback(async (level: number) => {
    try {
      setIsLoading(true);
      const lang = getDeviceLanguage();
      setLanguage(lang);

      const basePath = Platform.OS === 'web' ? 'data' : 'asset:/data';
      const mappingUrl = `${basePath}/${lang}/_level-mapping.json`;
      const mappingResponse = await fetch(mappingUrl);

      if (!mappingResponse.ok) throw new Error(`Failed to fetch level mapping`);
      const levelMapping: LevelMapping = await mappingResponse.json();
      
      const levelFile = levelMapping[level.toString()]; 
      if (!levelFile) {
        setMessage("You've completed all levels!");
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
      
      setLevelWords(words);
      setSeedWord(seed);
      setWordMap(new Map(words.map((w: Word) => [w.word.toLowerCase(), w])));
      
      const newSeedMap = getCharMap(seed.toLowerCase());
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentLevel);
  }, [currentLevel, loadData]);

  useEffect(() => {
    if (isGameOver || isLoading) return;

    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }

    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isGameOver, isLoading]);

  const clearMessage = () => setTimeout(() => setMessage(''), 2000);

  const handleBonusInfoPress = (bonusType: 'streak' | 'straight') => {
    setBonusInfo(BONUS_RULES[bonusType]);
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
      setMessage('Already found!');
    } else if (wordMap.has(lowerInput)) {
      const wordData = wordMap.get(lowerInput)!;
      const newWordLength = wordData.word.length;
      
      let bonusScore = 0;
      let bonusMessage = '';
      let currentStreak = streakCount;
      let currentStraight = straightCount;
      let bonusInfo: FoundWordInfo['bonus'] | null = null;

      if (lastWordLength > 0 && newWordLength === lastWordLength) { // Streak
        currentStreak++;
        currentStraight = 1;
        if (currentStreak >= 2) {
            const streakBonus = (currentStreak - 1) * 50;
            bonusScore += streakBonus;
            bonusMessage = `Streak x${currentStreak}! +${streakBonus}`;
            bonusInfo = { type: 'streak', amount: streakBonus, count: currentStreak };
        }
      } else if (lastWordLength > 0 && newWordLength === lastWordLength + 1) { // Straight
        currentStraight++;
        currentStreak = 1;
        if (currentStraight >= 2) {
            const straightBonus = (currentStraight - 1) * 100;
            bonusScore += straightBonus;
            bonusMessage = `Straight x${currentStraight}! +${straightBonus}`;
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
      
      setMessage(`+${wordData.combined_score} ${bonusMessage}`);

    } else {
      setMessage('Not in word list.');
      setStreakCount(0);
      setStraightCount(0);
    }
    setCurrentInput('');
    clearMessage();
  };

  const handleNextLevel = () => {
      setCurrentLevel(prev => prev + 1);
  };

  if (isLoading && !isGameOver) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Level {currentLevel}...</Text>
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
            <Text style={styles.modalTitle}>{timeLeft <= 0 ? "Time's Up!" : "Level Complete!"}</Text>
            <Text style={styles.modalScore}>Final Score: {score}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <TouchableOpacity style={styles.nextLevelButton} onPress={handleNextLevel}>
              <Text style={styles.nextLevelButtonText}>Next Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.foundCount}>{foundWords.length} / {levelWords?.length} Found</Text>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.seedWordText}>{seedWord.toUpperCase()}</Text>
        <Text style={styles.instructionText}>
          Find all words made from the letters of "{seedWord.toUpperCase()}"
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>{currentInput.toUpperCase()}</Text>
        </View>

        <Text style={styles.messageText}>{message}</Text>

        <CustomKeyboard
          scrambledLetters={scrambledLetters}
          initialCounts={seedLetterMap}
          remainingCounts={remainingLetterCounts}
          onKeyPress={handleKeyPress}
          onDelete={() => setCurrentInput(prev => prev.slice(0, -1))}
          onSubmit={handleSubmit}
        />
      </View>

      <View style={styles.foundWordsContainer}>
          <Text style={styles.foundWordsTitle}>Found Words</Text>
          <FlatList
            data={foundWords}
            keyExtractor={(item) => item.word}
            renderItem={({ item }) => (
              <View style={styles.foundWordRow}>
                <Text style={styles.foundWordText}>{item.word.charAt(0).toUpperCase() + item.word.slice(1)}</Text>
                <View style={styles.foundWordScores}>
                  {item.bonus.type && (
                    <TouchableOpacity
                      onPress={() => handleBonusInfoPress(item.bonus.type as 'streak' | 'straight')}
                      style={styles.bonusContainer}
                    >
                      {item.bonus.type === 'streak' && <StreakIcon style={styles.bonusIcon} />}
                      {item.bonus.type === 'straight' && <StraightIcon style={styles.bonusIcon} />}
                      {item.bonus.count >= 2 && (
                        <Text style={styles.bonusMultiplier}>x{item.bonus.count}</Text>
                      )}
                      <Text style={styles.foundWordBonusText}>+{item.bonus.amount}</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.foundWordScoreText}>+{item.score}</Text>
                </View>
              </View>
            )}
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
  messageText: {
    color: '#4CAF50',
    fontSize: 18,
    height: 30,
    textAlign: 'center',
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
  foundWordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  foundWordText: {
    color: '#ddd',
    fontSize: 18,
    textTransform: 'capitalize',
  },
  foundWordScores: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foundWordScoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  bonusIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  bonusMultiplier: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  foundWordBonusText: {
    color: '#FFD700',
    fontSize: 14,
    fontStyle: 'italic',
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
  modalMessage: {
    fontSize: 16,
    color: '#aaa',
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