import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, ActivityIndicator, Platform } from 'react-native';
import { findAndScoreWords, WordResult } from '../utils/wordFinder';

const WordFinder = () => {
    const [seedWord, setSeedWord] = useState('');
    const [language, setLanguage] = useState<'en' | 'de'>('en');
    const [results, setResults] = useState<WordResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedSeedWord, setGeneratedSeedWord] = useState('');
    
    const wordLengthCounts = useMemo(() => {
        if (results.length === 0) return null;
        
        return results.reduce((acc, current) => {
            const lengthKey = current.word.length.toString();
            acc[lengthKey] = (acc[lengthKey] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
    }, [results]);

    const handleFindWords = () => {
        setIsLoading(true);
        setResults([]);
        setTimeout(() => {
            try {
                const found = findAndScoreWords(seedWord, language);
                setResults(found);
                setGeneratedSeedWord(seedWord);
            } catch (error) {
                console.error("Failed to find words:", error);
            } finally {
                setIsLoading(false);
            }
        }, 50);
    };
    
    const handleDownload = () => {
        if (Platform.OS !== 'web') {
            alert('Download is only available on the web.');
            return;
        }

        const filename = `${generatedSeedWord.toLowerCase().replace(/[^a-z]/g, '')}.json`;
        
        const fileContent = {
            seed_word: generatedSeedWord.toUpperCase(),
            words_length_count: wordLengthCounts,
            words_list: results,
        };

        const jsonStr = JSON.stringify(fileContent, null, 2);
        
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Word List Generator</Text>
            <Text style={styles.label}>
                Enter a seed word to find all possible sub-words. The generated JSON will have the correct format for a level file.
            </Text>
            
            <TextInput
                style={styles.input}
                placeholder="e.g., understanding"
                value={seedWord}
                onChangeText={setSeedWord}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
            />
            
            <View style={styles.switchContainer}>
                <Text style={[styles.langText, language === 'en' && styles.activeLang]}>English</Text>
                <Switch
                    value={language === 'de'}
                    onValueChange={(isGerman) => setLanguage(isGerman ? 'de' : 'en')}
                    trackColor={{ false: '#81b0ff', true: '#f5dd4b' }}
                    thumbColor={"#f4f3f4"}
                />
                <Text style={[styles.langText, language === 'de' && styles.activeLang]}>German</Text>
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title="Find Words"
                    onPress={handleFindWords}
                    disabled={!seedWord || isLoading}
                />
            </View>

            {isLoading && <ActivityIndicator size="large" color="#007AFF" style={{marginVertical: 20}} />}

            {results.length > 0 && !isLoading && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>Generation Complete!</Text>
                    <Text style={styles.resultsText}>Total words found: {results.length}</Text>
                    
                    {wordLengthCounts && (
                        <>
                            <Text style={styles.sampleTitle}>Word Count by Length:</Text>
                            <View style={styles.countsContainer}>
                                {Object.entries(wordLengthCounts)
                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                    .map(([length, count]) => (
                                    <View key={length} style={styles.countItem}>
                                        <Text style={styles.countLength}>{length}</Text>
                                        <Text style={styles.countValue}>{count}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    <Text style={styles.sampleTitle}>Sample of the 10 Highest-Scoring Words:</Text>
                    <View style={styles.sampleWordsContainer}>
                        {results.slice(0, 10).map((wordResult) => (
                            <Text key={wordResult.word} style={styles.sampleWord}>
                                {wordResult.word}
                            </Text>
                        ))}
                    </View>

                    <Button
                        title={`Download ${generatedSeedWord.toLowerCase().replace(/[^a-z]/g, '')}.json`}
                        onPress={handleDownload}
                        color="#4CAF50"
                        disabled={!generatedSeedWord}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    langText: {
        fontSize: 16,
        marginHorizontal: 10,
        color: '#888',
    },
    activeLang: {
        fontWeight: 'bold',
        color: '#000',
    },
    buttonContainer: {
        marginBottom: 20,
    },
    resultsContainer: {
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultsText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
    },
    sampleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 10,
        marginTop: 10,
    },
    sampleWordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
    },
    sampleWord: {
        backgroundColor: '#e2e2e2',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        margin: 4,
        fontSize: 14,
        color: '#333',
    },
    countsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
        width: '100%',
    },
    countItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        margin: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 80,
    },
    countLength: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    countValue: {
        fontSize: 18,
        color: '#000',
        fontWeight: 'bold',
    },
});

export default WordFinder; 