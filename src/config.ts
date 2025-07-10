// Game configuration
export const GAME_CONFIG = {
  TIME_LIMIT: 300, // 5 minutes in seconds
} as const;

// Star rating thresholds
export const STAR_THRESHOLDS = {
  ZERO_STARS: 0,
  ONE_STAR: 1000,
  TWO_STARS: 10000,
  THREE_STARS: 20000,
} as const;