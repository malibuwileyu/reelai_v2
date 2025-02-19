import { Timestamp } from 'firebase/firestore';
import { MilestoneQuizRequirements } from './quizMilestone';

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
  isPublished: boolean;
  publishedAt?: Timestamp;
}

/**
 * Milestone structure within a learning path
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  order: number;
  content: Array<VideoContent | QuizContent>;
  quiz?: {
    id: string;
    videoId: string;
    transcript?: string;
    requirements: MilestoneQuizRequirements;
  };
  quizzes?: Array<{
    id: string;
    videoId: string;
    transcript?: string;
    requirements: MilestoneQuizRequirements;
  }>;
  unlockCriteria?: {
    previousMilestoneId?: string;
    requiredVideos?: string[];
    requiredQuizzes?: string[];
    requiredScore?: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creatorId: string;
  isPublished: boolean;
  publishedAt?: Timestamp;
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
  videoUrl: string;
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

export interface VideoBookmark {
  id: string;
  userId: string;
  videoId: string;
  timestamp: number;  // Position in video (milliseconds)
  label: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VideoNote {
  id: string;
  userId: string;
  videoId: string;
  timestamp: number;  // Position in video (milliseconds)
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VideoTranscript {
  videoId: string;
  segments: {
    startTime: number;
    endTime: number;
    text: string;
    speakerId?: string;
  }[];
  language: string;
  isAutogenerated: boolean;
}

export interface VideoChapter {
  id: string;
  videoId: string;
  title: string;
  timestamp: number;  // Start time (milliseconds)
  duration: number;   // Duration (milliseconds)
  order: number;
} 