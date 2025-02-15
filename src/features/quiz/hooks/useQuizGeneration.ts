import { useState, useCallback } from 'react';
import { QuizGenerationService } from '../services/quizGenerationService';
import type { QuestionBank, QuizGenerationConfig } from '../types';

interface UseQuizGenerationProps {
  onSuccess?: (questionBank: QuestionBank) => void;
  onError?: (error: Error) => void;
}

export const useQuizGeneration = ({
  onSuccess,
  onError,
}: UseQuizGenerationProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);

  const generateQuestions = useCallback(async (
    videoId: string,
    transcript: string,
    config: QuizGenerationConfig,
    metadata: {
      videoTitle: string;
      videoDuration: number;
      transcriptId?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const generatedQuestionBank = await QuizGenerationService.generateQuestionBank(
        videoId,
        transcript,
        config,
        metadata
      );

      setQuestionBank(generatedQuestionBank);
      onSuccess?.(generatedQuestionBank);
      return generatedQuestionBank;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate questions');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return {
    generateQuestions,
    loading,
    error,
    questionBank,
  };
}; 