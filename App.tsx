import React from 'react';
import { AuthProvider, useAuthContext } from './src/providers/AuthProvider';
import { NavigationProvider, useNavigation } from './src/providers/NavigationProvider';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DevMenu = () => {
  const { navigate } = useNavigation();
  
  return (
    <View style={styles.devMenu}>
      <TouchableOpacity 
        style={styles.devButton}
        onPress={() => navigate('test')}
      >
        <Text style={styles.devButtonText}>🧪 Test Screens</Text>
      </TouchableOpacity>
    </View>
  );
};

const AppContent = () => {
  const { user } = useAuthContext();
  
  if (!user) {
    return <LoginScreen />;
  }
  
  return (
    <NavigationProvider>
      <>
        {/* Main app content will go here */}
        {__DEV__ && <DevMenu />}
      </>
    </NavigationProvider>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

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