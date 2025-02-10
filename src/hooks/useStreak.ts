import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../providers/AuthProvider';
import { StreakService } from '../services/streakService';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWatchedDate?: string;
  loading: boolean;
  error: Error | null;
}

export const useStreak = () => {
  const { user } = useAuthContext();
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    lastWatchedDate: undefined,
    loading: true,
    error: null,
  });
  const [optimisticStreak, setOptimisticStreak] = useState<number | null>(null);

  const loadStreakInfo = useCallback(async () => {
    if (!user) {
      setStreakInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStreakInfo(prev => ({ ...prev, loading: true }));
      const info = await StreakService.getStreakInfo(user.uid);
      setStreakInfo({
        ...info,
        loading: false,
        error: null,
      });

      // Reset optimistic streak when we get real data
      setOptimisticStreak(null);
    } catch (error) {
      setStreakInfo(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [user]);

  // Calculate if we should increment the streak optimistically
  const updateOptimisticStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastWatched = streakInfo.lastWatchedDate;

    if (!lastWatched || lastWatched !== today) {
      // If no watch today, we can increment
      const newStreak = lastWatched ? 
        // If watched yesterday, increment current streak
        (isYesterday(lastWatched) ? streakInfo.currentStreak + 1 : 1) :
        // If never watched or not yesterday, start new streak
        1;
      
      setOptimisticStreak(newStreak);
      return newStreak;
    }
    return null;
  }, [streakInfo.currentStreak, streakInfo.lastWatchedDate]);

  useEffect(() => {
    loadStreakInfo();
  }, [loadStreakInfo]);

  // Helper function to check if a date was yesterday
  const isYesterday = (dateStr: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0] === dateStr;
  };

  return {
    currentStreak: optimisticStreak ?? streakInfo.currentStreak,
    longestStreak: Math.max(
      streakInfo.longestStreak,
      optimisticStreak ?? streakInfo.currentStreak
    ),
    lastWatchedDate: streakInfo.lastWatchedDate,
    loading: streakInfo.loading,
    error: streakInfo.error,
    refresh: loadStreakInfo,
    updateOptimisticStreak
  };
}; 