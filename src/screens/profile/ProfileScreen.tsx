import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useNavigation } from '../../providers/NavigationProvider';
import { useAuthContext } from '../../providers/AuthProvider';

export const ProfileScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const { user } = useAuthContext();

  return (
    <Layout children={
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Management</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('editProfile')}
          >
            <Text style={styles.buttonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Content</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('videoLibrary')}
          >
            <Text style={styles.buttonText}>📚 Video Library</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('achievements')}
          >
            <Text style={styles.buttonText}>🏆 View Achievements</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('settings')}
          >
            <Text style={styles.buttonText}>⚙️ App Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Development Section */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigate('test')}
            >
              <Text style={styles.buttonText}>🧪 Test Screens</Text>
            </TouchableOpacity>
          </View>
        )}
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