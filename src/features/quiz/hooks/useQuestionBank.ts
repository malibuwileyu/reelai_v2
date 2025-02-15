import { useState, useCallback, useEffect } from 'react';
import { QuestionBankService } from '../services/questionBankService';
import type { QuestionBank } from '../types';

interface UseQuestionBankProps {
  videoId?: string;
  questionBankId?: string;
  onError?: (error: Error) => void;
}

export const useQuestionBank = ({
  videoId,
  questionBankId,
  onError,
}: UseQuestionBankProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [currentQuestionBank, setCurrentQuestionBank] = useState<QuestionBank | null>(null);

  // Fetch question banks for a video
  const fetchQuestionBanks = useCallback(async (videoId: string) => {
    setLoading(true);
    setError(null);

    try {
      const banks = await QuestionBankService.getQuestionBanksForVideo(videoId);
      setQuestionBanks(banks);
      return banks;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch question banks');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Fetch a specific question bank
  const fetchQuestionBank = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const bank = await QuestionBankService.getQuestionBank(id);
      setCurrentQuestionBank(bank);
      return bank;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch question bank');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Create a new question bank
  const createQuestionBank = useCallback(async (questionBank: Omit<QuestionBank, 'id'>) => {
    setLoading(true);
    setError(null);

    try {
      const newBank = await QuestionBankService.createQuestionBank(questionBank);
      setQuestionBanks(prev => [...prev, newBank]);
      setCurrentQuestionBank(newBank);
      return newBank;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create question bank');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Update a question bank
  const updateQuestionBank = useCallback(async (
    id: string,
    updates: Partial<Omit<QuestionBank, 'id' | 'createdAt'>>
  ) => {
    setLoading(true);
    setError(null);

    try {
      await QuestionBankService.updateQuestionBank(id, updates);
      
      // Update local state
      setQuestionBanks(prev => prev.map(bank => 
        bank.id === id ? { ...bank, ...updates } : bank
      ));
      
      if (currentQuestionBank?.id === id) {
        setCurrentQuestionBank(prev => prev ? { ...prev, ...updates } : prev);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update question bank');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentQuestionBank, onError]);

  // Delete a question bank
  const deleteQuestionBank = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await QuestionBankService.deleteQuestionBank(id);
      
      // Update local state
      setQuestionBanks(prev => prev.filter(bank => bank.id !== id));
      if (currentQuestionBank?.id === id) {
        setCurrentQuestionBank(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete question bank');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentQuestionBank, onError]);

  // Search question banks
  const searchQuestionBanks = useCallback(async (criteria: {
    generationMethod?: 'auto' | 'manual' | 'hybrid';
    minConfidence?: number;
    videoTitle?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const banks = await QuestionBankService.searchQuestionBanks(criteria);
      setQuestionBanks(banks);
      return banks;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to search question banks');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Load initial data
  useEffect(() => {
    if (videoId) {
      fetchQuestionBanks(videoId);
    } else if (questionBankId) {
      fetchQuestionBank(questionBankId);
    }
  }, [videoId, questionBankId, fetchQuestionBanks, fetchQuestionBank]);

  return {
    loading,
    error,
    questionBanks,
    currentQuestionBank,
    fetchQuestionBanks,
    fetchQuestionBank,
    createQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    searchQuestionBanks,
  };
}; 