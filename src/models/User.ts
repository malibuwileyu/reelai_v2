import { Timestamp } from 'firebase/firestore';

export interface UserPreferences {
  language: string;
  theme: string;
  notifications: boolean;
}

export interface User {
  id: string;                    // Document ID (user's UID)
  username: string;              // Unique username
  email: string;                 // User's email
  displayName: string;           // Public display name
  photoURL?: string;            // Profile photo URL
  bio?: string;                 // User biography
  followers: number;            // Follower count
  videosCount: number;         // Number of uploaded videos
  createdAt: Timestamp;        // Account creation date
  updatedAt: Timestamp;        // Last update date
  preferences: UserPreferences;
  
  // Additional fields from schema.sql
  website?: string;
  location?: string;
  institution?: string;
  role?: 'teacher' | 'student' | 'content_creator';
  subjects?: string[];
  followingCount: number;
  notificationSettings?: Record<string, any>;
  privacySettings?: Record<string, any>;
  lastActiveAt?: Timestamp;
  profileCompleted: boolean;
  onboardingCompleted: boolean;
  accountType: string;

  // Streak tracking
  lastWatchedDate?: string;     // ISO date string (YYYY-MM-DD)
  currentStreak: number;       // Current daily watch streak
  longestStreak: number;      // Longest daily watch streak achieved
}

export interface UserCreate extends Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'followers' | 'videosCount' | 'followingCount' | 'currentStreak' | 'longestStreak'> {
  id?: string;
}

export interface UserUpdate extends Partial<Omit<User, 'id' | 'email'>> {} 