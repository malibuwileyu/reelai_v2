import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '../../components/shared/Layout';

export const EditProfileScreen: React.FC = () => {
  return (
    <Layout children={
      <View style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Coming soon...</Text>
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