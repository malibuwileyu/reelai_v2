import React, { useEffect } from 'react';
import { AuthProvider, useAuthContext } from './src/providers/AuthProvider';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { Layout } from './src/components/shared/Layout';
import { View, Text } from 'react-native';
import { testFirebaseConnection } from './src/utils/testFirebase';

const HomeScreen = () => {
  return (
    <Layout>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24 }}>Welcome to ReelAI!</Text>
      </View>
    </Layout>
  );
};

const AppContent = () => {
  const { user } = useAuthContext();

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  if (!user) {
    return <LoginScreen />;
  }

  return <HomeScreen />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
} 