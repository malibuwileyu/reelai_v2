import { Timestamp } from 'firebase/firestore';

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  createdAt: Date;
  updatedAt: Date;
  size: number;
  mimeType: string;
  duration: number;
  category?: string;
  tags?: string[];
  isPublic: boolean;
  language: string;
  difficulty?: string;
  views: number;
  likes: number;
}

export interface VideoUploadOptions {
  metadata: VideoMetadata;
  onProgress?: (progress: VideoUploadProgress) => void;
  testEnv?: boolean;
}

export interface VideoUploadResponse {
  videoId: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface VideoUploadProgress {
  state: 'running' | 'paused' | 'cancelled' | 'error' | 'success';
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  error?: Error;
}

/**
 * @deprecated Use VideoUploadProgress instead
 */
export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  error?: Error;
}

/**
 * Error codes for video-related operations
 */
export type VideoErrorCode = 
  | 'video/invalid-format'
  | 'video/too-large'
  | 'video/processing-failed'
  | 'audio/ffmpeg-load-failed'
  | 'audio/extraction-failed'
  | 'audio/invalid-format'
  | 'audio/too-large';

/**
 * Custom error class for video-related operations
 */
export class VideoError extends Error {
  readonly code: VideoErrorCode;

  constructor(message: string, code: VideoErrorCode) {
    super(message);
    this.code = code;
    this.name = 'VideoError';
  }
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