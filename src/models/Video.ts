import { Timestamp } from 'firebase/firestore';

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface VideoMetadata {
  duration: number;     // Video duration in seconds
  format: string;      // Video format (e.g., 'mp4')
  resolution: string;  // Video resolution (e.g., '1080p')
}

export interface VideoChapter {
  title: string;
  timestamp: number;
  description?: string;
}

export interface Video {
  id: string;                    // Document ID
  creatorId: string;            // Reference to users collection
  title: string;                // Video title
  description: string;          // Video description
  videoUrl: string;            // Storage URL for video
  thumbnailUrl: string;        // Storage URL for thumbnail
  duration: number;            // Video duration in seconds
  size: number;                // File size in bytes
  mimeType: string;           // Video MIME type
  status: VideoStatus;        // Video processing status
  category: string;           // Video category
  tags: string[];            // Video tags
  isPublic: boolean;         // Visibility setting
  language: string;          // Video language
  difficulty: string;        // Content difficulty level
  views: number;            // View count
  likes: number;           // Like count
  createdAt: Timestamp;    // Upload date
  updatedAt: Timestamp;    // Last update date

  // Additional fields from schema.sql
  subject?: string;
  gradeLevel?: string;
  learningObjectives?: string[];
  keywords?: string[];
  transcript?: string;
  chapters?: VideoChapter[];
  captions?: Record<string, string>;  // Language code -> caption URL
  previewGifUrl?: string;
  aiGeneratedTags?: string[];
  contentSummary?: string;
  automatedChapters?: VideoChapter[];
  shareCount: number;
  publishedAt?: Timestamp;
}

export interface VideoCreate extends Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'shareCount'> {
  id?: string;
}

export interface VideoUpdate extends Partial<Omit<Video, 'id' | 'creatorId'>> {} 