import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useNavigation } from '../../providers/NavigationProvider';

export const UploadScreen: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <Layout children={
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Upload</Text>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Upload</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('videoUpload')}
          >
            <Text style={styles.buttonText}>📤 Upload New Video</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Videos</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('processingQueue')}
          >
            <Text style={styles.buttonText}>⚙️ View Processing Queue</Text>
          </TouchableOpacity>
        </View>

        {/* AI Enhancement Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Enhancements</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('aiEnhancement')}
          >
            <Text style={styles.buttonText}>🤖 AI Enhancement Options</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 32,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 