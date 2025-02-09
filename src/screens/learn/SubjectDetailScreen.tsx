import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '../../components/shared/Layout';

interface Props {
  subjectId: string;
}

export const SubjectDetailScreen: React.FC<Props> = ({ subjectId }) => {
  return (
    <Layout children={
      <View style={styles.container}>
        <Text style={styles.title}>Subject Details</Text>
        <Text style={styles.subtitle}>Subject ID: {subjectId}</Text>
      </View>
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
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
}); 