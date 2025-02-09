import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useNavigation } from '../../providers/NavigationProvider';

export const LearnScreen: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <Layout children={
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Learn</Text>

        {/* Subjects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('subjectDetail', { subjectId: 'test-subject' })}
          >
            <Text style={styles.buttonText}>📚 Sample Subject</Text>
          </TouchableOpacity>
        </View>

        {/* Learning Paths Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Paths</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigate('pathDetail', { pathId: 'test-path' })}
          >
            <Text style={styles.buttonText}>🛣️ Sample Learning Path</Text>
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