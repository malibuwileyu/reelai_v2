import React from 'react';
import { AuthProvider } from './src/providers/AuthProvider';
import { NavigationProvider } from './src/providers/NavigationProvider';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const App = () => (
  <AuthProvider>
    <NavigationProvider>
      {__DEV__ && <DevMenu />}
    </NavigationProvider>
  </AuthProvider>
);

const DevMenu = () => {
  return (
    <View style={styles.devMenu}>
      <TouchableOpacity style={styles.devButton}>
        <Text style={styles.devButtonText}>🧪 Test Screens</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  devMenu: {
    position: 'absolute',
    bottom: 90, // Above the footer
    right: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  devButton: {
    padding: 8,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App; 