import { Timestamp } from 'firebase/firestore';
import { FirestoreService } from '../../../services/firestoreService';
import { LearningPathProgress, VideoContent, QuizContent } from '../types';
import { MilestoneQuizProgress } from '../types/quizMilestone';
import { VideoProgress } from '../../video/types';
import { doc, getDoc, updateDoc, where, collection, query, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

export interface MilestoneProgress {
  milestoneId: string;
  isCompleted: boolean;
  quizProgress?: MilestoneQuizProgress;
  videoProgress: Record<string, VideoProgress>;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface ProgressAnalytics {
  totalTimeSpentMs: number;
  averageQuizScore: number;
  completedVideos: number;
  totalVideos: number;
  completedQuizzes: number;
  totalQuizzes: number;
  lastAccessedAt: Timestamp;
}

interface MilestoneContent {
  type: string;
  videoId?: string;
}

interface LearningPathMilestone {
  id: string;
  content: MilestoneContent[];
}

export class ProgressTrackingService {
  private db: FirestoreService;

  constructor() {
    this.db = new FirestoreService();
  }

  /**
   * Tracks a quiz attempt and updates overall progress
   */
  async trackQuizAttempt(
    pathId: string,
    milestoneId: string,
    userId: string,
    quizProgress: MilestoneQuizProgress
  ): Promise<void> {
    try {
      console.log(`Tracking quiz attempt for milestone ${milestoneId}`, {
        pathId,
        userId,
        quizProgress
      });
      
      const userPathProgressId = `${userId}_${pathId}`;
      const progressRef = doc(db, `learningPathProgress/${userPathProgressId}`);

      // Get current path progress
      const progressSnap = await getDoc(progressRef);
      const currentProgress = progressSnap.exists() ? progressSnap.data() : {
        userId,
        pathId,
        currentMilestoneId: '',
        completedMilestones: [],
        completedVideos: [],
        quizScores: {},
        startedAt: Timestamp.now(),
        lastAccessedAt: Timestamp.now()
      };

      // Ensure arrays exist
      currentProgress.completedMilestones = currentProgress.completedMilestones || [];
      currentProgress.completedVideos = currentProgress.completedVideos || [];

      console.log('Current path progress:', currentProgress);

      // Get path data to check video completion
      const pathRef = doc(db, `learningPaths/${pathId}`);
      const pathSnap = await getDoc(pathRef);
      const pathData = pathSnap.data();
      
      // Find the milestone
      const milestone = pathData?.milestones?.find((m: LearningPathMilestone) => m.id === milestoneId);
      
      if (milestone) {
        // Check if all required videos in this milestone are completed
        const requiredVideos = milestone.content
          .filter((content: MilestoneContent) => content.type === 'video')
          .map((content: MilestoneContent) => content.videoId)
          .filter(Boolean) as string[];

        const allVideosCompleted = requiredVideos.every(videoId => 
          currentProgress.completedVideos.includes(videoId)
        );

        console.log('Video completion check:', {
          allVideosCompleted,
          requiredVideos,
          completedVideos: currentProgress.completedVideos
        });

        // Update quiz scores
        currentProgress.quizScores = {
          ...currentProgress.quizScores,
          [quizProgress.questionBankId]: quizProgress.bestScore
        };

        // Check if milestone is now completed (all videos + quiz)
        const isMilestoneCompleted = allVideosCompleted && quizProgress.isCompleted;
        
        // Update completedMilestones if needed
        if (isMilestoneCompleted && !currentProgress.completedMilestones.includes(milestoneId)) {
          currentProgress.completedMilestones = [...currentProgress.completedMilestones, milestoneId];
          console.log(`Milestone ${milestoneId} completed and added to completedMilestones`);
        }

        // Save path progress
        const updatedProgress: LearningPathProgress = {
          ...currentProgress,
          lastAccessedAt: Timestamp.now(),
          completedVideos: currentProgress.completedVideos,
          completedMilestones: currentProgress.completedMilestones,
          quizScores: currentProgress.quizScores,
          userId,
          pathId,
          currentMilestoneId: currentProgress.currentMilestoneId || '',
          startedAt: currentProgress.startedAt || Timestamp.now()
        };

        console.log('Saving updated path progress:', {
          progressPath: `learningPathProgress/${userPathProgressId}`,
          completedMilestones: updatedProgress.completedMilestones,
          quizScores: updatedProgress.quizScores,
          isMilestoneCompleted
        });

        await setDoc(
          progressRef,
          updatedProgress,
          { merge: true }
        );

        console.log('Quiz attempt tracked successfully. New state:', {
          milestoneCompleted: isMilestoneCompleted,
          completedMilestones: updatedProgress.completedMilestones,
          quizScores: updatedProgress.quizScores
        });
      } else {
        console.error('Milestone not found:', milestoneId);
      }
    } catch (error) {
      console.error('Error tracking quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Calculates milestone completion status
   */
  async calculateMilestoneStatus(
    milestoneId: string,
    userId: string
  ): Promise<MilestoneProgress> {
    try {
      const milestoneProgress = await this.getMilestoneProgress(milestoneId, userId);
      const quizProgress = await this.db.get<MilestoneQuizProgress>(
        `milestones/${milestoneId}/quizProgress/${userId}`
      );

      return {
        ...milestoneProgress,
        quizProgress: quizProgress || undefined,
        isCompleted: this.checkMilestoneCompletion(milestoneProgress, quizProgress || undefined)
      };
    } catch (error) {
      console.error('Error calculating milestone status:', error);
      throw error;
    }
  }

  /**
   * Updates user progress records
   */
  async updateLearningPathProgress(
    pathId: string,
    userId: string
  ): Promise<LearningPathProgress> {
    try {
      const userPathProgressId = `${userId}_${pathId}`;
      const progress = await this.db.get<LearningPathProgress>(
        `learningPathProgress/${userPathProgressId}`
      ) || {
        userId,
        pathId,
        currentMilestoneId: '',
        completedMilestones: [],
        completedVideos: [],
        quizScores: {},
        startedAt: Timestamp.now(),
        lastAccessedAt: Timestamp.now()
      };

      const milestonesRef = this.db.collection(
        `learningPaths/${pathId}/progress/${userId}/milestones`
      );
      const milestonesSnap = await milestonesRef.get();
      const milestones = milestonesSnap.docs;

      const completedMilestones = milestones
        .filter(doc => doc.data().isCompleted)
        .map(doc => doc.id);

      const analytics = await this.generateProgressAnalytics(pathId, userId);

      const updatedProgress: LearningPathProgress = {
        ...progress,
        completedMilestones,
        lastAccessedAt: Timestamp.now(),
        completedAt: completedMilestones.length === milestones.length ? 
          (progress.completedAt || Timestamp.now()) : undefined
      };

      await this.db.set(
        `learningPathProgress/${userPathProgressId}`,
        updatedProgress
      );

      // Update analytics
      await this.db.set(
        `learningPaths/${pathId}/analytics/${userId}`,
        analytics
      );

      return updatedProgress;
    } catch (error) {
      console.error('Error updating learning path progress:', error);
      throw error;
    }
  }

  /**
   * Generates progress analytics
   */
  async generateProgressAnalytics(
    pathId: string,
    userId: string
  ): Promise<ProgressAnalytics> {
    try {
      const milestones = await this.db.collection(
        `learningPaths/${pathId}/progress/${userId}/milestones`
      ).get();

      let totalTimeSpentMs = 0;
      let totalQuizScore = 0;
      let completedQuizzes = 0;
      let totalQuizzes = 0;
      let completedVideos = 0;
      let totalVideos = 0;

      milestones.docs.forEach(doc => {
        const data = doc.data() as MilestoneProgress;
        
        // Video stats
        Object.values(data.videoProgress).forEach(progress => {
          if (progress.completed) completedVideos++;
          totalVideos++;
          totalTimeSpentMs += progress.timeWatchedMs || 0;
        });

        // Quiz stats
        if (data.quizProgress) {
          totalQuizzes++;
          if (data.quizProgress.isCompleted) {
            completedQuizzes++;
            totalQuizScore += data.quizProgress.bestScore;
          }
        }
      });

      return {
        totalTimeSpentMs,
        averageQuizScore: completedQuizzes > 0 ? totalQuizScore / completedQuizzes : 0,
        completedVideos,
        totalVideos,
        completedQuizzes,
        totalQuizzes,
        lastAccessedAt: Timestamp.now()
      };
    } catch (error) {
      console.error('Error generating progress analytics:', error);
      throw error;
    }
  }

  /**
   * Gets milestone progress
   */
  private async getMilestoneProgress(
    milestoneId: string,
    userId: string
  ): Promise<MilestoneProgress> {
    try {
      const progress = await this.db.get<MilestoneProgress>(
        `milestones/${milestoneId}/progress/${userId}`
      );

      if (!progress) {
        return {
          milestoneId,
          isCompleted: false,
          videoProgress: {},
          startedAt: Timestamp.now()
        };
      }

      return progress;
    } catch (error) {
      console.error('Error getting milestone progress:', error);
      throw error;
    }
  }

  /**
   * Checks if a milestone is completed
   */
  private checkMilestoneCompletion(
    milestoneProgress: MilestoneProgress,
    quizProgress?: MilestoneQuizProgress
  ): boolean {
    // Check video completion
    const allVideosCompleted = Object.values(milestoneProgress.videoProgress)
      .every(progress => progress.completed);

    // Check quiz completion if exists
    const quizCompleted = !quizProgress || quizProgress.isCompleted;

    return allVideosCompleted && quizCompleted;
  }

  /**
   * Update video completion status in learning path progress
   */
  static async updateVideoCompletion(userId: string, pathId: string, videoId: string, completed: boolean): Promise<void> {
    try {
      console.log(`Updating video completion for user ${userId}, video ${videoId}, path ${pathId}`);
      
      // Construct the correct document ID
      const userPathProgressId = `${userId}_${pathId}`;
      const progressRef = doc(db, `learningPathProgress/${userPathProgressId}`);
      
      // Get current progress
      const progressSnap = await getDoc(progressRef);
      const progress = progressSnap.exists() ? progressSnap.data() : {
        userId,
        pathId,
        currentMilestoneId: '',
        completedMilestones: [],
        completedVideos: [],
        quizScores: {},
        startedAt: Timestamp.now(),
        lastAccessedAt: Timestamp.now()
      };

      // Update completedVideos array
      let completedVideos = progress.completedVideos || [];
      if (completed && !completedVideos.includes(videoId)) {
        console.log('Added video to completedVideos:', videoId);
        completedVideos = [...completedVideos, videoId];
      } else if (!completed && completedVideos.includes(videoId)) {
        console.log('Removed video from completedVideos:', videoId);
        completedVideos = completedVideos.filter((id: string) => id !== videoId);
      }

      // Save the updated progress
      console.log('Saving progress to path:', `learningPathProgress/${userPathProgressId}`);
      await setDoc(progressRef, {
        ...progress,
        completedVideos,
        lastAccessedAt: Timestamp.now()
      }, { merge: true });

      console.log('Progress updated successfully. New state:', {
        completedMilestones: progress.completedMilestones,
        completedVideos
      });
    } catch (error) {
      console.error('Error updating video completion:', error);
      throw error;
    }
  }
} 