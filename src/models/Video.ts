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
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  userId: string;
  userName: string;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoCreate extends Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'shareCount'> {
  id?: string;
}

export interface VideoUpdate extends Partial<Omit<Video, 'id' | 'creatorId'>> {} 