import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '../../components/shared/Layout';

export const AchievementsScreen: React.FC = () => {
  return (
    <Layout children={
      <View style={styles.container}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>Your achievements will appear here...</Text>
      </View>
    } />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
}); 