import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useAuthContext } from '../../providers/AuthProvider';
import { showToast } from '../../utils/toast';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signInAnon, loading } = useAuthContext();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      await signIn(email, password);
      showToast('Successfully logged in!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to login', 'error');
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnon();
      showToast('Signed in anonymously', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to sign in anonymously', 'error');
    }
  };

  const handleQuickSignIn = async () => {
    try {
      await signIn('test1@example.com', 'password123');
      showToast('Successfully logged in with test account!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to login with test account', 'error');
    }
  };

  return (
    <Layout hideHeader hideFooter>
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.anonymousButton]}
            onPress={handleAnonymousSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue as Guest</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.quickSignInButton]}
            onPress={handleQuickSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Quick Sign-in (Test Account)</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  anonymousButton: {
    backgroundColor: '#333',
    marginTop: 8,
  },
  quickSignInButton: {
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 