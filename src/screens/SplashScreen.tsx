import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, SafeAreaView, Image } from 'react-native';
import { Language } from '../types';
import { getDeviceLanguage } from '../utils/language';
import { t } from '../utils/translations';
import StreakIcon from '../components/StreakIcon';
import StraightIcon from '../components/StraightIcon';

interface SplashScreenProps {
  onStartGame: (language: Language) => void;
}

const SplashScreen = ({ onStartGame }: SplashScreenProps) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    setLanguage(getDeviceLanguage());
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.subtitle}>{t('splash.welcome', language)}</Text>

        <View style={styles.rule}>
          <Text style={styles.ruleNumber}>1.</Text>
          <Text style={styles.ruleText}>{t('splash.rule1', language)}</Text>
        </View>
        <View style={styles.rule}>
          <Text style={styles.ruleNumber}>2.</Text>
          <Text style={styles.ruleText}>{t('splash.rule2', language)}</Text>
        </View>
        <View style={styles.rule}>
          <Text style={styles.ruleNumber}>3.</Text>
          <Text style={styles.ruleText}>{t('splash.rule3', language)}</Text>
        </View>

        <View style={styles.languageSelector}>
          <Text style={[styles.langText, language === 'en' && styles.activeLang]}>English</Text>
          <Switch
            value={language === 'de'}
            onValueChange={(isGerman) => setLanguage(isGerman ? 'de' : 'en')}
            trackColor={{ false: '#81b0ff', true: '#f5dd4b' }}
            thumbColor={"#f4f3f4"}
          />
          <Text style={[styles.langText, language === 'de' && styles.activeLang]}>Deutsch</Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={() => onStartGame(language)}>
          <Text style={styles.startButtonText}>{t('splash.startGame', language)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    padding: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  ruleNumber: {
    fontSize: 18,
    color: '#FFD700',
    marginRight: 10,
  },
  ruleText: {
    fontSize: 16,
    color: '#ddd',
    flex: 1,
    lineHeight: 24,
  },
  inlineIcon: {
    width: 18,
    height: 18,
  },
  bonusIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  langText: {
    fontSize: 18,
    color: '#888',
    marginHorizontal: 15,
  },
  activeLang: {
    color: '#fff',
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoImage: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default SplashScreen; 