import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStarRating } from '../utils/storage';

interface StarRatingProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showScore?: boolean;
}

export default function StarRating({ score, size = 'medium', showScore = true }: StarRatingProps) {
  const stars = getStarRating(score);
  
  const getStarSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };
  
  const getContainerStyle = () => {
    switch (size) {
      case 'small': return styles.containerSmall;
      case 'large': return styles.containerLarge;
      default: return styles.containerMedium;
    }
  };

  return (
    <View style={[styles.container, getContainerStyle()]}>
      <View style={styles.starsContainer}>
        {[1, 2, 3].map((starNumber) => (
          <Text 
            key={starNumber} 
            style={[
              styles.star, 
              { fontSize: getStarSize() },
              starNumber <= stars ? styles.starFilled : styles.starEmpty
            ]}
          >
            ⭐
          </Text>
        ))}
      </View>
      {showScore && (
        <Text style={[styles.scoreText, { fontSize: getStarSize() - 4 }]}>
          {score}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerSmall: {
    gap: 4,
  },
  containerMedium: {
    gap: 6,
  },
  containerLarge: {
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    opacity: 0.3,
  },
  scoreText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 