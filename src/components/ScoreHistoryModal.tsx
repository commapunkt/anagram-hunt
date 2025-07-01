import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { GameProgress } from '../utils/storage';
import { Language } from '../types';
import { t } from '../utils/translations';

interface ScoreHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  progress: GameProgress | null;
  language: Language;
  onPlayLevelAgain?: (level: number) => void;
}

export default function ScoreHistoryModal({ 
  visible, 
  onClose, 
  progress, 
  language,
  onPlayLevelAgain
}: ScoreHistoryModalProps) {
  const completedLevels = progress?.completedLevels || {};
  const levelEntries = Object.entries(completedLevels)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const renderLevelItem = ({ item }: { item: [string, any] }) => {
    const [level, data] = item;
    
    return (
      <View style={styles.levelItem}>
        <View style={styles.levelContent}>
          <Text style={styles.levelNumber}>{t('game.level', language, { level })}</Text>
          <Text style={styles.scoreText}>
            {t('game.score', language, { score: data.score })}
          </Text>
          {onPlayLevelAgain && (
            <TouchableOpacity 
              style={styles.playAgainButton} 
              onPress={() => {
                setSelectedLevel(parseInt(level));
                setShowConfirmDialog(true);
              }}
            >
              <Text style={styles.playAgainButtonText}>↻</Text>
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
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('game.scoreHistory', language)}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {levelEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {t('game.noHistoryYet', language)}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.totalScoreContainer}>
                <Text style={styles.totalScoreLabel}>
                  {t('game.totalScore', language)}
                </Text>
                <Text style={styles.totalScoreValue}>
                  {progress?.totalScore || 0}
                </Text>
              </View>
              
              <FlatList
                data={levelEntries}
                keyExtractor={(item) => item[0]}
                renderItem={renderLevelItem}
                style={styles.historyList}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
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
            <Text style={styles.confirmTitle}>Play Level Again</Text>
            <Text style={styles.confirmMessage}>
              Start a new attempt for Level {selectedLevel}?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowConfirmDialog(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={() => {
                  setShowConfirmDialog(false);
                  if (selectedLevel && onPlayLevelAgain) {
                    onPlayLevelAgain(selectedLevel);
                  }
                }}
              >
                <Text style={styles.buttonText}>Play Again</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#FF6B35',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalScoreContainer: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  totalScoreLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
  totalScoreValue: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
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
  scoreText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: '#2196F3',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 14,
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
    color: '#2196F3',
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
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 