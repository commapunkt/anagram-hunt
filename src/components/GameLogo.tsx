import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GameLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function GameLogo({ size = 'large' }: GameLogoProps) {
  const getLogoSize = () => {
    switch (size) {
      case 'small': return 100;
      case 'medium': return 150;
      default: return 250;
    }
  };

  const logoSize = getLogoSize();
  const letterSize = logoSize * 0.35;
  const shadowOffset = logoSize * 0.06;

  return (
    <View style={[styles.container, { width: logoSize, height: logoSize }]}>
      {/* Background circle for N64 style */}
      <View style={[styles.backgroundCircle, { width: logoSize * 0.85, height: logoSize * 0.85 }]}>
        {/* Deepest shadow layer */}
        <Text style={[
          styles.deepestShadow,
          { fontSize: letterSize },
          { transform: [{ translateX: shadowOffset * 3 }, { translateY: shadowOffset * 3 }] }
        ]}>
          AGH
        </Text>
        
        {/* Deep shadow layer */}
        <Text style={[
          styles.deepShadow,
          { fontSize: letterSize },
          { transform: [{ translateX: shadowOffset * 2.5 }, { translateY: shadowOffset * 2.5 }] }
        ]}>
          AGH
        </Text>
        
        {/* Middle shadow layer */}
        <Text style={[
          styles.middleShadow,
          { fontSize: letterSize },
          { transform: [{ translateX: shadowOffset * 2 }, { translateY: shadowOffset * 2 }] }
        ]}>
          AGH
        </Text>
        
        {/* Light shadow layer */}
        <Text style={[
          styles.lightShadow,
          { fontSize: letterSize },
          { transform: [{ translateX: shadowOffset * 1.5 }, { translateY: shadowOffset * 1.5 }] }
        ]}>
          AGH
        </Text>
        
        {/* Lighter shadow layer */}
        <Text style={[
          styles.lighterShadow,
          { fontSize: letterSize },
          { transform: [{ translateX: shadowOffset }, { translateY: shadowOffset }] }
        ]}>
          AGH
        </Text>
        
        {/* Main text layer */}
        <Text style={[
          styles.mainText,
          { fontSize: letterSize }
        ]}>
          AGH
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    backgroundColor: '#1a1a1a',
    borderRadius: 1000, // Large value for perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  mainText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    position: 'absolute',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 3,
  },
  lighterShadow: {
    color: '#DDDDDD',
    fontWeight: '900',
    textAlign: 'center',
    position: 'absolute',
    letterSpacing: 3,
  },
  lightShadow: {
    color: '#BBBBBB',
    fontWeight: '900',
    textAlign: 'center',
    position: 'absolute',
    letterSpacing: 3,
  },
  middleShadow: {
    color: '#999999',
    fontWeight: '900',
    textAlign: 'center',
    position: 'absolute',
    letterSpacing: 3,
  },
  deepShadow: {
    color: '#777777',
    fontWeight: '900',
    textAlign: 'center',
    position: 'absolute',
    letterSpacing: 3,
  },
  deepestShadow: {
    color: '#555555',
    fontWeight: '900',
    textAlign: 'center',
    position: 'absolute',
    letterSpacing: 3,
  },
}); 