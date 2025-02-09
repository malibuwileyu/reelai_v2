import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '../../providers/NavigationProvider';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizScreenProps {
  subjectId: string;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ subjectId }) => {
  const { navigate } = useNavigation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Mock questions - replace with actual data from backend
  const questions: QuizQuestion[] = [
    {
      id: '1',
      question: 'What is the main purpose of React Native?',
      options: [
        'To build native mobile apps',
        'To build web applications',
        'To build desktop applications',
        'To build server applications'
      ],
      correctAnswer: 0
    },
    {
      id: '2',
      question: 'Which company developed React Native?',
      options: [
        'Google',
        'Apple',
        'Facebook',
        'Microsoft'
      ],
      correctAnswer: 2
    },
  ];

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (showResults) return;

    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answerIndex;
      return newAnswers;
    });
  }, [currentQuestionIndex, showResults]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  }, [currentQuestionIndex, questions.length]);

  const calculateScore = useCallback(() => {
    return questions.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
  }, [questions, selectedAnswers]);

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnsweredCurrent = selectedAnswers[currentQuestionIndex] !== undefined;

  if (showResults) {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Results</Text>
        <View style={styles.resultsContainer}>
          <Text style={styles.scoreText}>
            Score: {score}/{questions.length} ({percentage.toFixed(1)}%)
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigate('learn')}
          >
            <Text style={styles.buttonText}>Back to Learning</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        Question {currentQuestionIndex + 1} of {questions.length}
      </Text>
      <Text style={styles.question}>{currentQuestion.question}</Text>
      <ScrollView style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswers[currentQuestionIndex] === index && styles.selectedOption,
              showResults && index === currentQuestion.correctAnswer && styles.correctOption,
              showResults && selectedAnswers[currentQuestionIndex] === index && 
              index !== currentQuestion.correctAnswer && styles.incorrectOption,
            ]}
            onPress={() => handleSelectAnswer(index)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {hasAnsweredCurrent && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleNextQuestion}
        >
          <Text style={styles.buttonText}>
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Show Results'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  progress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  optionsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  correctOption: {
    backgroundColor: '#34C75920',
    borderColor: '#34C759',
    borderWidth: 1,
  },
  incorrectOption: {
    backgroundColor: '#FF3B3020',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 