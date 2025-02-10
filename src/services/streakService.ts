import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../constants';

export class StreakService {
  /**
   * Update user's watch streak when they watch a video
   * @param userId The user's ID
   * @returns Promise<void>
   */
  static async updateStreak(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastWatchedDate = userData.lastWatchedDate;
      let { currentStreak = 0, longestStreak = 0 } = userData;

      if (!lastWatchedDate) {
        // First time watching
        currentStreak = 1;
        longestStreak = 1;
      } else if (lastWatchedDate === today) {
        // Already watched today, no streak update needed
        return;
      } else {
        const lastWatched = new Date(lastWatchedDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastWatchedDate === yesterdayStr) {
          // Watched yesterday, increment streak
          currentStreak += 1;
          longestStreak = Math.max(currentStreak, longestStreak);
        } else {
          // Streak broken
          currentStreak = 1;
        }
      }

      // Update user document with ONLY the allowed fields
      await updateDoc(userRef, {
        lastWatchedDate: today,
        currentStreak,
        longestStreak,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  /**
   * Get user's current streak information
   * @param userId The user's ID
   * @returns Promise with streak info
   */
  static async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastWatchedDate?: string;
  }> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      return {
        currentStreak: userData.currentStreak || 0,
        longestStreak: userData.longestStreak || 0,
        lastWatchedDate: userData.lastWatchedDate
      };
    } catch (error) {
      console.error('Error getting streak info:', error);
      throw error;
    }
  }

  /**
   * Force update user's streak for testing purposes
   * @param userId The user's ID
   * @returns Promise<void>
   */
  static async forceUpdateStreak(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      let { currentStreak = 0, longestStreak = 0 } = userData;

      // Always increment streak
      currentStreak += 1;
      longestStreak = Math.max(currentStreak, longestStreak);

      // Update user document
      await updateDoc(userRef, {
        lastWatchedDate: new Date().toISOString().split('T')[0],
        currentStreak,
        longestStreak,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error forcing streak update:', error);
      throw error;
    }
  }
} 