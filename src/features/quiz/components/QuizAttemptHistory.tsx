import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuizAttempt } from '../hooks/useQuizAttempt';
import type { QuizAttempt } from '../types';
import { Timestamp } from 'firebase/firestore';

interface QuizAttemptHistoryProps {
  userId: string;
  quizId: string;
}

export const QuizAttemptHistory: React.FC<QuizAttemptHistoryProps> = ({
  userId,
  quizId,
}) => {
  const {
    loading,
    error,
    previousAttempts,
    loadPreviousAttempts,
    getAttemptStats,
  } = useQuizAttempt({
    userId,
    quizId,
  });

  const [stats, setStats] = React.useState<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    averageTimeMs: number;
    lastAttemptAt: Timestamp;
  } | null>(null);

  useEffect(() => {
    loadPreviousAttempts();
    getAttemptStats().then(stats => {
      if (stats && stats.lastAttemptAt) {
        setStats(stats as {
          totalAttempts: number;
          averageScore: number;
          bestScore: number;
          averageTimeMs: number;
          lastAttemptAt: Timestamp;
        });
      }
    });
  }, [loadPreviousAttempts, getAttemptStats]);

  if (loading && !previousAttempts.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load quiz history</Text>
      </View>
    );
  }

  if (!previousAttempts.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No attempts yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Attempts</Text>
            <Text style={styles.statValue}>{stats.totalAttempts}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Best Score</Text>
            <Text style={[styles.statValue, styles.bestScore]}>
              {stats.bestScore.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Average Score</Text>
            <Text style={styles.statValue}>
              {stats.averageScore.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Average Time</Text>
            <Text style={styles.statValue}>
              {formatTime(stats.averageTimeMs)}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Attempts</Text>
      <ScrollView style={styles.attemptList}>
        {previousAttempts.map((attempt) => (
          <View key={attempt.id} style={styles.attemptItem}>
            <View style={styles.attemptHeader}>
              <Text style={styles.attemptDate}>
                {formatDate(attempt.completedAt?.toDate() || new Date())}
              </Text>
              <Text style={[
                styles.attemptScore,
                attempt.score >= 80 ? styles.highScore : attempt.score >= 60 ? styles.mediumScore : styles.lowScore,
              ]}>
                {attempt.score.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.attemptDetails}>
              <Text style={styles.attemptDetail}>
                Time: {formatTime(attempt.timeSpentMs || 0)}
              </Text>
              <Text style={styles.attemptDetail}>
                Questions: {attempt.questions.length}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    margin: 16,
  },
  statItem: {
    width: '50%',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  bestScore: {
    color: '#34C759',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  attemptList: {
    flex: 1,
  },
  attemptItem: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    padding: 16,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attemptDate: {
    fontSize: 14,
    color: '#666666',
  },
  attemptScore: {
    fontSize: 18,
    fontWeight: '600',
  },
  highScore: {
    color: '#34C759',
  },
  mediumScore: {
    color: '#FF9500',
  },
  lowScore: {
    color: '#FF3B30',
  },
  attemptDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  attemptDetail: {
    fontSize: 14,
    color: '#666666',
  },
}); 