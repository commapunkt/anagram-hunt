import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import StreakIcon from './StreakIcon';
import StraightIcon from './StraightIcon';
import { FoundWordInfo } from '../types';

interface AnimatedFoundWordRowProps {
  item: FoundWordInfo;
  index: number;
  onBonusInfoPress: (type: 'streak' | 'straight') => void;
}

const AnimatedFoundWordRow = ({ item, index, onBonusInfoPress }: AnimatedFoundWordRowProps) => {
  const scale = useSharedValue(1);
  const bgColorProgress = useSharedValue(0);

  useEffect(() => {
    if (index === 0) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 300 })
      );
      bgColorProgress.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 800 })
      );
    }
  }, [item.word]);

  const animatedRowStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      bgColorProgress.value,
      [0, 1],
      ['#333', '#FFD700']
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      bgColorProgress.value,
      [0, 1],
      ['#ddd', '#000']
    );
    return { color };
  });

  return (
    <Animated.View style={[styles.foundWordRow, animatedRowStyle]}>
      <Text style={[styles.foundWordText, animatedTextStyle]}>
        {item.word.charAt(0).toUpperCase() + item.word.slice(1)}
      </Text>
      <View style={styles.foundWordScores}>
        {item.bonus.type && (
          <TouchableOpacity
            onPress={() => onBonusInfoPress(item.bonus.type as 'streak' | 'straight')}
            style={styles.bonusContainer}
          >
            {item.bonus.type === 'streak' && <StreakIcon style={styles.bonusIcon} />}
            {item.bonus.type === 'straight' && <StraightIcon style={styles.bonusIcon} />}
            {item.bonus.count >= 2 && (
              <Text style={styles.bonusMultiplier}>x{item.bonus.count}</Text>
            )}
            <Text style={styles.foundWordBonusText}>+{item.bonus.amount}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.foundWordScoreText, animatedTextStyle]}>+{item.score}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  foundWordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    borderRadius: 8,
    marginVertical: 2,
  },
  foundWordText: {
    fontSize: 18,
  },
  foundWordScores: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foundWordScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  bonusIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  bonusMultiplier: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  foundWordBonusText: {
    color: '#FFD700',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default AnimatedFoundWordRow; 