import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MilestoneQuizStatus } from './MilestoneQuizStatus';
import type { Milestone } from '../types';
import type { MilestoneQuizProgress } from '../types/quizMilestone';

interface MilestoneQuizListProps {
  milestone: Milestone;
  quizProgress?: Record<string, MilestoneQuizProgress>;
  unlockedQuizIds: string[];
  onSelectQuiz: (quizId: string) => void;
  onViewHistory: (quizId: string) => void;
}

export const MilestoneQuizList: React.FC<MilestoneQuizListProps> = ({
  milestone,
  quizProgress,
  unlockedQuizIds,
  onSelectQuiz,
  onViewHistory,
}) => {
  const quizzes = milestone.quizzes || [];

  if (quizzes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color="#666666" />
        <Text style={styles.emptyText}>No quizzes available for this milestone</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Milestone Quizzes</Text>
        <Text style={styles.subtitle}>
          Complete {quizzes.length} quiz{quizzes.length > 1 ? 'zes' : ''} to progress
        </Text>
      </View>

      <View style={styles.quizList}>
        {quizzes.map((quiz, index) => (
          <View key={quiz.id} style={styles.quizItem}>
            <View style={styles.quizHeader}>
              <Text style={styles.quizTitle}>Quiz {index + 1}</Text>
              {quiz.requirements?.timeLimit && (
                <View style={styles.timeLimit}>
                  <Ionicons name="time-outline" size={16} color="#666666" />
                  <Text style={styles.timeLimitText}>
                    {Math.floor(quiz.requirements.timeLimit / 60)} minutes
                  </Text>
                </View>
              )}
            </View>

            <MilestoneQuizStatus
              quizProgress={quizProgress?.[quiz.id]}
              requirements={quiz.requirements}
              isUnlocked={unlockedQuizIds.includes(quiz.id)}
              onStartQuiz={() => onSelectQuiz(quiz.id)}
              onViewHistory={() => onViewHistory(quiz.id)}
            />

            {index < quizzes.length - 1 && (
              <View style={styles.divider} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  quizList: {
    padding: 16,
  },
  quizItem: {
    marginBottom: 24,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeLimitText: {
    fontSize: 14,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
}); 