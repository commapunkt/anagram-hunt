import { Platform } from 'react-native';

export interface GameProgress {
  currentLevel: number;
  language: 'en' | 'de';
  completedLevels: {
    [level: number]: {
      score: number;
      wordsFound: number;
      totalWords: number;
      completedAt: string;
    };
  };
  totalScore: number;
  lastPlayed: string;
}

export interface FoundWordInfo {
  word: string;
  score: number;
  bonus: {
    type: 'streak' | 'straight' | null;
    amount: number;
    count: number;
  };
}

export interface CurrentGameState {
  level: number;
  language: 'en' | 'de';
  seedWord: string;
  foundWords: FoundWordInfo[];
  score: number;
  timeRemaining: number;
  lastWordLength: number;
  streakCount: number;
  straightCount: number;
  savedAt: string;
}

const STORAGE_KEY = 'anagram_hunt_progress';
const CURRENT_GAME_KEY = 'anagram_hunt_current_game';

export const saveGameProgress = (progress: GameProgress): void => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save game progress:', error);
    }
  }
};

export const loadGameProgress = (): GameProgress | null => {
  if (Platform.OS === 'web') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load game progress:', error);
    }
  }
  return null;
};

export const clearGameProgress = (): void => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_GAME_KEY);
    } catch (error) {
      console.error('Failed to clear game progress:', error);
    }
  }
};

export const updateLevelProgress = (
  level: number,
  score: number,
  wordsFound: number,
  totalWords: number,
  language: 'en' | 'de'
): GameProgress => {
  const existing = loadGameProgress();
  const now = new Date().toISOString();
  
  const updatedProgress: GameProgress = {
    currentLevel: level + 1,
    language,
    completedLevels: {
      ...existing?.completedLevels,
      [level]: {
        score,
        wordsFound,
        totalWords,
        completedAt: now,
      },
    },
    totalScore: (existing?.totalScore || 0) + score,
    lastPlayed: now,
  };

  saveGameProgress(updatedProgress);
  return updatedProgress;
};

export const saveCurrentGameState = (state: CurrentGameState): void => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save current game state:', error);
    }
  }
};

export const loadCurrentGameState = (): CurrentGameState | null => {
  if (Platform.OS === 'web') {
    try {
      const saved = localStorage.getItem(CURRENT_GAME_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load current game state:', error);
    }
  }
  return null;
};

export const clearCurrentGameState = (): void => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(CURRENT_GAME_KEY);
    } catch (error) {
      console.error('Failed to clear current game state:', error);
    }
  }
}; 