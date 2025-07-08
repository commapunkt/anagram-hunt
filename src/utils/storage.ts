import { Platform } from 'react-native';
import { STAR_THRESHOLDS } from '../config';

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
  selectedSeedWordFile: string;
  foundWords: FoundWordInfo[];
  score: number;
  timeRemaining: number;
  lastWordLength: number;
  streakCount: number;
  straightCount: number;
  savedAt: string;
  isReplayedLevel?: boolean;
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
  
  // Check if we already have a score for this level
  const existingLevelData = existing?.completedLevels?.[level];
  const existingScore = existingLevelData?.score || 0;
  
  // Only update the score if the new score is better than the existing score
  const shouldUpdateScore = score > existingScore;
  
  // If we're updating the score, we need to adjust the total score
  let totalScoreAdjustment = 0;
  if (shouldUpdateScore) {
    // Remove the old score and add the new one
    totalScoreAdjustment = score - existingScore;
  }
  
  const updatedProgress: GameProgress = {
    currentLevel: existing?.currentLevel || 1, // Keep the existing currentLevel, don't auto-increment
    language,
    completedLevels: {
      ...existing?.completedLevels,
      [level]: {
        score: shouldUpdateScore ? score : existingScore,
        wordsFound: shouldUpdateScore ? wordsFound : (existingLevelData?.wordsFound || 0),
        totalWords: shouldUpdateScore ? totalWords : (existingLevelData?.totalWords || 0),
        completedAt: shouldUpdateScore ? now : (existingLevelData?.completedAt || now),
      },
    },
    totalScore: (existing?.totalScore || 0) + totalScoreAdjustment,
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

// Calculate number of stars based on score
export const getStarRating = (score: number): number => {
  if (score >= STAR_THRESHOLDS.THREE_STARS) return 3;
  if (score >= STAR_THRESHOLDS.TWO_STARS) return 2;
  if (score >= STAR_THRESHOLDS.ONE_STAR) return 1;
  return 0;
}; 