# Firebase Schema Documentation

## Collections Overview

### Core Collections

#### `users/`
```typescript
{
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
  preferences: {
    language: string;          // Preferred language
    theme: string;            // UI theme preference
    notifications: boolean;   // Notification settings
  }
}
```

#### `videos/`
```typescript
{
  id: string;                    // Document ID
  creatorId: string;            // Reference to users collection
  title: string;                // Video title
  description: string;          // Video description
  videoUrl: string;            // Storage URL for video
  thumbnailUrl: string;        // Storage URL for thumbnail
  duration: number;            // Video duration in seconds
  size: number;                // File size in bytes
  mimeType: string;           // Video MIME type
  status: 'uploading' | 'processing' | 'ready' | 'error';
  category: string;           // Video category
  tags: string[];            // Video tags
  isPublic: boolean;         // Visibility setting
  language: string;          // Video language
  difficulty: string;        // Content difficulty level
  views: number;            // View count
  likes: number;           // Like count
  createdAt: Timestamp;    // Upload date
  updatedAt: Timestamp;    // Last update date
}
```

### Learning & Progress Collections

#### `watchHistory/`
```typescript
{
  id: string;                    // Document ID
  videoId: string;              // Reference to videos collection
  userId: string;               // Reference to users collection
  timestamp: Timestamp;         // Watch timestamp
  watchDuration: number;        // Duration watched in seconds
  completionPercentage: number; // Percentage completed (0-100)
  lastPosition: number;         // Last playback position
  deviceInfo: {
    platform: string;          // ios, android, web
    deviceId: string;          // Unique device identifier
    osVersion: string;         // Operating system version
    appVersion: string;        // App version
  }
}
```

#### `subjectProgress/`
```typescript
{
  id: string;                    // Document ID
  userId: string;               // Reference to users collection
  subjectId: string;           // Reference to subjects collection
  completionPercentage: number; // Overall completion (0-100)
  timeSpent: number;           // Total time in seconds
  lastAccessedAt: Timestamp;   // Last access date
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  achievements: Achievement[];  // Earned achievements
}
```

#### `learningPaths/`
```typescript
{
  id: string;                    // Document ID
  userId: string;               // Reference to users collection
  title: string;                // Path title
  description: string;          // Path description
  prerequisites: string[];      // Required subject IDs
  milestones: {
    id: string;                // Milestone ID
    title: string;            // Milestone title
    description: string;      // Milestone description
    requiredVideos: string[]; // Required video IDs
    requiredProficiency: string;
    completionCriteria: {
      minWatchPercentage: number;
      minQuizScore?: number;
      requiredAchievements?: string[];
    }
    isCompleted: boolean;
    completedAt?: Timestamp;
  }[];
  progress: number;             // Overall progress (0-100)
  currentCheckpoint: string;    // Current milestone ID
  estimatedTimeToComplete: number; // Estimated seconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `dailyWatchMetrics/`
```typescript
{
  id: string;                    // Document ID (userId_YYYY-MM-DD)
  userId: string;               // Reference to users collection
  date: Timestamp;             // Date of metrics
  watchCount: number;          // Videos watched that day
  lastUpdated: Timestamp;      // Last update timestamp
}
```

### Achievement Collections

#### `achievements/`
```typescript
{
  id: string;                    // Document ID
  type: AchievementType;        // Achievement category
  title: string;                // Achievement name
  description: string;          // Achievement description
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  icon: string;                 // Icon identifier
  requirement: number;          // Required progress
  isUnlocked: boolean;         // Unlock status
}
```

#### `achievementProgress/`
```typescript
{
  id: string;                    // Document ID
  userId: string;               // Reference to users collection
  achievementId: string;        // Reference to achievements collection
  currentValue: number;         // Current progress
  lastUpdated: Timestamp;       // Last update timestamp
}
```

### Learning Analytics Collections

#### `learningMetrics/`
```typescript
{
  id: string;                    // Document ID
  userId: string;               // Reference to users collection
  
  // Session Metrics
  averageSessionLength: number;  // Average session duration
  sessionsPerWeek: number;      // Weekly session count
  totalSessions: number;        // Total sessions
  lastSessionAt: Timestamp;     // Last session date
  
  // Time Distribution
  weekdayDistribution: Record<string, number>;  // Sessions by day
  hourlyDistribution: Record<string, number>;   // Sessions by hour
  
  // Engagement Metrics
  totalRewatches: number;       // Video rewatch count
  pauseCount: number;           // Total pauses
  seekCount: number;            // Total seeks
  noteCount: number;            // Notes taken
  
  // Velocity Metrics
  averageCompletionTime: number;  // Avg. completion time
  completionTrend: number[];      // Recent completion times
  subjectCompletionRates: Record<string, number>;
  
  // Retention Metrics
  reviewFrequency: number;        // Days between reviews
  lastReviewDate: Timestamp;      // Last review date
  retentionScores: Record<string, number>;
  
  // Social Metrics
  groupParticipationRate: number; // Group participation %
  discussionCount: number;        // Discussion count
  collaborativeMinutes: number;   // Collaborative time
  peerComparisonRank: number;     // Peer ranking
  
  updatedAt: Timestamp;           // Last update date
}
```

#### `learningSessions/`
```typescript
{
  id: string;                    // Document ID
  userId: string;               // Reference to users collection
  startTime: Timestamp;         // Session start
  endTime: Timestamp;          // Session end
  duration: number;            // Session duration
  
  // Session Details
  videosWatched: string[];     // Video IDs watched
  subjectsStudied: string[];   // Subject IDs studied
  pauseEvents: number;         // Pause count
  seekEvents: number;          // Seek count
  notesTaken: number;          // Notes taken
  
  // Engagement Data
  averageWatchPercentage: number;  // Avg. completion %
  completedVideos: number;         // Videos completed
  
  // Device Context
  deviceInfo: {
    platform: string;           // Device platform
    deviceId: string;          // Device ID
    osVersion: string;         // OS version
    appVersion: string;        // App version
  }
  
  // Social Context
  groupSessionId?: string;      // Group session ID
  collaborators?: string[];     // Collaborator IDs
}
```

### Search & Analytics Collections

#### `searchHistory/`
```typescript
{
  id: string;                    // Document ID
  userId: string;               // Reference to users collection
  query: string;                // Search query
  filters: {                    // Applied filters
    category?: string;
    tags?: string[];
    difficulty?: string;
    language?: string;
    sortBy?: 'relevance' | 'date' | 'views';
  }
  timestamp: Timestamp;         // Search timestamp
  resultCount: number;          // Number of results
}
```

## Security Rules

See [SECURITY.md](SECURITY.md) for detailed Firestore security rules for each collection.

## Indexes

Required indexes for common queries:

```javascript
{
  "indexes": [
    {
      "collectionGroup": "videos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "creatorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "watchHistory",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "learningMetrics",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
``` 