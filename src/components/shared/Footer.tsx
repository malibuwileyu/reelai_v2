import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Footer: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.copyright}>© 2024 ReelAI. All rights reserved.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  copyright: {
    color: '#666',
    fontSize: 12,
  },
}); 