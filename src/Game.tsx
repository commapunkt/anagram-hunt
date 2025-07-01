import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { GameProgress, loadGameProgress, updateLevelProgress, saveCurrentGameState, loadCurrentGameState, clearCurrentGameState, FoundWordInfo } from './utils/storage';
import { GAME_CONFIG } from './config';

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
  isResuming?: boolean;
  onPause?: () => void;
}

export default function Game({ language, isResuming, onPause }: GameProps) {
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
  const [timeLeft, setTimeLeft] = useState<number>(GAME_CONFIG.TIME_LIMIT);

  const [lastWordLength, setLastWordLength] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [straightCount, setStraightCount] = useState(0);

  const [bonusInfo, setBonusInfo] = useState<{ title: string; description: string } | null>(null);
  const [isInvalidWord, setIsInvalidWord] = useState(false);
  const [isResumingGame, setIsResumingGame] = useState(false);
  
  const gameStateRef = useRef<any>();
  useEffect(() => {
    gameStateRef.current = {
      level: currentLevel,
      language,
      seedWord,
      foundWords,
      score,
      timeRemaining: timeLeft,
      lastWordLength,
      streakCount,
      straightCount,
      isLoading,
    };
  });

  const saveCurrentState = useCallback(() => {
    const { isLoading, seedWord, ...stateToSave } = gameStateRef.current;
    if (!isLoading && seedWord) {
      saveCurrentGameState({ ...stateToSave, savedAt: new Date().toISOString() });
    }
  }, []);

  const loadData = useCallback(async (level: number) => {
    setIsLoading(true);
    try {
      const basePath = Platform.OS === 'web' ? 'data' : 'asset:/data';
      const mappingUrl = `${basePath}/${language}/_level-mapping.json`;
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

      const levelUrl = `${basePath}/${language}/${levelFile}`;
      const levelResponse = await fetch(levelUrl);
      if (!levelResponse.ok) throw new Error(`Failed to fetch level data`);

      const data: LevelFile = await levelResponse.json();
      if (!data || !Array.isArray(data.words_list)) throw new TypeError(`Level data is not in the correct format.`);

      setLevelWords(data.words_list);
      setSeedWord(data.seed_word);
      setWordMap(new Map(data.words_list.map((w: Word) => [w.word.toLowerCase(), w])));
      const newSeedMap = getCharMap(data.seed_word.toLowerCase());
      setSeedLetterMap(newSeedMap);
      setScrambledLetters(shuffleArray(Array.from(newSeedMap.keys())));
    } catch (error) {
      alert(`Error: Failed to load level data.`);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // This effect runs once on mount to initialize the game state
  useEffect(() => {
    const currentGameState = loadCurrentGameState();
    if (isResuming && currentGameState && currentGameState.language === language) {
      // --- RESUME LOGIC ---
      setScore(currentGameState.score);
      setTimeLeft(currentGameState.timeRemaining);
      setLastWordLength(currentGameState.lastWordLength);
      setStreakCount(currentGameState.streakCount);
      setStraightCount(currentGameState.straightCount);
      setFoundWords(currentGameState.foundWords);
      setIsGameOver(false);
      setIsResumingGame(true); 
      setCurrentLevel(currentGameState.level);
      clearCurrentGameState();
    } else {
      // --- NEW GAME LOGIC ---
      const savedProgress = loadGameProgress();
      const levelToLoad = (savedProgress && savedProgress.language === language) ? savedProgress.currentLevel : 1;
      setFoundWords([]);
      setScore(0);
      setTimeLeft(GAME_CONFIG.TIME_LIMIT);
      setIsGameOver(false);
      setLastWordLength(0);
      setStreakCount(0);
      setStraightCount(0);
      setIsInvalidWord(false);
      setCurrentLevel(levelToLoad);
    }
  }, [isResuming, language]);

  // This effect runs whenever the level changes to load the new data
  useEffect(() => {
    if (currentLevel > 0) {
      loadData(currentLevel);
    }
  }, [currentLevel, loadData]);

  // Timer effect
  useEffect(() => {
    if (isGameOver || isLoading || isResumingGame) return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [isGameOver, isLoading, isResumingGame, timeLeft]);

  // Finish "resuming" mode after data has loaded
  useEffect(() => {
    if (isResumingGame && !isLoading) {
      const timer = setTimeout(() => setIsResumingGame(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isResumingGame, isLoading]);

  // Periodic save effect
  useEffect(() => {
    const saveCurrentState = () => {
      if (!isLoading && seedWord) {
        saveCurrentGameState({
          level: currentLevel,
          language,
          seedWord,
          foundWords,
          score,
          timeRemaining: timeLeft,
          lastWordLength,
          streakCount,
          straightCount,
          savedAt: new Date().toISOString()
        });
      }
    };
    const interval = setInterval(saveCurrentState, 1000);
    return () => clearInterval(interval);
  }, [currentLevel, language, seedWord, foundWords, score, timeLeft, lastWordLength, streakCount, straightCount, isLoading]);

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
    if (levelWords) {
      updateLevelProgress(
        currentLevel,
        score,
        foundWords.length,
        levelWords.length,
        language
      );
    }
    clearCurrentGameState();

    // Reset all game state for the new level
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_CONFIG.TIME_LIMIT);
    setIsGameOver(false);
    setLastWordLength(0);
    setStreakCount(0);
    setStraightCount(0);
    setIsResumingGame(false);

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
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        {onPause && (
          <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
            <Text style={styles.pauseButtonText}>⏸</Text>
          </TouchableOpacity>
        )}
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
  pauseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pauseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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