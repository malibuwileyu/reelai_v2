import { Timestamp } from 'firebase/firestore';

/**
 * Learning path difficulty levels
 */
export type LearningPathDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Core learning path structure
 */
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: LearningPathDifficulty;
  estimatedHours: number;
  prerequisites?: string[];
  milestones: Milestone[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creatorId: string;
  isPublic: boolean;
  category: string;
  tags: string[];
}

/**
 * Milestone structure within a learning path
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  order: number;
  content: (VideoContent | QuizContent)[];
  requiredScore: number;
  unlockCriteria: {
    previousMilestoneId?: string;
    requiredVideos: string[];
    requiredQuizzes: string[];
  };
}

/**
 * Video content type
 */
export interface VideoContent {
  type: 'video';
  videoId: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isRequired: boolean;
}

/**
 * Quiz content type
 */
export interface QuizContent {
  type: 'quiz';
  quizId: string;
  title: string;
  description: string;
  timeLimit?: number;
  passingScore: number;
  order: number;
  isRequired: boolean;
}

/**
 * User progress tracking for learning paths
 */
export interface LearningPathProgress {
  userId: string;
  pathId: string;
  currentMilestoneId: string;
  completedMilestones: string[];
  completedVideos: string[];
  quizScores: Record<string, number>;
  startedAt: Timestamp;
  lastAccessedAt: Timestamp;
  completedAt?: Timestamp;
} 