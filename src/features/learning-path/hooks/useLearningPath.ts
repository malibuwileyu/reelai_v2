import { useState, useCallback, useEffect } from 'react';
import { LearningPath, LearningPathProgress } from '../types';
import { LearningPathService } from '../services/learningPathService';
import { useAuth } from '../../../hooks/useAuth';

interface UseLearningPathReturn {
  path: LearningPath | null;
  progress: LearningPathProgress | null;
  isLoading: boolean;
  error: Error | null;
  updateProgress: (updates: Partial<LearningPathProgress>) => Promise<void>;
}

/**
 * Custom hook for managing a learning path and user progress
 */
export const useLearningPath = (pathId: string): UseLearningPathReturn => {
  const { user } = useAuth();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [progress, setProgress] = useState<LearningPathProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch learning path and progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching learning path:', pathId);
        console.log('👤 Current user:', user?.uid);
        setIsLoading(true);
        setError(null);

        // Get learning path
        const pathData = await LearningPathService.getPath(pathId);
        console.log('📚 Path data:', pathData);
        setPath(pathData);

        // Get progress if user is authenticated
        if (user) {
          console.log('🎯 Fetching progress for user:', user.uid);
          const progressData = await LearningPathService.getProgress(user.uid, pathId);
          console.log('📊 Progress data:', progressData);
          setProgress(progressData);
        }
      } catch (err) {
        console.error('❌ Error in useLearningPath:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch learning path'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pathId, user]);

  // Update progress handler
  const updateProgress = useCallback(
    async (updates: Partial<LearningPathProgress>) => {
      if (!user) {
        throw new Error('User must be authenticated to update progress');
      }

      try {
        console.log('✏️ Updating progress:', updates);
        await LearningPathService.updateProgress(user.uid, pathId, updates);
        setProgress(prev => prev ? { ...prev, ...updates } : null);
        console.log('✅ Progress updated successfully');
      } catch (err) {
        console.error('❌ Error updating progress:', err);
        throw err instanceof Error ? err : new Error('Failed to update progress');
      }
    },
    [pathId, user]
  );

  return {
    path,
    progress,
    isLoading,
    error,
    updateProgress
  };
}; 