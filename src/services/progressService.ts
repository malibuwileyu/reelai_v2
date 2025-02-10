import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { Progress, ProgressCreate, ProgressUpdate } from '../models/Progress';

const PROGRESS_COLLECTION = 'progress';
const WATCH_HISTORY_COLLECTION = 'watchHistory';
const DAILY_METRICS_COLLECTION = 'dailyWatchMetrics';

export class ProgressService {
  /**
   * Create or update progress for a video
   */
  static async updateProgress(
    userId: string,
    videoId: string,
    watchedSeconds: number,
    lastPosition: number
  ): Promise<void> {
    try {
      const progressRef = doc(db, PROGRESS_COLLECTION, `${userId}_${videoId}`);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        // Create new progress
        const progress: ProgressCreate = {
          userId,
          videoId,
          watchedSeconds,
          lastPosition,
          completed: false
        };
        await setDoc(progressRef, {
          ...progress,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing progress
        const update: ProgressUpdate = {
          watchedSeconds,
          lastPosition,
          updatedAt: Timestamp.now()
        };
        await updateDoc(progressRef, update);
      }

      // Update watch history
      await this.updateWatchHistory(userId, videoId, lastPosition);
      
      // Update daily metrics
      await this.updateDailyMetrics(userId);
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Get progress for a specific video
   */
  static async getProgress(userId: string, videoId: string): Promise<Progress | null> {
    try {
      const progressRef = doc(db, PROGRESS_COLLECTION, `${userId}_${videoId}`);
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        return null;
      }

      return progressDoc.data() as Progress;
    } catch (error) {
      console.error('Error getting progress:', error);
      throw error;
    }
  }

  /**
   * Get all progress for a user
   */
  static async getUserProgress(userId: string): Promise<Progress[]> {
    try {
      const q = query(
        collection(db, PROGRESS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Progress);
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  /**
   * Mark a video as completed
   */
  static async markAsCompleted(userId: string, videoId: string): Promise<void> {
    try {
      const progressRef = doc(db, PROGRESS_COLLECTION, `${userId}_${videoId}`);
      await updateDoc(progressRef, {
        completed: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking video as completed:', error);
      throw error;
    }
  }

  /**
   * Update watch history
   */
  private static async updateWatchHistory(
    userId: string,
    videoId: string,
    lastPosition: number
  ): Promise<void> {
    try {
      const historyRef = doc(db, WATCH_HISTORY_COLLECTION, `${userId}_${videoId}_${Date.now()}`);
      await setDoc(historyRef, {
        userId,
        videoId,
        timestamp: serverTimestamp(),
        lastPosition,
        deviceInfo: {
          platform: 'web', // TODO: Get actual platform
          deviceId: 'unknown', // TODO: Generate device ID
          osVersion: 'unknown', // TODO: Get OS version
          appVersion: 'unknown' // TODO: Get app version
        }
      });
    } catch (error) {
      console.error('Error updating watch history:', error);
      throw error;
    }
  }

  /**
   * Update daily watch metrics
   */
  private static async updateDailyMetrics(userId: string): Promise<void> {
    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const metricsRef = doc(db, DAILY_METRICS_COLLECTION, `${userId}_${dateString}`);
      
      const metricsDoc = await getDoc(metricsRef);
      
      if (!metricsDoc.exists()) {
        await setDoc(metricsRef, {
          userId,
          date: Timestamp.fromDate(today),
          watchCount: 1,
          lastUpdated: serverTimestamp()
        });
      } else {
        await updateDoc(metricsRef, {
          watchCount: metricsDoc.data().watchCount + 1,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating daily metrics:', error);
      throw error;
    }
  }
} 