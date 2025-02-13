import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

// When testing on a physical device, we need to use the computer's local IP address
// You can find your IP address by:
// - On Mac/Linux: run `ifconfig` in terminal
// - On Windows: run `ipconfig` in command prompt
// Then look for your WiFi interface's IPv4 address

const isSimulator = Constants.appOwnership === 'expo' && !Constants.sessionId;

const SERVER_URL = Platform.select({
  // For iOS simulator, localhost works
  ios: isSimulator ? 'http://localhost:3000' : 'http://192.168.1.70:3000',
  // For Android emulator, use 10.0.2.2 (special alias for host machine's localhost)
  android: isSimulator ? 'http://10.0.2.2:3000' : 'http://192.168.1.70:3000',
  // Default fallback
  default: 'http://localhost:3000'
});

// Test video data
const TEST_VIDEO = {
  videoId: "m72k8gii-73j5b9hz0rh",
  videoUrl: "https://firebasestorage.googleapis.com/v0/b/reel-ai-v2.firebasestorage.app/o/videos%2Fq2yXvO4vnycNEomVD9WFrdHy7mQ2%2Fm72k8gii-73j5b9hz0rh%2Fvideo.mp4?alt=media&token=72b6a63b-3d2a-43bb-bde9-36124779794a",
  userId: "q2yXvO4vnycNEomVD9WFrdHy7mQ2",
  message: "Testing video transcription with tt25 video"
};

export const ServerTestScreen: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<string>('');
  const [message, setMessage] = useState('');

  const checkServerHealth = async () => {
    try {
      setStatus('loading');
      console.log('Checking server health at:', SERVER_URL);
      const res = await fetch(`${SERVER_URL}/health`);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus('success');
    } catch (error) {
      console.error('Health check error:', error);
      setResponse(error instanceof Error ? error.message : 'Unknown error');
      setStatus('error');
    }
  };

  const testProcessEndpoint = async () => {
    try {
      setStatus('loading');
      console.log('Testing process endpoint with video:', TEST_VIDEO.videoId);
      
      const res = await fetch(`${SERVER_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_VIDEO)
      });
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus('success');
    } catch (error) {
      console.error('Process endpoint error:', error);
      setResponse(error instanceof Error ? error.message : 'Unknown error');
      setStatus('error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Server Test Screen</Text>
        
        <View style={styles.urlInfo}>
          <Text style={styles.urlText}>Server URL: {SERVER_URL}</Text>
          <Text style={styles.platformText}>
            Platform: {Platform.OS} ({isSimulator ? 'Simulator' : 'Physical Device'})
          </Text>
          {!isSimulator && (
            <View style={styles.ipInstructions}>
              <Text style={styles.instructionTitle}>⚠️ Using Physical Device</Text>
              <Text style={styles.instructionText}>
                1. Find your computer's IP address:{'\n'}
                • Mac/Linux: Run `ifconfig`{'\n'}
                • Windows: Run `ipconfig`{'\n'}
                2. Replace YOUR_LOCAL_IP in ServerTestScreen.tsx{'\n'}
                3. Ensure your device is on the same WiFi network
              </Text>
            </View>
          )}
        </View>
        
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter a message for the server"
          placeholderTextColor="#666"
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, status === 'loading' && styles.buttonDisabled]}
            onPress={checkServerHealth}
            disabled={status === 'loading'}
          >
            <Text style={styles.buttonText}>Check Server Health</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, status === 'loading' && styles.buttonDisabled]}
            onPress={testProcessEndpoint}
            disabled={status === 'loading'}
          >
            <Text style={styles.buttonText}>Test Video Processing</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Response:</Text>
          <Text style={[
            styles.responseText,
            status === 'error' && styles.errorText
          ]}>{response}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  urlInfo: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  urlText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  platformText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  ipInstructions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
  },
  instructionTitle: {
    color: '#FFA500',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  responseContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
  },
  responseTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  responseText: {
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: {
    color: '#ff4444',
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
});

export default ServerTestScreen; 