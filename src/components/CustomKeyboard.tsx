import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Language } from '../types';
import { t } from '../utils/translations';

interface CustomKeyboardProps {
  scrambledLetters: string[];
  initialCounts: Map<string, number>;
  remainingCounts: Map<string, number>;
  onKeyPress: (letter: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  language: Language;
  isInvalidWord: boolean;
}

const CustomKeyboard = ({
  scrambledLetters,
  initialCounts,
  remainingCounts,
  onKeyPress,
  onDelete,
  onSubmit,
  language,
  isInvalidWord,
}: CustomKeyboardProps) => {
  const shakeAnimation = useSharedValue(0);

  React.useEffect(() => {
    if (isInvalidWord) {
      shakeAnimation.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [isInvalidWord]);

  const submitButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeAnimation.value }],
    };
  });

  return (
    <View style={styles.keyboard}>
      <View style={styles.keyRow}>
        {scrambledLetters.map((letter, index) => {
          const remaining = remainingCounts.get(letter) || 0;
          const initial = initialCounts.get(letter) || 0;
          const isDisabled = remaining === 0;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.key, isDisabled && styles.keyDisabled]}
              onPress={() => onKeyPress(letter)}
              disabled={isDisabled}
            >
              <Text style={[styles.keyText, isDisabled && styles.keyTextDisabled]}>
                {letter.toUpperCase()}
              </Text>
              {initial > 1 && (
                <View style={[styles.countMarker, isDisabled && styles.countMarkerDisabled]}>
                  <Text style={styles.countMarkerText}>{remaining}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.keyRow}>
        <TouchableOpacity style={[styles.key, styles.specialKey]} onPress={onDelete}>
          <Text style={styles.keyText}>{t('game.delete', language)}</Text>
        </TouchableOpacity>
        <Animated.View style={submitButtonStyle}>
          <TouchableOpacity
            style={[
              styles.key, 
              styles.specialKey, 
              styles.submitKey,
              isInvalidWord && styles.submitKeyInvalid
            ]}
            onPress={onSubmit}
          >
            <Text style={styles.keyText}>{t('game.submit', language)}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  key: {
    backgroundColor: '#444',
    padding: 15,
    margin: 4,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    position: 'relative',
  },
  keyDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.6,
  },
  keyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  keyTextDisabled: {
    color: '#666',
  },
  specialKey: {
    paddingHorizontal: 20,
    backgroundColor: '#666',
  },
  submitKey: {
    backgroundColor: '#4CAF50',
  },
  submitKeyInvalid: {
    backgroundColor: '#f44336',
  },
  countMarker: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countMarkerDisabled: {
    backgroundColor: '#555',
  },
  countMarkerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CustomKeyboard; 