import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, ActivityIndicator, Modal, TouchableOpacity, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Language, LevelFile, LevelMapping, LevelInfo, Word } from './types';
import { getDeviceLanguage } from './utils/language';
import CustomKeyboard from './components/CustomKeyboard';
import StreakIcon from './components/StreakIcon';
import StraightIcon from './components/StraightIcon';
import BonusInfoModal from './components/BonusInfoModal';
import AnimatedFoundWordRow from './components/AnimatedFoundWordRow';
import ScoreHistoryModal from './components/ScoreHistoryModal';
import CongratulationsModal from './components/CongratulationsModal';
import StarRating from './components/StarRating';
import { t } from './utils/translations';
import { loadGameProgress, saveGameProgress, updateLevelProgress, loadCurrentGameState, saveCurrentGameState, clearCurrentGameState, GameProgress, FoundWordInfo } from './utils/storage';
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
  onPlayAgain?: () => void;
  startLevel?: number;
  onPlayLevelAgain?: (level: number) => void;
  onStartOver?: () => void;
  onStartLevelUsed?: (level?: number) => void;
  resetCongratulationsModal?: boolean;
}

export default function Game({ language, isResuming, onPause, onPlayAgain, startLevel, onPlayLevelAgain, onStartOver, onStartLevelUsed, resetCongratulationsModal }: GameProps) {
  const [levelWords, setLevelWords] = useState<Word[] | null>(null);
  const [seedWord, setSeedWord] = useState('');
  const [selectedSeedWordFile, setSelectedSeedWordFile] = useState('');
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [isNewBestScore, setIsNewBestScore] = useState(false);
  const [isReplayingLevel, setIsReplayingLevel] = useState(false);
  const [isAllLevelsCompleted, setIsAllLevelsCompleted] = useState(false);
  const [levelCompletionButtonText, setLevelCompletionButtonText] = useState('');
  
  const gameStateRef = useRef<any>(null);
  const savedSeedWordFileRef = useRef<string>('');
  const lastLoadedDataRef = useRef<{level: number, seedWordFile: string} | null>(null);
  
  useEffect(() => {
    gameStateRef.current = {
      level: currentLevel,
      language,
      seedWord,
      selectedSeedWordFile,
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

  const clearSavedSeedWordFile = useCallback(() => {
    console.log('Clearing savedSeedWordFileRef.current');
    savedSeedWordFileRef.current = '';
    console.log('Clearing lastLoadedDataRef.current');
    lastLoadedDataRef.current = null;
  }, []);

  const loadData = useCallback(async (level: number, savedSeedWordFile?: string) => {
    console.log('=== LOADDATA FUNCTION CALLED ===');
    console.log('level:', level);
    console.log('savedSeedWordFile:', savedSeedWordFile);
    console.log('isResumingGame:', isResumingGame);
    
    setIsLoading(true);
    try {
      const basePath = Platform.OS === 'web' ? 'data' : 'asset:/data';
      const mappingUrl = `${basePath}/${language}/_level-mapping.json`;
      const mappingResponse = await fetch(mappingUrl);
      if (!mappingResponse.ok) throw new Error(`Failed to fetch level mapping`);
      const levelMapping: LevelMapping = await mappingResponse.json();
      
      // Use the level parameter directly, not currentLevel state
      const levelInfo = levelMapping[level.toString()];
      
      if (!levelInfo) {
        // Level not found - this means we've reached the end of all available levels
        // Check if we should show congratulations (game is actually finished)
        const progress = loadGameProgress();
        const isLastLevel = !levelMapping[(level + 1).toString()];
        
        if (isLastLevel && (timeLeft <= 0 || isGameOver)) {
          // This is the last level and the game is finished - show congratulations
          if (levelWords) {
            updateLevelProgress(
              level, // Use the level parameter directly
              score,
              foundWords.length,
              levelWords.length,
              language
            );
          }
          setGameProgress(progress);
          setShowCongratulationsModal(true);
          setIsGameOver(true);
          setIsLoading(false);
          clearCurrentGameState(); // Clear current game state when game is completed
          clearSavedSeedWordFile(); // Clear saved seed word file when game is completed
          return;
        } else if (isReplayingLevel) {
          // We're replaying a level that doesn't exist - this shouldn't happen
          setIsLoading(false);
          return;
        } else {
          // We have time remaining and this isn't the last level - continue normally
          setIsLoading(false);
          return;
        }
      }
      
      // Determine which seed word file to use
      let seedWordFileToUse: string;
      
      if (savedSeedWordFile) {
        // When resuming, use the saved seed word file
        seedWordFileToUse = savedSeedWordFile;
        setSelectedSeedWordFile(savedSeedWordFile);
        console.log('USING SAVED SEED WORD FILE:', seedWordFileToUse);
      } else {
        // For new games or replaying, randomly select a seed word file
        seedWordFileToUse = levelInfo.seed_words[Math.floor(Math.random() * levelInfo.seed_words.length)];
        setSelectedSeedWordFile(seedWordFileToUse);
        console.log('USING RANDOM SEED WORD FILE:', seedWordFileToUse);
      }
      
      // Load the selected seed word file
      const levelUrl = `${basePath}/${language}/${seedWordFileToUse}`;
      console.log('Loading from URL:', levelUrl);
      const levelResponse = await fetch(levelUrl);
      if (!levelResponse.ok) throw new Error(`Failed to fetch level data`);

      const data: LevelFile = await levelResponse.json();
      if (!data || !Array.isArray(data.words_list)) throw new TypeError(`Level data is not in the correct format.`);

      console.log('Loaded seed word:', data.seed_word);
      setLevelWords(data.words_list);
      setSeedWord(data.seed_word);
      setWordMap(new Map(data.words_list.map((w: Word) => [w.word.toLowerCase(), w])));
      const newSeedMap = getCharMap(data.seed_word.toLowerCase());
      setSeedLetterMap(newSeedMap);
      setScrambledLetters(shuffleArray(Array.from(newSeedMap.keys())));
      setIsReplayingLevel(false); // Reset replay flag when level loads successfully
    } catch (error) {
      console.error('Error in loadData:', error);
      alert(`Error: Failed to load level data.`);
    } finally {
      setIsLoading(false);
    }
  }, [language, isReplayingLevel]);

  const checkIfAllLevelsCompleted = useCallback(async () => {
    try {
      const basePath = Platform.OS === 'web' ? 'data' : 'asset:/data';
      const mappingUrl = `${basePath}/${language}/_level-mapping.json`;
      const mappingResponse = await fetch(mappingUrl);
      if (mappingResponse.ok) {
        const levelMapping = await mappingResponse.json();
        const nextLevel = currentLevel + 1;
        const levelInfo = levelMapping[nextLevel.toString()];
        return !levelInfo;
      }
    } catch (error) {
      console.error('Error checking if all levels completed:', error);
    }
    return false;
  }, [language, currentLevel]);

  const findNextUnplayedLevel = useCallback(async () => {
    try {
      const basePath = Platform.OS === 'web' ? 'data' : 'asset:/data';
      const mappingUrl = `${basePath}/${language}/_level-mapping.json`;
      const mappingResponse = await fetch(mappingUrl);
      if (mappingResponse.ok) {
        const levelMapping = await mappingResponse.json();
        const progress = loadGameProgress();
        const completedLevels = progress?.completedLevels || {};
        
        console.log('findNextUnplayedLevel - progress:', progress);
        console.log('findNextUnplayedLevel - completedLevels:', completedLevels);
        
        // Get all available level numbers from the mapping
        const availableLevels = Object.keys(levelMapping).map(Number).sort((a, b) => a - b);
        console.log('findNextUnplayedLevel - availableLevels:', availableLevels);
        
        // Find the next level that hasn't been played
        for (const level of availableLevels) {
          console.log(`findNextUnplayedLevel - checking level ${level}, completed: ${!!completedLevels[level]}`);
          if (!completedLevels[level]) {
            console.log(`findNextUnplayedLevel - found next unplayed level: ${level}`);
            return level;
          }
        }
        
        // If all levels have been played, return null
        console.log('findNextUnplayedLevel - all levels have been played');
        return null;
      }
    } catch (error) {
      console.error('Error finding next unplayed level:', error);
    }
    return null;
  }, [language]);

  const checkIfAllLevelsPlayed = useCallback(async () => {
    const nextUnplayedLevel = await findNextUnplayedLevel();
    return nextUnplayedLevel === null;
  }, [findNextUnplayedLevel]);

  // This effect runs once on mount to initialize the game state
  useEffect(() => {
    console.log('=== INITIALIZATION EFFECT ===');
    console.log('isResuming:', isResuming);
    console.log('language:', language);
    console.log('startLevel:', startLevel);
    
    const currentGameState = loadCurrentGameState();
    console.log('currentGameState:', currentGameState);
    
    if (isResuming && currentGameState && currentGameState.language === language) {
      console.log('=== RESUME LOGIC STARTING ===');
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
      setSelectedSeedWordFile(currentGameState.selectedSeedWordFile); // Resume selectedSeedWordFile
      
      console.log('Resume state set:');
      console.log('- level:', currentGameState.level);
      console.log('- selectedSeedWordFile:', currentGameState.selectedSeedWordFile);
      console.log('- isResumingGame: true');
      
      // Check if this was a replayed level
      if (currentGameState.isReplayedLevel) {
        setIsReplayingLevel(true);
        console.log('- isReplayingLevel: true');
      }
      
      // Store the selected seed word file before clearing the state
      savedSeedWordFileRef.current = currentGameState.selectedSeedWordFile;
      console.log('savedSeedWordFileRef.current set to:', savedSeedWordFileRef.current);
      clearCurrentGameState();
      console.log('Current game state cleared');
      
      // Check if this was a completed game
      const progress = loadGameProgress();
      if (progress && progress.language === language) {
        // Check if all levels are completed by trying to load the next level
        const checkIfCompleted = async () => {
          try {
            const basePath = Platform.OS === 'web' ? 'data' : 'asset:/data';
            const mappingUrl = `${basePath}/${language}/_level-mapping.json`;
            const mappingResponse = await fetch(mappingUrl);
            if (mappingResponse.ok) {
              const levelMapping = await mappingResponse.json();
              const nextLevel = (progress.currentLevel || 1) + 1;
              const levelInfo = levelMapping[nextLevel.toString()];
              
              // If no level info exists for the next level, the game is completed
              if (!levelInfo) {
                // Only show congratulations if there's no time remaining
                if (currentGameState.timeRemaining <= 0) {
                  // Game is completed - show congratulations modal
                  setGameProgress(progress);
                  setShowCongratulationsModal(true);
                  setIsGameOver(true);
                  setIsLoading(false);
                  clearCurrentGameState(); // Clear current game state when game is completed
                  clearSavedSeedWordFile(); // Clear saved seed word file when game is completed
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error checking game completion:', error);
          }
        };
        
        checkIfCompleted();
      }
    } else {
      console.log('=== NEW GAME LOGIC STARTING ===');
      // --- NEW GAME LOGIC ---
      const savedProgress = loadGameProgress();
      let levelToLoad = (savedProgress && savedProgress.language === language) ? savedProgress.currentLevel : 1;
      
      // If a specific start level is provided, use that instead
      if (startLevel) {
        levelToLoad = startLevel;
        setIsReplayingLevel(true);
        // Clear any existing game state when restarting a level
        clearCurrentGameState();
        // Immediately set currentLevel to ensure it's correct for level completion logic
        setCurrentLevel(startLevel);
        console.log('Replaying level:', startLevel);
      } else {
        setCurrentLevel(levelToLoad);
        console.log('Starting new game at level:', levelToLoad);
      }
      
      setFoundWords([]);
      setScore(0);
      setTimeLeft(GAME_CONFIG.TIME_LIMIT);
      setIsGameOver(false);
      setLastWordLength(0);
      setStreakCount(0);
      setStraightCount(0);
      setIsInvalidWord(false);
      clearSavedSeedWordFile(); // Clear saved seed word file for new game
      console.log('savedSeedWordFileRef.current cleared for new game');
    }
  }, [isResuming, language, startLevel, onStartLevelUsed]);

  // This effect runs whenever the level changes to load the new data
  useEffect(() => {
    console.log('=== LOAD DATA EFFECT ===');
    console.log('currentLevel:', currentLevel);
    console.log('isResumingGame:', isResumingGame);
    console.log('startLevel:', startLevel);
    console.log('savedSeedWordFileRef.current:', savedSeedWordFileRef.current);
    console.log('lastLoadedDataRef.current:', lastLoadedDataRef.current);
    
    if (currentLevel > 0) {
      // When restarting a level, use startLevel directly to avoid race conditions
      const levelToLoad = startLevel || currentLevel;
      console.log('levelToLoad:', levelToLoad);
      
      // Check if we have a saved seed word file for this level (from resuming)
      const savedSeedWordFile = savedSeedWordFileRef.current;
      
      // Check if we've already loaded this exact combination
      const dataKey = { level: levelToLoad, seedWordFile: savedSeedWordFile || 'random' };
      const alreadyLoaded = lastLoadedDataRef.current && 
        lastLoadedDataRef.current.level === dataKey.level && 
        lastLoadedDataRef.current.seedWordFile === dataKey.seedWordFile;
      
      console.log('alreadyLoaded:', alreadyLoaded);
      
      if (alreadyLoaded) {
        console.log('SKIPPING LOAD: Already loaded this exact data combination');
        return;
      }
      
      // If we're resuming and have a saved seed word file, use it
      if (isResumingGame && savedSeedWordFile) {
        console.log('LOADING: Resuming with saved seed word file:', savedSeedWordFile);
        loadData(levelToLoad, savedSeedWordFile);
        lastLoadedDataRef.current = dataKey;
      } else if (savedSeedWordFile) {
        // We have a saved seed word file but we're not in resuming mode
        // This means we're in a resumed game session - use the saved seed word file
        console.log('LOADING: Resumed game session - using saved seed word file:', savedSeedWordFile);
        loadData(levelToLoad, savedSeedWordFile);
        lastLoadedDataRef.current = dataKey;
      } else if (!isResumingGame && !savedSeedWordFile) {
        // Only load data for non-resuming cases (new games, replaying levels)
        // AND when we don't have a saved seed word file
        console.log('LOADING: New game/replay - loading random seed word');
        loadData(levelToLoad);
        lastLoadedDataRef.current = dataKey;
      } else {
        console.log('SKIPPING LOAD:');
        if (isResumingGame && !savedSeedWordFile) {
          console.log('- Resuming but no saved seed word file');
        }
      }
      // If we're resuming but don't have a saved seed word file, don't load anything
      // This prevents the double-loading issue
    }
  }, [currentLevel, loadData, isResumingGame, startLevel]);

  // Timer effect
  useEffect(() => {
    if (isGameOver || isLoading || isResumingGame) return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }
    
    // Save game state immediately when timer starts (game begins)
    if (seedWord && !isLoading) {
      saveCurrentGameState({
        level: currentLevel,
        language,
        seedWord,
        selectedSeedWordFile,
        foundWords,
        score,
        timeRemaining: timeLeft,
        lastWordLength,
        streakCount,
        straightCount,
        savedAt: new Date().toISOString(),
        isReplayedLevel: !!startLevel
      });
    }
    
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [isGameOver, isLoading, isResumingGame, timeLeft, seedWord, currentLevel, language, foundWords, score, lastWordLength, streakCount, straightCount, selectedSeedWordFile]);

  const checkIfNewBestScore = useCallback(() => {
    // Don't show "NEW BEST!" for zero scores
    if (score === 0) return false;
    
    const progress = loadGameProgress();
    const existingLevelData = progress?.completedLevels?.[currentLevel];
    const existingScore = existingLevelData?.score || 0;
    return score > existingScore;
  }, [currentLevel, score]);

  // Finish "resuming" mode after data has loaded
  useEffect(() => {
    console.log('=== FINISH RESUMING EFFECT ===');
    console.log('isResumingGame:', isResumingGame);
    console.log('isLoading:', isLoading);
    console.log('savedSeedWordFileRef.current:', savedSeedWordFileRef.current);
    
    if (isResumingGame && !isLoading) {
      console.log('Setting timer to finish resuming mode...');
      const timer = setTimeout(() => {
        console.log('Timer fired - setting isResumingGame to false');
        setIsResumingGame(false);
        // Don't clear the saved seed word file ref - keep it for the entire resumed game session
        // This prevents the second load with a random word
        console.log('Keeping savedSeedWordFileRef.current:', savedSeedWordFileRef.current);
      }, 300);
      return () => {
        console.log('Clearing timer');
        clearTimeout(timer);
      };
    }
  }, [isResumingGame, isLoading]);

  // Check for new best score
  useEffect(() => {
    if (score > 0 && !isLoading) {
      const isNewBest = checkIfNewBestScore();
      setIsNewBestScore(isNewBest);
    }
  }, [score, checkIfNewBestScore, isLoading]);

  // Reset congratulations modal when restarting a level
  useEffect(() => {
    if (resetCongratulationsModal) {
      setShowCongratulationsModal(false);
    }
  }, [resetCongratulationsModal]);

  // Reset startLevel after it has been used
  useEffect(() => {
    if (startLevel && !isLoading && seedWord) {
      // Only reset startLevel after the level has been loaded and the game has started
      onStartLevelUsed?.(startLevel);
    }
  }, [startLevel, isLoading, seedWord, onStartLevelUsed]);

  // Update level completion button text when current level changes
  useEffect(() => {
    const updateButtonText = async () => {
      const allPlayed = await checkIfAllLevelsPlayed();
      setLevelCompletionButtonText(allPlayed ? t('game.ok', language) : t('game.nextLevel', language));
    };
    
    if (currentLevel > 0) {
      updateButtonText();
    }
  }, [currentLevel, checkIfAllLevelsPlayed, language]);

  // Periodic save effect
  useEffect(() => {
    const saveCurrentState = () => {
      if (!isLoading && seedWord) {
        saveCurrentGameState({
          level: currentLevel,
          language,
          seedWord,
          selectedSeedWordFile,
          foundWords,
          score,
          timeRemaining: timeLeft,
          lastWordLength,
          streakCount,
          straightCount,
          savedAt: new Date().toISOString(),
          isReplayedLevel: !!startLevel
        });
      }
    };
    const interval = setInterval(saveCurrentState, 1000);
    return () => clearInterval(interval);
  }, [currentLevel, language, seedWord, foundWords, score, timeLeft, lastWordLength, streakCount, straightCount, isLoading, startLevel, selectedSeedWordFile]);

  // Physical keyboard handling
  useEffect(() => {
    if (Platform.OS !== 'web' || isLoading || isGameOver) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      // Handle letter keys
      if (/^[a-z]$/.test(key)) {
        const usedCounts = getCharMap(currentInput);
        const availableCount = seedLetterMap.get(key) || 0;
        const usedCount = usedCounts.get(key) || 0;

        if (usedCount < availableCount) {
          setCurrentInput(prev => prev + key);
        }
      }
      
      // Handle backspace
      if (key === 'backspace') {
        setCurrentInput(prev => prev.slice(0, -1));
      }
      
      // Handle enter
      if (key === 'enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentInput, seedLetterMap, isLoading, isGameOver]);

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

  const handleNextLevel = async () => {
    console.log('handleNextLevel - starting, currentLevel:', currentLevel);
    if (levelWords) {
      console.log('handleNextLevel - updating level progress for level:', currentLevel);
      updateLevelProgress(
        currentLevel, // Keep using currentLevel here since this is for normal progression
        score,
        foundWords.length,
        levelWords.length,
        language
      );
    }
    clearCurrentGameState();

    // Find the next unplayed level
    console.log('handleNextLevel - finding next unplayed level...');
    const nextUnplayedLevel = await findNextUnplayedLevel();
    console.log('handleNextLevel - nextUnplayedLevel:', nextUnplayedLevel);
    
    if (nextUnplayedLevel === null) {
      // All levels have been played - game is completed
      console.log('handleNextLevel - all levels completed, showing congratulations');
      const progress = loadGameProgress();
      setGameProgress(progress);
      setShowCongratulationsModal(true);
      setIsGameOver(true);
      clearCurrentGameState(); // Clear current game state when game is completed
      return;
    }
    
    // Update the progress to set the currentLevel to the next unplayed level
    const progress = loadGameProgress();
    if (progress) {
      const updatedProgress = {
        ...progress,
        currentLevel: nextUnplayedLevel
      };
      saveGameProgress(updatedProgress);
    }
    
    // Go to the next unplayed level
    console.log('handleNextLevel - going to next unplayed level:', nextUnplayedLevel);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_CONFIG.TIME_LIMIT);
    setIsGameOver(false);
    setLastWordLength(0);
    setStreakCount(0);
    setStraightCount(0);
    setIsResumingGame(false);
    setIsReplayingLevel(false);
    setIsInvalidWord(false);
    setCurrentInput('');

    // Reset startLevel to ensure we're not in replay mode for the next level
    if (startLevel) {
      onStartLevelUsed?.(undefined);
    }

    // Set the new level - this will trigger the loadData effect
    setCurrentLevel(nextUnplayedLevel);
  };

  const handleShowHistory = () => {
    const progress = loadGameProgress();
    setGameProgress(progress);
    setShowHistoryModal(true);
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

      <ScoreHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        progress={gameProgress}
        language={language}
        onPlayLevelAgain={onPlayLevelAgain}
      />

      <CongratulationsModal
        visible={showCongratulationsModal}
        onClose={() => setShowCongratulationsModal(false)}
        onPlayAgain={onPlayAgain || (() => {})}
        progress={gameProgress}
        language={language}
        onPlayLevelAgain={onPlayLevelAgain}
        onStartOver={onStartOver}
      />

      <Modal
        visible={isGameOver && !showCongratulationsModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {timeLeft <= 0 ? t('game.timesUp', language) : t('game.levelComplete', language)}
            </Text>
            
            <View style={styles.modalScoreContainer}>
              <StarRating score={score} size="large" showScore={false} />
              <Text style={styles.modalScore}>{t('game.finalScore', language, { score })}</Text>
            </View>
            
            {/* Show high score information */}
            {isNewBestScore ? (
              <Text style={styles.newHighScoreText}>{t('game.newHighScore', language)}</Text>
            ) : (
              <Text style={styles.previousScoreText}>
                {t('game.previousScoreKept', language, { 
                  score: (() => {
                    const progress = loadGameProgress();
                    const existingLevelData = progress?.completedLevels?.[currentLevel];
                    return existingLevelData?.score || 0;
                  })()
                })}
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.nextLevelButton} 
              onPress={handleNextLevel}
            >
              <Text style={styles.nextLevelButtonText}>
                {levelCompletionButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, isNewBestScore && styles.newBestScore]}>
            {t('game.score', language, { score })}
          </Text>
          {isNewBestScore && score > 0 && (
            <Text style={styles.newBestScoreLabel}>🏆 NEW BEST!</Text>
          )}
        </View>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.historyButton} onPress={handleShowHistory}>
            <Text style={styles.historyButtonText}>📈</Text>
          </TouchableOpacity>
          {onPause && (
            <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
              <Text style={styles.pauseButtonText}>⏸</Text>
            </TouchableOpacity>
          )}
        </View>
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
  scoreContainer: {
    alignItems: 'center',
  },
  newBestScore: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  newBestScoreLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    paddingTop: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    backgroundColor: '#333',
    minHeight: 60,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  inputText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  foundWordsContainer: {
    height: '30%',
    width: '90%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flex: 1,
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
    height: '100%',
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
  modalScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  newHighScoreText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  previousScoreText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 15,
    textAlign: 'center',
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