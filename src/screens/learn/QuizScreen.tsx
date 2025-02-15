import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useNavigation } from '../../providers/NavigationProvider';
import { QuizPlayer } from '../../features/quiz/components/QuizPlayer';
import { useQuizAttempt } from '../../features/quiz/hooks/useQuizAttempt';
import { QuizMilestoneService } from '../../features/learning-path/services/quizMilestoneService';
import type { QuestionBank } from '../../features/quiz/types';
import { useAuthContext } from '../../providers/AuthProvider';

interface QuizScreenProps {
  subjectId: string;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ subjectId }) => {
  const { navigate } = useNavigation();
  const { user } = useAuthContext();
  const [quiz, setQuiz] = useState<QuestionBank | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const {
    startAttempt,
    submitAttempt,
  } = useQuizAttempt({
    userId: user?.uid || '',
    quizId: quiz?.id || '',
    onError: (error) => {
      console.error('Quiz attempt error:', error);
      Alert.alert('Error', 'Failed to save quiz progress');
    },
  });

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
      await submitAttempt(answers, score);
      Alert.alert(
        'Quiz Complete',
        `You scored ${score.toFixed(1)}%`,
        [
          {
            text: 'Close',
            onPress: () => {
              setIsPlaying(false);
              navigate('learn');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      Alert.alert('Error', 'Failed to save quiz results');
    }
  }, [submitAttempt, navigate]);

  const handleQuizExit = useCallback(() => {
    setIsPlaying(false);
    navigate('learn');
  }, [navigate]);

  // Load quiz data
  React.useEffect(() => {
    const loadQuiz = async () => {
      try {
        console.log('🎯 Loading quiz for subject:', subjectId);
        const quizData = await QuizMilestoneService.getQuiz(subjectId);
        if (!quizData) {
          Alert.alert('Error', 'Quiz not found');
          navigate('learn');
          return;
        }
        setQuiz(quizData);
        console.log('📚 Loaded quiz data:', quizData);
      } catch (error) {
        console.error('Error loading quiz:', error);
        Alert.alert('Error', 'Failed to load quiz');
        navigate('learn');
      }
    };

    loadQuiz();
  }, [subjectId, navigate]);

  if (!quiz || !user) return null;

  return (
    <Layout showBackButton children={
      <QuizPlayer
        questionBank={quiz}
        onComplete={handleQuizComplete}
        onExit={handleQuizExit}
      />
    } />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 