import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../providers/AuthProvider';
import { ProgressService } from '../services/progressService';
import { Progress } from '../models/Progress';

interface UseProgressResult {
  progress: Progress | null;
  loading: boolean;
  error: Error | null;
  updateProgress: (watchedSeconds: number, lastPosition: number) => Promise<void>;
  markAsCompleted: () => Promise<void>;
}

export function useProgress(videoId: string): UseProgressResult {
  const { user } = useAuthContext();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial progress
  useEffect(() => {
    let mounted = true;

    const loadProgress = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const videoProgress = await ProgressService.getProgress(user.uid, videoId);
        if (mounted) {
          setProgress(videoProgress);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      mounted = false;
    };
  }, [user, videoId]);

  // Update progress
  const updateProgress = useCallback(async (
    watchedSeconds: number,
    lastPosition: number
  ) => {
    if (!user) return;

    try {
      await ProgressService.updateProgress(
        user.uid,
        videoId,
        watchedSeconds,
        lastPosition
      );
      
      // Update local state
      setProgress(prev => prev ? {
        ...prev,
        watchedSeconds,
        lastPosition
      } : null);
      
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [user, videoId]);

  // Mark video as completed
  const markAsCompleted = useCallback(async () => {
    if (!user) return;

    try {
      await ProgressService.markAsCompleted(user.uid, videoId);
      
      // Update local state
      setProgress(prev => prev ? {
        ...prev,
        completed: true
      } : null);
      
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [user, videoId]);

  return {
    progress,
    loading,
    error,
    updateProgress,
    markAsCompleted
  };
} 