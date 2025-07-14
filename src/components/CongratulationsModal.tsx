import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { GameProgress } from '../utils/storage';
import { Language } from '../types';
import { t } from '../utils/translations';
import StarRating from './StarRating';

interface CongratulationsModalProps {
  visible: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  progress: GameProgress | null;
  language: Language;
  onPlayLevelAgain?: (level: number) => void;
  onStartOver?: () => void;
}

export default function CongratulationsModal({ 
  visible, 
  onClose, 
  onPlayAgain,
  progress, 
  language,
  onPlayLevelAgain,
  onStartOver
}: CongratulationsModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRetryConfirmDialog, setShowRetryConfirmDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const completedLevels = progress?.completedLevels || {};
  const levelEntries = Object.entries(completedLevels)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const renderLevelItem = ({ item }: { item: [string, any] }) => {
    const [level, data] = item;
    
    return (
      <View style={styles.levelItem}>
        <View style={styles.levelContent}>
          <Text style={styles.levelNumber}>{t('game.level', language, { level })}</Text>
          <View style={styles.levelScoreContainer}>
            <StarRating score={data.score} size="small" showScore={false} />
            <Text style={styles.levelScoreText}>
              {t('game.score', language, { score: data.score })}
            </Text>
          </View>
          {onPlayLevelAgain && (
            <TouchableOpacity 
              style={styles.playLevelAgainButton} 
              onPress={() => {
                setSelectedLevel(parseInt(level));
                setShowRetryConfirmDialog(true);
              }}
            >
              <Text style={styles.playLevelAgainButtonText}>↻</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎉 {t('game.congratulations', language)} 🎉</Text>
          </View>
          
          <View style={styles.congratulationsMessage}>
            <Text style={styles.congratulationsText}>
              {t('game.allLevelsComplete', language)}
            </Text>
          </View>
          
          <View style={styles.totalScoreContainer}>
            <Text style={styles.totalScoreLabel}>
              {t('game.finalTotalScore', language)}
            </Text>
            <View style={styles.totalScoreStarsContainer}>
              <StarRating score={progress?.totalScore || 0} size="large" showScore={false} />
              <Text style={styles.totalScoreValue}>
                {progress?.totalScore || 0}
              </Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>
              {t('game.levelBreakdown', language)}
            </Text>
            <FlatList
              data={levelEntries}
              keyExtractor={(item) => item[0]}
              renderItem={renderLevelItem}
              style={styles.historyList}
              showsVerticalScrollIndicator={false}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.startOverButton} 
            onPress={() => setShowConfirmDialog(true)}
          >
            <Text style={styles.startOverButtonText}>
              {t('game.startOver', language)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirmation Dialog */}
      <Modal
        visible={showConfirmDialog}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>{t('game.startOver', language)}</Text>
            <Text style={styles.confirmMessage}>
              {t('game.startOverConfirm', language)}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowConfirmDialog(false)}
              >
                <Text style={styles.buttonText}>{t('game.cancel', language)}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={() => {
                  setShowConfirmDialog(false);
                  onStartOver?.();
                }}
              >
                <Text style={styles.buttonText}>{t('game.startOver', language)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Retry Confirmation Dialog */}
      <Modal
        visible={showRetryConfirmDialog}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>{t('game.playLevelAgainTitle', language)}</Text>
            <Text style={styles.confirmMessage}>
              {selectedLevel ? t('game.playLevelAgainConfirm', language, { level: selectedLevel }) : ''}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowRetryConfirmDialog(false)}
              >
                <Text style={styles.buttonText}>{t('game.cancel', language)}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={() => {
                  setShowRetryConfirmDialog(false);
                  if (selectedLevel && onPlayLevelAgain) {
                    onPlayLevelAgain(selectedLevel);
                  }
                }}
              >
                <Text style={styles.buttonText}>{t('game.playLevelAgain', language)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 25,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },

  congratulationsMessage: {
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  congratulationsText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  totalScoreContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalScoreLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  totalScoreStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalScoreValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  statsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  historyList: {
    flex: 1,
  },
  levelItem: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  levelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelScoreText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playAgainButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playLevelAgainButton: {
    backgroundColor: '#2196F3',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  playLevelAgainButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  startOverButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startOverButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmDialog: {
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 