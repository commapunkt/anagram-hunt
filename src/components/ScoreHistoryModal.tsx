import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { GameProgress } from '../utils/storage';
import { Language } from '../types';
import { t } from '../utils/translations';

interface ScoreHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  progress: GameProgress | null;
  language: Language;
}

export default function ScoreHistoryModal({ 
  visible, 
  onClose, 
  progress, 
  language 
}: ScoreHistoryModalProps) {
  const completedLevels = progress?.completedLevels || {};
  const levelEntries = Object.entries(completedLevels)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const renderLevelItem = ({ item }: { item: [string, any] }) => {
    const [level, data] = item;
    const completionDate = new Date(data.completedAt).toLocaleDateString();
    
    return (
      <View style={styles.levelItem}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelNumber}>{t('game.level', language, { level })}</Text>
          <Text style={styles.completionDate}>{completionDate}</Text>
        </View>
        <View style={styles.levelStats}>
          <Text style={styles.scoreText}>
            {t('game.score', language, { score: data.score })}
          </Text>
          <Text style={styles.wordsText}>
            {t('game.wordsFound', language, { 
              found: data.wordsFound, 
              total: data.totalWords 
            })}
          </Text>
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
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completionDate: {
    color: '#aaa',
    fontSize: 12,
  },
  levelStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wordsText: {
    color: '#aaa',
    fontSize: 14,
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
}); 