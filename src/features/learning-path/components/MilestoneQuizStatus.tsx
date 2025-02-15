import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MilestoneQuizProgress, MilestoneQuizRequirements } from '../types/quizMilestone';

interface MilestoneQuizStatusProps {
  quizProgress?: MilestoneQuizProgress;
  requirements: MilestoneQuizRequirements;
  isUnlocked: boolean;
  onStartQuiz?: () => void;
  onViewHistory?: () => void;
}

export const MilestoneQuizStatus: React.FC<MilestoneQuizStatusProps> = ({
  quizProgress,
  requirements,
  isUnlocked,
  onStartQuiz,
  onViewHistory,
}) => {
  const attemptsRemaining = requirements.maxAttempts 
    ? requirements.maxAttempts - (quizProgress?.attempts.length || 0)
    : undefined;

  const bestScore = quizProgress?.bestScore || 0;
  const isPassing = bestScore >= requirements.passingScore;
  const hasAttempts = !requirements.maxAttempts || attemptsRemaining! > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Status</Text>
        {quizProgress && (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={onViewHistory}
          >
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={[
            styles.statusBadge,
            isPassing ? styles.statusCompleted : 
            !isUnlocked ? styles.statusLocked :
            styles.statusInProgress
          ]}>
            <Text style={styles.statusText}>
              {isPassing ? 'Completed' : 
               !isUnlocked ? 'Locked' : 
               'In Progress'}
            </Text>
          </View>
        </View>

        {quizProgress && (
          <>
            <View style={styles.scoreRow}>
              <Text style={styles.label}>Best Score:</Text>
              <Text style={[
                styles.score,
                isPassing ? styles.scorePassing : styles.scoreFailing
              ]}>
                {bestScore.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.requirementRow}>
              <Text style={styles.label}>Required Score:</Text>
              <Text style={styles.value}>{requirements.passingScore}%</Text>
            </View>

            {attemptsRemaining !== undefined && (
              <View style={styles.requirementRow}>
                <Text style={styles.label}>Attempts Remaining:</Text>
                <Text style={styles.value}>{attemptsRemaining}</Text>
              </View>
            )}
          </>
        )}

        {!isPassing && isUnlocked && hasAttempts && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStartQuiz}
          >
            <Text style={styles.startButtonText}>
              {quizProgress ? 'Retry Quiz' : 'Start Quiz'}
            </Text>
          </TouchableOpacity>
        )}

        {!isUnlocked && (
          <View style={styles.lockInfo}>
            <Text style={styles.lockInfoTitle}>Requirements to Unlock:</Text>
            {requirements.requiredVideoIds.map((videoId) => (
              <Text key={videoId} style={styles.lockInfoItem}>
                • Complete video: {videoId}
              </Text>
            ))}
            {requirements.unlockCriteria?.previousMilestoneId && (
              <Text style={styles.lockInfoItem}>
                • Complete previous milestone
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    width: 120,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#34C75920',
  },
  statusInProgress: {
    backgroundColor: '#007AFF20',
  },
  statusLocked: {
    backgroundColor: '#FF3B3020',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  score: {
    fontSize: 24,
    fontWeight: '600',
  },
  scorePassing: {
    color: '#34C759',
  },
  scoreFailing: {
    color: '#FF3B30',
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  lockInfo: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  lockInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  lockInfoItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
}); 