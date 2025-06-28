import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import WordFinder from '../components/WordFinder';

const DevToolsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <WordFinder />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default DevToolsScreen; 