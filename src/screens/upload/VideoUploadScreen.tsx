import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '../../components/shared/Layout';

export const VideoUploadScreen: React.FC = () => {
  return (
    <Layout children={
      <View style={styles.container}>
        <Text style={styles.title}>Upload Video</Text>
        <Text style={styles.subtitle}>Video upload interface coming soon...</Text>
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