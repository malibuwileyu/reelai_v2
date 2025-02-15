import { Timestamp } from 'firebase/firestore';
import { QuestionBank, QuizGenerationConfig } from '../../quiz/types';
import { Milestone } from './index';

export interface MilestoneQuizRequirements {
  passingScore: number;
  maxAttempts?: number;
  timeLimit?: number;
  requiredVideoIds: string[];
  unlockCriteria?: {
    previousMilestoneId?: string;
    requiredQuizIds?: string[];
  };
}

export interface MilestoneQuizProgress {
  milestoneId: string;
  userId: string;
  questionBankId: string;
  attempts: MilestoneQuizAttempt[];
  bestScore: number;
  isCompleted: boolean;
  lastAttemptAt: Timestamp;
  unlocked: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MilestoneQuizAttempt {
  id: string;
  questionBankId: string;
  score: number;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  answers: Record<string, any>;
  timeSpentMs?: number;
  metadata?: {
    browserInfo?: string;
    ipAddress?: string;
    deviceType?: string;
  };
}

export interface MilestoneQuizGeneration {
  milestoneId: string;
  videoIds: string[];
  transcripts: Record<string, string>;
  config: QuizGenerationConfig;
  metadata: {
    milestoneTitle: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface MilestoneQuizValidation {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  requirements: MilestoneQuizRequirements;
  progress?: MilestoneQuizProgress;
}

export interface QuizUnlockResult {
  isUnlocked: boolean;
  reason?: string;
  missingPrerequisites?: {
    videos?: string[];
    quizzes?: string[];
    previousMilestone?: string;
  };
} 