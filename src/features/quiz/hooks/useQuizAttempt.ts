import { useState, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import type { QuizAttempt, Question } from '../types';

interface UseQuizAttemptProps {
  userId: string;
  quizId: string;
  onError?: (error: Error) => void;
}

export const useQuizAttempt = ({
  userId,
  quizId,
  onError,
}: UseQuizAttemptProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);

  // Start a new quiz attempt
  const startAttempt = useCallback(async (questions: Question[]) => {
    setLoading(true);
    setError(null);

    try {
      const attempt: Omit<QuizAttempt, 'id'> = {
        userId,
        quizId,
        questionBankId: quizId,
        questions,
        answers: {},
        score: 0,
        startedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'quizAttempts'), attempt);
      const newAttempt = { ...attempt, id: docRef.id } as QuizAttempt;
      setCurrentAttempt(newAttempt);
      return newAttempt;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start quiz attempt');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, quizId, onError]);

  // Submit answers for the current attempt
  const submitAttempt = useCallback(async (
    answers: Record<string, any>,
    score: number
  ) => {
    if (!currentAttempt) {
      throw new Error('No active quiz attempt');
    }

    setLoading(true);
    setError(null);

    try {
      const completedAttempt: QuizAttempt = {
        ...currentAttempt,
        answers,
        score,
        completedAt: Timestamp.now(),
        timeSpentMs: Timestamp.now().toMillis() - currentAttempt.startedAt.toMillis(),
      };

      const docRef = doc(db, 'quizAttempts', currentAttempt.id);
      await updateDoc(docRef, {
        answers,
        score,
        completedAt: Timestamp.now(),
        timeSpentMs: Timestamp.now().toMillis() - currentAttempt.startedAt.toMillis(),
      });

      setCurrentAttempt(completedAttempt);
      setPreviousAttempts(prev => [completedAttempt, ...prev]);
      return completedAttempt;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit quiz attempt');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentAttempt, onError]);

  // Load previous attempts for this quiz
  const loadPreviousAttempts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'quizAttempts'),
        where('userId', '==', userId),
        where('quizId', '==', quizId),
        where('completedAt', '!=', null),
        orderBy('completedAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const attempts = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as QuizAttempt[];

      setPreviousAttempts(attempts);
      return attempts;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load previous attempts');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, quizId, onError]);

  // Get the best attempt for this quiz
  const getBestAttempt = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'quizAttempts'),
        where('userId', '==', userId),
        where('quizId', '==', quizId),
        where('completedAt', '!=', null),
        orderBy('score', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      const bestAttempt = querySnapshot.docs[0]?.data() as QuizAttempt | undefined;

      return bestAttempt || null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get best attempt');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, quizId, onError]);

  // Get attempt statistics
  const getAttemptStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'quizAttempts'),
        where('userId', '==', userId),
        where('quizId', '==', quizId),
        where('completedAt', '!=', null)
      );

      const querySnapshot = await getDocs(q);
      const attempts = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);

      if (attempts.length === 0) {
        return null;
      }

      const totalAttempts = attempts.length;
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
      const averageScore = totalScore / totalAttempts;
      const bestScore = Math.max(...attempts.map(attempt => attempt.score));
      const averageTimeMs = attempts.reduce((sum, attempt) => sum + (attempt.timeSpentMs || 0), 0) / totalAttempts;

      return {
        totalAttempts,
        averageScore,
        bestScore,
        averageTimeMs,
        lastAttemptAt: attempts[0].completedAt,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get attempt statistics');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, quizId, onError]);

  return {
    loading,
    error,
    currentAttempt,
    previousAttempts,
    startAttempt,
    submitAttempt,
    loadPreviousAttempts,
    getBestAttempt,
    getAttemptStats,
  };
}; 