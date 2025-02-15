import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '../../providers/NavigationProvider';
import { QuestionBankManager } from '../../features/quiz/components/QuestionBankManager';
import { QuizPlayer } from '../../features/quiz/components/QuizPlayer';
import { QuizAttemptHistory } from '../../features/quiz/components/QuizAttemptHistory';
import { useQuizAttempt } from '../../features/quiz/hooks/useQuizAttempt';
import type { QuestionBank } from '../../features/quiz/types';

interface QuizScreenProps {
  videoId: string;
  videoTitle: string;
  videoDuration: number;
  transcript: string;
  userId: string;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  videoId,
  videoTitle,
  videoDuration,
  transcript,
  userId,
}) => {
  const navigation = useNavigation();
  const [selectedQuestionBank, setSelectedQuestionBank] = useState<QuestionBank | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    startAttempt,
    submitAttempt,
  } = useQuizAttempt({
    userId,
    quizId: selectedQuestionBank?.id || '',
    onError: (error) => {
      console.error('Quiz attempt error:', error);
      Alert.alert('Error', 'Failed to save quiz progress');
    },
  });

  const handleQuestionBankSelect = useCallback((bank: QuestionBank) => {
    setSelectedQuestionBank(bank);
  }, []);

  const handleStartQuiz = useCallback(async () => {
    if (!selectedQuestionBank) return;

    try {
      await startAttempt(selectedQuestionBank.questions);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      Alert.alert('Error', 'Failed to start quiz');
    }
  }, [selectedQuestionBank, startAttempt]);

  const handleQuizComplete = useCallback(async (score: number, answers: Record<string, any>) => {
    try {
      await submitAttempt(answers, score);
      Alert.alert(
        'Quiz Complete',
        `You scored ${score.toFixed(1)}%`,
        [
          {
            text: 'View History',
            onPress: () => setShowHistory(true),
          },
          {
            text: 'Close',
            onPress: () => {
              setIsPlaying(false);
              setSelectedQuestionBank(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      Alert.alert('Error', 'Failed to save quiz results');
    }
  }, [submitAttempt]);

  const handleQuizExit = useCallback(() => {
    setIsPlaying(false);
    setSelectedQuestionBank(null);
  }, []);

  if (showHistory) {
    return (
      <QuizAttemptHistory
        userId={userId}
        quizId={selectedQuestionBank?.id || ''}
      />
    );
  }

  if (isPlaying && selectedQuestionBank) {
    return (
      <QuizPlayer
        questionBank={selectedQuestionBank}
        onComplete={handleQuizComplete}
        onExit={handleQuizExit}
      />
    );
  }

  return (
    <View style={styles.container}>
      <QuestionBankManager
        videoId={videoId}
        videoTitle={videoTitle}
        videoDuration={videoDuration}
        transcript={transcript}
        onQuestionBankSelect={handleQuestionBankSelect}
      />
      {selectedQuestionBank && !isPlaying && (
        <View style={styles.startButtonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startButtonText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  startButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 