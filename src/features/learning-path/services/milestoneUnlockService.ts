import { FirestoreService } from '../../../services/firestoreService';
import { Milestone } from '../types';
import { MilestoneQuizProgress, MilestoneQuizRequirements, QuizUnlockResult } from '../types/quizMilestone';
import { VideoProgress } from '../../video/types';

export interface UnlockValidation {
  isUnlocked: boolean;
  reason?: string;
  missingRequirements?: {
    videos?: string[];
    quizzes?: string[];
    previousMilestone?: string;
  };
}

export class MilestoneUnlockService {
  private db: FirestoreService;

  constructor() {
    this.db = new FirestoreService();
  }

  /**
   * Validates quiz prerequisites and unlocks if met
   */
  async validateQuizPrerequisites(
    milestoneId: string,
    userId: string,
    requirements: MilestoneQuizRequirements
  ): Promise<QuizUnlockResult> {
    try {
      const missingPrerequisites: QuizUnlockResult['missingPrerequisites'] = {};

      // Check video completion
      const videoPromises = requirements.requiredVideoIds.map(videoId =>
        this.getVideoProgress(videoId, userId)
      );
      const videoProgress = await Promise.all(videoPromises);
      const missingVideos = requirements.requiredVideoIds.filter(
        (id, index) => !videoProgress[index]?.completed
      );
      if (missingVideos.length > 0) {
        missingPrerequisites.videos = missingVideos;
      }

      // Check previous milestone if required
      if (requirements.unlockCriteria?.previousMilestoneId) {
        const prevMilestone = await this.getMilestoneProgress(
          requirements.unlockCriteria.previousMilestoneId,
          userId
        );
        if (!prevMilestone?.isCompleted) {
          missingPrerequisites.previousMilestone = 
            requirements.unlockCriteria.previousMilestoneId;
        }
      }

      // Check required quizzes
      if (requirements.unlockCriteria?.requiredQuizIds) {
        const quizPromises = requirements.unlockCriteria.requiredQuizIds.map(quizId =>
          this.getQuizProgress(quizId, userId)
        );
        const quizProgress = await Promise.all(quizPromises);
        const missingQuizzes = requirements.unlockCriteria.requiredQuizIds.filter(
          (id, index) => !quizProgress[index]?.isCompleted
        );
        if (missingQuizzes.length > 0) {
          missingPrerequisites.quizzes = missingQuizzes;
        }
      }

      const isUnlocked = Object.keys(missingPrerequisites).length === 0;
      return {
        isUnlocked,
        reason: isUnlocked ? undefined : 'Missing prerequisites',
        missingPrerequisites: isUnlocked ? undefined : missingPrerequisites
      };
    } catch (error) {
      console.error('Error validating quiz prerequisites:', error);
      throw error;
    }
  }

  /**
   * Validates milestone unlock criteria
   */
  async validateMilestoneUnlock(
    milestone: Milestone,
    userId: string
  ): Promise<UnlockValidation> {
    try {
      const missingRequirements: UnlockValidation['missingRequirements'] = {};

      // Check previous milestone completion if required
      if (milestone.unlockCriteria?.previousMilestoneId) {
        const prevProgress = await this.getMilestoneProgress(
          milestone.unlockCriteria.previousMilestoneId,
          userId
        );
        if (!prevProgress?.isCompleted) {
          missingRequirements.previousMilestone = milestone.unlockCriteria.previousMilestoneId;
        }
      }

      // Check required videos
      if (milestone.unlockCriteria?.requiredVideos) {
        const videoPromises = milestone.unlockCriteria.requiredVideos.map(videoId =>
          this.getVideoProgress(videoId, userId)
        );
        const videoProgress = await Promise.all(videoPromises);
        const missingVideos = milestone.unlockCriteria.requiredVideos.filter(
          (id, index) => !videoProgress[index]?.completed
        );
        if (missingVideos.length > 0) {
          missingRequirements.videos = missingVideos;
        }
      }

      // Check required quizzes
      if (milestone.unlockCriteria?.requiredQuizzes) {
        const quizPromises = milestone.unlockCriteria.requiredQuizzes.map(quizId =>
          this.getQuizProgress(quizId, userId)
        );
        const quizProgress = await Promise.all(quizPromises);
        const missingQuizzes = milestone.unlockCriteria.requiredQuizzes.filter(
          (id, index) => !quizProgress[index]?.isCompleted
        );
        if (missingQuizzes.length > 0) {
          missingRequirements.quizzes = missingQuizzes;
        }
      }

      const isUnlocked = Object.keys(missingRequirements).length === 0;
      return {
        isUnlocked,
        reason: isUnlocked ? undefined : 'Missing unlock requirements',
        missingRequirements: isUnlocked ? undefined : missingRequirements
      };
    } catch (error) {
      console.error('Error validating milestone unlock:', error);
      throw error;
    }
  }

  /**
   * Gets video progress
   */
  private async getVideoProgress(
    videoId: string,
    userId: string
  ): Promise<VideoProgress | null> {
    return this.db.get<VideoProgress>(
      `progress/${userId}_${videoId}`
    );
  }

  /**
   * Gets quiz progress
   */
  private async getQuizProgress(
    quizId: string,
    userId: string
  ): Promise<MilestoneQuizProgress | null> {
    return this.db.get<MilestoneQuizProgress>(
      `milestones/${quizId}/quizProgress/${userId}`
    );
  }

  /**
   * Gets milestone progress
   */
  private async getMilestoneProgress(
    milestoneId: string,
    userId: string
  ): Promise<{ isCompleted: boolean } | null> {
    return this.db.get<{ isCompleted: boolean }>(
      `milestones/${milestoneId}/progress/${userId}`
    );
  }
} 