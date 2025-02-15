import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  Question,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  TimestampReferenceQuestion,
  QuestionBank,
} from '../types';

interface QuizPlayerProps {
  questionBank: QuestionBank;
  onComplete?: (score: number, answers: Record<string, any>) => void;
  onExit?: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  questionBank,
  onComplete,
  onExit,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const questions = useMemo(() => questionBank.questions, [questionBank]);
  const currentQuestion = questions[currentQuestionIndex];
  const hasAnsweredCurrent = answers[currentQuestion.id] !== undefined;

  const calculateScore = useCallback(() => {
    let correctCount = 0;
    let totalQuestions = questions.length;

    questions.forEach((question) => {
      const answer = answers[question.id];
      if (answer === undefined) return;

      switch (question.type) {
        case 'multiple_choice':
        case 'timestamp_reference':
          if (answer === (question as MultipleChoiceQuestion | TimestampReferenceQuestion).correctOptionIndex) {
            correctCount++;
          }
          break;
        case 'true_false':
          if (answer === (question as TrueFalseQuestion).correctAnswer) {
            correctCount++;
          }
          break;
        case 'fill_in_blank':
          const fillInBlankQuestion = question as FillInBlankQuestion;
          const isCorrect = fillInBlankQuestion.acceptableAnswers
            ? fillInBlankQuestion.acceptableAnswers.includes(answer.toLowerCase())
            : answer.toLowerCase() === fillInBlankQuestion.correctAnswer.toLowerCase();
          if (isCorrect) {
            correctCount++;
          }
          break;
      }
    });

    return (correctCount / totalQuestions) * 100;
  }, [questions, answers]);

  const handleAnswer = useCallback((answer: any) => {
    if (isComplete) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  }, [currentQuestion, isComplete]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else if (!isComplete) {
      const score = calculateScore();
      setIsComplete(true);
      onComplete?.(score, answers);
    }
  }, [currentQuestionIndex, questions.length, isComplete, calculateScore, answers, onComplete]);

  const renderQuestion = useCallback((question: Question) => {
    const answer = answers[question.id];
    const isAnswered = answer !== undefined;

    switch (question.type) {
      case 'multiple_choice':
      case 'timestamp_reference':
        const mcQuestion = question as MultipleChoiceQuestion | TimestampReferenceQuestion;
        return (
          <>
            <Text style={styles.question}>{question.question}</Text>
            <View style={styles.optionsContainer}>
              {mcQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    isAnswered && answer === index && styles.selectedOption,
                    showExplanation && index === mcQuestion.correctOptionIndex && styles.correctOption,
                    showExplanation && answer === index && index !== mcQuestion.correctOptionIndex && styles.incorrectOption,
                  ]}
                  onPress={() => handleAnswer(index)}
                  disabled={showExplanation}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'true_false':
        const tfQuestion = question as TrueFalseQuestion;
        return (
          <>
            <Text style={styles.question}>{question.question}</Text>
            <View style={styles.optionsContainer}>
              {['True', 'False'].map((option, index) => {
                const value = index === 0;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      isAnswered && answer === value && styles.selectedOption,
                      showExplanation && value === tfQuestion.correctAnswer && styles.correctOption,
                      showExplanation && answer === value && value !== tfQuestion.correctAnswer && styles.incorrectOption,
                    ]}
                    onPress={() => handleAnswer(value)}
                    disabled={showExplanation}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        );

      case 'fill_in_blank':
        const fibQuestion = question as FillInBlankQuestion;
        return (
          <>
            <Text style={styles.question}>
              {fibQuestion.textBefore}
              <Text style={styles.blank}>_____</Text>
              {fibQuestion.textAfter}
            </Text>
            <TextInput
              style={[
                styles.input,
                showExplanation && (
                  fibQuestion.acceptableAnswers?.includes(answer?.toLowerCase()) ||
                  answer?.toLowerCase() === fibQuestion.correctAnswer.toLowerCase()
                ) ? styles.correctInput : styles.incorrectInput,
              ]}
              placeholder="Type your answer"
              value={answer}
              onChangeText={handleAnswer}
              editable={!showExplanation}
            />
          </>
        );

      default:
        return null;
    }
  }, [answers, showExplanation, handleAnswer]);

  if (isComplete) {
    const score = calculateScore();
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz Complete</Text>
        </View>
        <View style={styles.resultContainer}>
          <Text style={styles.scoreText}>Your Score</Text>
          <Text style={styles.score}>{score.toFixed(1)}%</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onExit}
          >
            <Text style={styles.buttonText}>Exit Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => {
            Alert.alert(
              'Exit Quiz',
              'Are you sure you want to exit? Your progress will be lost.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Exit',
                  style: 'destructive',
                  onPress: onExit,
                },
              ]
            );
          }}
        >
          <Ionicons name="close" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.contentContainer}>
          <View style={styles.questionContainer}>
            {renderQuestion(currentQuestion)}
          </View>

          <View style={styles.buttonContainer}>
            {hasAnsweredCurrent && !showExplanation && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowExplanation(true)}
              >
                <Text style={styles.buttonText}>Check Answer</Text>
              </TouchableOpacity>
            )}

            {showExplanation && (
              <>
                {currentQuestion.explanation && (
                  <View style={styles.explanation}>
                    <Text style={styles.explanationTitle}>Explanation</Text>
                    <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.nextButton]}
                  onPress={handleNext}
                >
                  <Text style={styles.buttonText}>
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 20,
    fontWeight: '600',
  },
  exitButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  questionContainer: {
    marginBottom: 16,
  },
  question: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    backgroundColor: '#F8F8F8',
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
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 8,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  explanation: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#666666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  correctInput: {
    borderColor: '#34C759',
    backgroundColor: '#34C75910',
  },
  incorrectInput: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B3010',
  },
  blank: {
    color: '#007AFF',
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  score: {
    fontSize: 48,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 32,
  },
}); 