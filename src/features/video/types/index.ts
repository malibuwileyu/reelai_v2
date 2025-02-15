import { Video } from '../../../models/Video';
import { Timestamp } from 'firebase/firestore';

export interface VideoUploadProgress {
  state: 'running' | 'paused' | 'cancelled' | 'error' | 'success';
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  error?: Error;
}

export interface VideoUploadOptions {
  title: string;
  description?: string;
  isPublic?: boolean;
  category?: string;
  tags?: string[];
  language?: string;
  difficulty?: string;
  onProgress?: (progress: VideoUploadProgress) => void;
}

export interface VideoUploadResponse {
  videoId: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadUrl?: string;
  error?: string;
}

export interface VideoService {
  uploadVideo: (file: File, options: VideoUploadOptions) => Promise<VideoUploadResponse>;
  getUploadProgress: (videoId: string) => Promise<VideoUploadProgress>;
  cancelUpload: (videoId: string) => Promise<void>;
  getVideo: (videoId: string) => Promise<Video>;
  updateVideo: (videoId: string, updates: Partial<Video>) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
}

export interface VideoProgress {
  videoId: string;
  userId: string;
  completed: boolean;
  lastPosition: number;
  timeWatchedMs: number;
  lastWatchedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creatorId: string;
  transcriptId?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export type { Video }; 