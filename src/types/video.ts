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

export class VideoError extends Error {
  constructor(
    message: string,
    readonly code: string = 'video/unknown-error'
  ) {
    super(message);
    this.name = 'VideoError';
  }
} 