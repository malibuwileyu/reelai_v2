import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useNavigation } from '../../providers/NavigationProvider';

export const TestScreen: React.FC = () => {
  const { navigate } = useNavigation();

  const TestButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <Layout children={
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Test Screens</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Home Screens</Text>
          <TestButton 
            title="Video Detail Screen" 
            onPress={() => navigate('videoDetail', { videoId: 'test-video-id' })} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Learn Screens</Text>
          <TestButton 
            title="Subject Detail Screen" 
            onPress={() => navigate('subjectDetail', { subjectId: 'test-subject' })} 
          />
          <TestButton 
            title="Learning Path Detail" 
            onPress={() => navigate('pathDetail', { pathId: 'test-path' })} 
          />
          <TestButton 
            title="Achievements Screen" 
            onPress={() => navigate('achievements')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⬆️ Upload Screens</Text>
          <TestButton 
            title="Video Upload Screen" 
            onPress={() => navigate('videoUpload')} 
          />
          <TestButton 
            title="Processing Queue" 
            onPress={() => navigate('processingQueue')} 
          />
          <TestButton 
            title="AI Enhancement Options" 
            onPress={() => navigate('aiEnhancement')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile Screens</Text>
          <TestButton 
            title="Edit Profile" 
            onPress={() => navigate('editProfile')} 
          />
          <TestButton 
            title="Video Library" 
            onPress={() => navigate('videoLibrary')} 
          />
          <TestButton 
            title="Settings" 
            onPress={() => navigate('settings')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Auth Screens</Text>
          <TestButton 
            title="Login Screen" 
            onPress={() => navigate('login')} 
          />
          <TestButton 
            title="Register Screen" 
            onPress={() => navigate('register')} 
          />
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 