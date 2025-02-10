import { Video, VideoMetadata } from '../../../models/Video';

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

export type { Video, VideoMetadata }; 