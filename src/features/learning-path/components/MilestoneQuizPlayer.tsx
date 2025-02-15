import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { QuizPlayer } from '../../quiz/components/QuizPlayer';
import { useQuizAttempt } from '../../quiz/hooks/useQuizAttempt';
import { MilestoneUnlockService } from '../services/milestoneUnlockService';
import { ProgressTrackingService } from '../services/progressTrackingService';
import { QuizMilestoneService } from '../services/quizMilestoneService';
import type { Milestone, QuizContent } from '../types';
import type { MilestoneQuizProgress, MilestoneQuizRequirements } from '../types/quizMilestone';
import type { QuestionBank } from '../../quiz/types';
import { Timestamp } from 'firebase/firestore';

interface MilestoneQuizPlayerProps {
  milestone: Milestone;
  userId: string;
  pathId: string;
  onComplete?: (progress: MilestoneQuizProgress) => void;
  onExit?: () => void;
}

export const MilestoneQuizPlayer: React.FC<MilestoneQuizPlayerProps> = ({
  milestone,
  userId,
  pathId,
  onComplete,
  onExit,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuestionBank | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const unlockService = new MilestoneUnlockService();
  const progressService = new ProgressTrackingService();

  const quizContent = milestone.quiz || milestone.quizzes?.[0];
  const quizId = quizContent?.id;

  const {
    startAttempt,
    submitAttempt,
    currentAttempt,
  } = useQuizAttempt({
    userId,
    quizId: quizId || '',
    onError: (error) => {
      console.error('Quiz attempt error:', error);
      Alert.alert('Error', 'Failed to save quiz progress');
    },
  });

  // Load quiz and check unlock status on mount
  useEffect(() => {
    const loadQuizAndCheckUnlock = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Loading quiz - Milestone data:', {
          id: milestone.id,
          content: milestone.content,
          quiz: milestone.quiz,
          quizzes: milestone.quizzes
        });

        // Check if quiz exists in content array
        const quizContent = milestone.content?.find(
          item => item.type === 'quiz'
        ) as QuizContent | undefined;

        console.log('📦 Quiz content from milestone:', quizContent);

        // Check if quiz exists in quiz field
        const singleQuiz = milestone.quiz;
        console.log('🎯 Single quiz from milestone:', singleQuiz);

        // Check if quiz exists in quizzes array
        const multipleQuizzes = milestone.quizzes;
        console.log('📚 Multiple quizzes from milestone:', multipleQuizzes);

        // Determine which quiz to use
        let quizId: string | undefined;
        let requirements: MilestoneQuizRequirements | undefined;

        if (quizContent) {
          console.log('🎲 Using quiz from content array:', quizContent.quizId);
          quizId = quizContent.quizId;
          requirements = {
            passingScore: quizContent.passingScore,
            timeLimit: quizContent.timeLimit,
            requiredVideoIds: milestone.unlockCriteria?.requiredVideos || []
          };
        } else if (singleQuiz) {
          console.log('🎲 Using single quiz:', singleQuiz.id);
          quizId = singleQuiz.id;
          requirements = singleQuiz.requirements;
        } else if (multipleQuizzes?.length) {
          console.log('🎲 Using first quiz from quizzes array:', multipleQuizzes[0].id);
          quizId = multipleQuizzes[0].id;
          requirements = multipleQuizzes[0].requirements;
        }

        console.log('🔑 Final quiz selection:', {
          quizId,
          requirements,
          unlockCriteria: milestone.unlockCriteria
        });

        if (!quizId) {
          throw new Error(`Quiz not found in milestone ${milestone.id}`);
        }

        // Load quiz questions
        console.log('📝 Loading quiz questions for:', quizId);
        const questionBank = await QuizMilestoneService.getQuiz(quizId);
        
        if (!questionBank) {
          console.error('❌ Question bank not found for quiz:', quizId);
          throw new Error('Quiz questions not found');
        }

        console.log('✅ Loaded question bank:', {
          id: questionBank.id,
          questionCount: questionBank.questions.length
        });

        // Check unlock status
        if (requirements) {
          console.log('🔓 Checking unlock requirements:', requirements);
          const unlockResult = await unlockService.validateQuizPrerequisites(
            milestone.id,
            userId,
            requirements
          );
          console.log('🔐 Unlock result:', unlockResult);

          if (!unlockResult.isUnlocked) {
            setError(`Quiz is locked: ${unlockResult.reason}`);
            return;
          }
        } else {
          console.warn('⚠️ No requirements found for quiz:', quizId);
        }

        setQuiz(questionBank);
      } catch (err) {
        console.error('❌ Error loading quiz:', err);
        const error = err instanceof Error ? err : new Error('Failed to load quiz');
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuizAndCheckUnlock();
  }, [milestone, userId, quizId, quizContent]);

  const handleStartQuiz = useCallback(async () => {
    if (!quiz) return;

    try {
      console.log('▶️ Starting quiz attempt');
      await startAttempt(quiz.questions);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      Alert.alert('Error', 'Failed to start quiz');
    }
  }, [quiz, startAttempt]);

  const handleQuizComplete = useCallback(async (score: number, answers: Record<string, any>) => {
    try {
      console.log('✅ Completing quiz attempt:', { score });
      const attempt = await submitAttempt(answers, score);
      
      // Update milestone progress
      const quizProgress: MilestoneQuizProgress = {
        milestoneId: milestone.id,
        userId,
        questionBankId: quizId || '',
        attempts: [attempt],
        bestScore: score,
        isCompleted: score >= (quizContent?.requirements?.passingScore || 70),
        lastAttemptAt: attempt.completedAt!,
        unlocked: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('📊 Updating quiz progress:', {
        milestoneId: milestone.id,
        score,
        isCompleted: quizProgress.isCompleted
      });

      await progressService.trackQuizAttempt(
        pathId,
        milestone.id,
        userId,
        quizProgress
      );

      onComplete?.(quizProgress);

      Alert.alert(
        'Quiz Complete',
        `You scored ${score.toFixed(1)}%${quizProgress.isCompleted ? '\nMilestone completed!' : ''}`,
        [
          {
            text: 'Close',
            onPress: () => {
              setIsPlaying(false);
              onExit?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      Alert.alert('Error', 'Failed to save quiz results');
    }
  }, [milestone, userId, pathId, quizId, submitAttempt, progressService, onComplete, onExit]);

  const handleQuizExit = useCallback(() => {
    setIsPlaying(false);
    onExit?.();
  }, [onExit]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {!isUnlocked && (
          <View style={styles.lockInfo}>
            <Text style={styles.lockInfoText}>To unlock this quiz:</Text>
            {(quizContent?.requirements?.requiredVideoIds || []).map((videoId) => (
              <Text key={videoId} style={styles.lockInfoItem}>
                • Complete video: {videoId}
              </Text>
            ))}
            {(quizContent?.requirements?.unlockCriteria?.previousMilestoneId) && (
              <Text style={styles.lockInfoItem}>
                • Complete previous milestone
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={onExit}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isPlaying && quiz) {
    return (
      <QuizPlayer
        questionBank={quiz}
        onComplete={handleQuizComplete}
        onExit={handleQuizExit}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.quizInfo}>
        <Text style={styles.quizTitle}>{milestone.title}</Text>
        <Text style={styles.quizDescription}>Test your knowledge of {milestone.title}</Text>
      </View>
      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartQuiz}
        >
          <Text style={styles.buttonText}>Start Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  lockInfo: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  lockInfoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  lockInfoItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  quizInfo: {
    padding: 20,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 16,
    color: '#666666',
  },
  startButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 