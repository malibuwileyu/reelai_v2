import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useNavigation } from '../../providers/NavigationProvider';

export const HomeScreen: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <Layout children={
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Home</Text>

        {/* Development Testing Section */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigate('test')}
            >
              <Text style={styles.buttonText}>🧪 Open Test Screens</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Videos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Videos</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('videoLibrary')}
          >
            <Text style={styles.buttonText}>📺 Video Library</Text>
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