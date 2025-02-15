import { useState, useCallback, useEffect } from 'react';
import { MilestoneUnlockService } from '../services/milestoneUnlockService';
import { ProgressTrackingService } from '../services/progressTrackingService';
import type { Milestone } from '../types';
import type { MilestoneQuizProgress, MilestoneQuizRequirements } from '../types/quizMilestone';

interface UseMilestoneQuizProps {
  milestone: Milestone;
  userId: string;
  pathId: string;
  onError?: (error: Error) => void;
}

interface UnlockStatus {
  quizId: string;
  isUnlocked: boolean;
  reason?: string;
}

export const useMilestoneQuiz = ({
  milestone,
  userId,
  pathId,
  onError,
}: UseMilestoneQuizProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [quizProgress, setQuizProgress] = useState<Record<string, MilestoneQuizProgress>>({});
  const [unlockedQuizIds, setUnlockedQuizIds] = useState<string[]>([]);

  const unlockService = new MilestoneUnlockService();
  const progressService = new ProgressTrackingService();

  // Load quiz progress and check unlock status
  useEffect(() => {
    const loadQuizStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!milestone.quizzes || milestone.quizzes.length === 0) {
          return;
        }

        // Check unlock status for each quiz
        const unlockPromises = milestone.quizzes.map(async (quiz) => {
          const requirements = quiz.requirements as MilestoneQuizRequirements;
          const unlockResult = await unlockService.validateQuizPrerequisites(
            milestone.id,
            userId,
            requirements
          );

          return {
            quizId: quiz.id,
            isUnlocked: unlockResult.isUnlocked,
            reason: unlockResult.reason,
          } as UnlockStatus;
        });

        const unlockStatuses = await Promise.all(unlockPromises);
        setUnlockedQuizIds(
          unlockStatuses
            .filter(status => status.isUnlocked)
            .map(status => status.quizId)
        );

        // Load progress for each quiz
        const progressPromises = milestone.quizzes.map(async (quiz) => {
          const progress = await progressService.calculateMilestoneStatus(
            milestone.id,
            userId
          );

          return {
            quizId: quiz.id,
            progress: progress.quizProgress,
          };
        });

        const progressResults = await Promise.all(progressPromises);
        const progressMap: Record<string, MilestoneQuizProgress> = {};
        progressResults.forEach(({ quizId, progress }) => {
          if (progress) {
            progressMap[quizId] = progress;
          }
        });

        setQuizProgress(progressMap);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load quiz status');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    loadQuizStatus();
  }, [milestone, userId, unlockService, progressService, onError]);

  // Update quiz progress
  const updateQuizProgress = useCallback(async (
    quizId: string,
    progress: MilestoneQuizProgress
  ) => {
    try {
      await progressService.trackQuizAttempt(
        pathId,
        milestone.id,
        userId,
        progress
      );

      setQuizProgress(prev => ({
        ...prev,
        [quizId]: progress,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update quiz progress');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [pathId, milestone.id, userId, progressService, onError]);

  // Check if all quizzes are completed
  const areAllQuizzesCompleted = useCallback(() => {
    if (!milestone.quizzes || milestone.quizzes.length === 0) {
      return true;
    }

    return milestone.quizzes.every(quiz => 
      quizProgress[quiz.id]?.isCompleted
    );
  }, [milestone.quizzes, quizProgress]);

  // Get quiz requirements
  const getQuizRequirements = useCallback((quizId: string) => {
    const quiz = milestone.quizzes?.find(q => q.id === quizId);
    return quiz?.requirements;
  }, [milestone.quizzes]);

  return {
    loading,
    error,
    quizProgress,
    unlockedQuizIds,
    updateQuizProgress,
    areAllQuizzesCompleted,
    getQuizRequirements,
  };
}; 