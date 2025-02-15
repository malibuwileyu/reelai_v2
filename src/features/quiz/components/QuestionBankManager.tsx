import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useQuizGeneration } from '../hooks/useQuizGeneration';
import type { QuestionBank, QuizGenerationConfig } from '../types';

interface QuestionBankManagerProps {
  videoId: string;
  videoTitle: string;
  videoDuration: number;
  transcript: string;
  onQuestionBankSelect?: (questionBank: QuestionBank) => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  videoId,
  videoTitle,
  videoDuration,
  transcript,
  onQuestionBankSelect,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    loading: banksLoading,
    error: banksError,
    questionBanks,
    createQuestionBank,
    deleteQuestionBank,
  } = useQuestionBank({ videoId });

  const {
    generateQuestions,
    loading: generationLoading,
    error: generationError,
  } = useQuizGeneration({
    onSuccess: async (questionBank) => {
      try {
        await createQuestionBank(questionBank);
        setIsGenerating(false);
      } catch (error) {
        console.error('Error saving question bank:', error);
        Alert.alert('Error', 'Failed to save generated questions');
      }
    },
    onError: (error) => {
      console.error('Error generating questions:', error);
      Alert.alert('Error', 'Failed to generate questions');
      setIsGenerating(false);
    },
  });

  const handleGenerateQuestions = useCallback(async () => {
    setIsGenerating(true);

    const config: QuizGenerationConfig = {
      targetQuestionCount: 10,
      questionTypes: ['multiple_choice', 'true_false', 'fill_in_blank'],
      difficulty: 'intermediate',
      includeTimestampReferences: true,
      minConfidenceScore: 0.7,
    };

    try {
      await generateQuestions(videoId, transcript, config, {
        videoTitle,
        videoDuration,
      });
    } catch (error) {
      // Error already handled by onError callback
    }
  }, [videoId, videoTitle, videoDuration, transcript, generateQuestions]);

  const handleDeleteBank = useCallback(async (bankId: string) => {
    Alert.alert(
      'Delete Question Bank',
      'Are you sure you want to delete this question bank?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuestionBank(bankId);
              if (selectedBankId === bankId) {
                setSelectedBankId(null);
              }
            } catch (error) {
              console.error('Error deleting question bank:', error);
              Alert.alert('Error', 'Failed to delete question bank');
            }
          },
        },
      ]
    );
  }, [deleteQuestionBank, selectedBankId]);

  const handleBankSelect = useCallback((bank: QuestionBank) => {
    setSelectedBankId(bank.id);
    onQuestionBankSelect?.(bank);
  }, [onQuestionBankSelect]);

  if (banksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (banksError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load question banks</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Question Banks</Text>
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerateQuestions}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Questions</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bankList}>
        {questionBanks.map((bank) => (
          <TouchableOpacity
            key={bank.id}
            style={[
              styles.bankItem,
              selectedBankId === bank.id && styles.selectedBankItem,
            ]}
            onPress={() => handleBankSelect(bank)}
          >
            <View style={styles.bankInfo}>
              <Text style={styles.bankTitle}>
                Question Bank {bank.metadata.generationMethod === 'auto' ? '(Auto)' : '(Manual)'}
              </Text>
              <Text style={styles.bankMetadata}>
                {bank.questions.length} questions • {new Date(bank.createdAt.seconds * 1000).toLocaleDateString()}
              </Text>
              {bank.metadata.averageConfidence && (
                <Text style={styles.confidenceScore}>
                  Confidence: {(bank.metadata.averageConfidence * 100).toFixed(1)}%
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteBank(bank.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {questionBanks.length === 0 && !isGenerating && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No question banks available. Generate questions to get started.
            </Text>
          </View>
        )}
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bankList: {
    flex: 1,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectedBankItem: {
    backgroundColor: '#007AFF10',
  },
  bankInfo: {
    flex: 1,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bankMetadata: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  confidenceScore: {
    fontSize: 14,
    color: '#34C759',
  },
  deleteButton: {
    padding: 8,
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
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
}); 