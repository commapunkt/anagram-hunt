import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { Platform } from 'react-native';
import Game from './src/Game';
import DevToolsScreen from './src/screens/DevToolsScreen';
import SplashScreen from './src/screens/SplashScreen';
import { Language } from './src/types';
import { loadCurrentGameState, clearCurrentGameState, clearGameProgress } from './src/utils/storage';

type GameState = 'splash' | 'playing' | 'devtools' | 'paused';

export default function App() {
    const [gameState, setGameState] = useState<GameState>('splash');
    const [language, setLanguage] = useState<Language>('en');
    const [hasSavedGame, setHasSavedGame] = useState(false);

    // Check for saved game state on startup
    useEffect(() => {
        const checkSavedGame = () => {
            const savedGame = loadCurrentGameState();
            if (savedGame) {
                setLanguage(savedGame.language);
                setHasSavedGame(true);
                setGameState('paused');
            }
        };

        checkSavedGame();
    }, []);

    // Check for devtools query parameter on web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('devtools') === 'true') {
                setGameState('devtools');
            }
        }
    }, []);

    const handleStartGame = (selectedLanguage: Language) => {
        // Clear all saved game data when starting fresh
        clearCurrentGameState();
        clearGameProgress();
        
        setLanguage(selectedLanguage);
        setGameState('playing');
        setHasSavedGame(false);
    };

    const handleResumeGame = () => {
        setGameState('playing');
    };

    const handleNewGame = () => {
        // Clear all saved game data
        clearCurrentGameState();
        clearGameProgress();
        
        // Reset app state
        setHasSavedGame(false);
        
        // Go back to splash screen
        setGameState('splash');
    };

    const renderContent = () => {
        switch (gameState) {
            case 'playing':
                return <Game language={language} isResuming={hasSavedGame} />;
            case 'paused':
                return (
                    <View style={styles.pausedContainer}>
                        <Text style={styles.pausedTitle}>Game Paused</Text>
                        <Text style={styles.pausedText}>You have a saved game in progress.</Text>
                        <View style={styles.pausedButtons}>
                            <TouchableOpacity style={styles.resumeButton} onPress={handleResumeGame}>
                                <Text style={styles.buttonText}>Resume Game</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
                                <Text style={styles.buttonText}>New Game</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 'devtools':
                return (
                    <>
                        <DevToolsScreen />
                        <View style={styles.backButton}>
                            <Button title="Back to Splash" onPress={() => setGameState('splash')} />
                        </View>
                    </>
                );
            case 'splash':
            default:
                return <SplashScreen onStartGame={handleStartGame} />;
        }
    };

    return (
        <View style={styles.container}>
            {renderContent()}
            {gameState !== 'devtools' && __DEV__ && (
                <View style={styles.devButton}>
                    <Button
                        title="Dev Tools"
                        onPress={() => setGameState('devtools')}
                        color="#841584"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    devButton: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        zIndex: 10,
    },
    backButton: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        color: '#FFFFFF',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelText: {
        fontSize: 18,
        marginRight: 10,
        color: '#E0E0E0',
    },
    languageButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        marginLeft: 10,
    },
    languageButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    timeRemaining: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    score: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    streak: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    seedWord: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 20,
        color: '#BDBDBD',
    },
    input: {
        borderWidth: 1,
        borderColor: '#424242',
        borderRadius: 5,
        padding: 10,
        fontSize: 18,
        marginBottom: 10,
        backgroundColor: '#2D2D2D',
        color: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 5,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    keyboard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
    },
    key: {
        width: 40,
        height: 48,
        margin: 4,
        backgroundColor: '#2D2D2D',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#424242',
    },
    keyContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    keyDisabled: {
        opacity: 0.5,
    },
    backspaceKey: {
        width: 60,
        backgroundColor: '#FF6B6B',
    },
    frequencyBubble: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: '#2196F3',
        borderWidth: 1,
        borderColor: '#1976D2',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frequencyText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    foundWordsContainer: {
        flex: 1,
        marginTop: 20,
    },
    foundWordsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#E0E0E0',
    },
    foundWord: {
        fontSize: 16,
        marginBottom: 5,
        color: '#BDBDBD',
    },
    gameOverContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameOverText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    finalScore: {
        fontSize: 24,
        color: '#fff',
        marginBottom: 20,
    },
    playAgainButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 5,
    },
    playAgainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    nextLevelButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 5,
        marginLeft: 10,
    },
    nextLevelButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    gameOverButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    messageContainer: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: '#1976D2',
    },
    errorMessage: {
        backgroundColor: '#D32F2F',
    },
    successMessage: {
        backgroundColor: '#388E3C',
    },
    messageText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    pausedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
        padding: 20,
    },
    pausedTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    pausedText: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 30,
    },
    pausedButtons: {
        flexDirection: 'row',
        gap: 20,
    },
    resumeButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    newGameButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
