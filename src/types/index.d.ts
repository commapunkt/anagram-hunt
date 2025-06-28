declare module '*.json' {
    const value: any;
    export default value;
}

export type Language = 'en' | 'de';

export interface Word {
  word: string;
  estimated_uncommonness: number;
  combined_score: number;
}

export interface LevelFile {
  seed_word: string;
  words_length_count?: { [key: string]: number };
  words_list: Word[];
}

export interface LevelMapping {
  [key: string]: string;
} 