declare module '*.json' {
    const value: any;
    export default value;
}

interface WordData {
    word: string;
    length: number;
    estimated_uncommonness: string;
    combined_score: number;
}

interface LevelData {
    seed_word: string;
    words_list: WordData[];
} 