import { Timestamp } from 'firebase/firestore';

export interface Progress {
  id: string;                // Document ID
  userId: string;           // Reference to users collection
  videoId: string;         // Reference to videos collection
  watchedSeconds: number;  // Total seconds watched
  lastPosition: number;   // Last playback position in seconds
  completed: boolean;    // Whether video is marked as completed
  notes?: string[];     // User notes for this video
  bookmarks?: number[]; // Timestamps of bookmarked moments
  rating?: number;     // User rating (1-5)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Learning progress tracking
  quizScores?: Record<string, number>;  // Quiz ID -> score
  exerciseResults?: Record<string, {
    completed: boolean;
    score?: number;
    attempts: number;
    lastAttempt: Timestamp;
  }>;
  comprehensionScore?: number;  // AI-generated comprehension score
  learningPath?: string;       // Associated learning path if any
}

export interface ProgressCreate extends Omit<Progress, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export interface ProgressUpdate extends Partial<Omit<Progress, 'id' | 'userId' | 'videoId'>> {} 