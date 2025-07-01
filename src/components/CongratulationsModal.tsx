import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { GameProgress } from '../utils/storage';
import { Language } from '../types';
import { t } from '../utils/translations';

interface CongratulationsModalProps {
  visible: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  progress: GameProgress | null;
  language: Language;
}

export default function CongratulationsModal({ 
  visible, 
  onClose, 
  onPlayAgain,
  progress, 
  language 
}: CongratulationsModalProps) {
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
            <Text style={styles.totalScoreValue}>
              {progress?.totalScore || 0}
            </Text>
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
          
          <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain}>
            <Text style={styles.playAgainButtonText}>
              {t('game.playAgain', language)}
            </Text>
          </TouchableOpacity>
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
  playAgainButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 