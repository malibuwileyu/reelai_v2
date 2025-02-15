import { Timestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import type { VideoProgress } from '../types';

export class VideoProgressService {
  static async initializeProgress(videoId: string, userId: string): Promise<void> {
    const progressRef = doc(db, `progress/${userId}_${videoId}`);
    await setDoc(progressRef, {
      videoId,
      userId,
      completed: false,
      lastPosition: 0,
      timeWatchedMs: 0,
      lastWatchedAt: Timestamp.now(),
    } as VideoProgress);
  }

  static async markVideoAsCompleted(videoId: string, userId: string): Promise<void> {
    try {
      const progressRef = doc(db, `progress/${userId}_${videoId}`);
      await setDoc(progressRef, {
        videoId,
        userId,
        completed: true,
        lastPosition: 0,
        timeWatchedMs: 0,
        lastWatchedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      } as VideoProgress, { merge: true });
    } catch (error) {
      console.error('Error marking video as completed:', error);
      throw error;
    }
  }

  static async updateProgress(
    videoId: string,
    userId: string,
    position: number,
    timeWatchedMs: number
  ): Promise<void> {
    const progressRef = doc(db, `progress/${userId}_${videoId}`);
    await setDoc(progressRef, {
      videoId,
      userId,
      lastPosition: position,
      timeWatchedMs,
      lastWatchedAt: Timestamp.now(),
    } as Partial<VideoProgress>, { merge: true });
  }
} 