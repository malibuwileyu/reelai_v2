import { Timestamp } from 'firebase/firestore';

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  creatorId: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
  isPublic: boolean;
  views: number;
  likes: number;
  category: string;
  language: string;
  mimeType: string;
  size: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
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
  videoUrl: string;
  thumbnailUrl: string;
  creatorId: string;
  userName: string;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  category: 'education' | 'tutorial' | 'lecture' | 'presentation' | 'other';
  tags: string[];
  language: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  metadata: VideoMetadata;
}

export interface VideoCreate extends Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'shareCount'> {
  id?: string;
}

export interface VideoUpdate extends Partial<Omit<Video, 'id' | 'creatorId'>> {} 