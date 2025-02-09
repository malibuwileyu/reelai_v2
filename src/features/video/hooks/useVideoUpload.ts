import { useState, useCallback, useEffect } from 'react';
import { videoService } from '../services/videoService';
import { VideoUploadOptions, VideoUploadProgress, VideoUploadResponse } from '../types';

interface UseVideoUploadResult {
  uploadVideo: (file: File, options: VideoUploadOptions) => Promise<void>;
  cancelUpload: () => Promise<void>;
  progress: VideoUploadProgress | null;
  error: Error | null;
  isUploading: boolean;
  videoId: string | null;
}

export function useVideoUpload(): UseVideoUploadResult {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [progress, setProgress] = useState<VideoUploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (videoId) {
        videoService.cancelUpload(videoId).catch(console.error);
      }
    };
  }, [videoId]);

  // Poll for progress updates
  useEffect(() => {
    if (!videoId || !isUploading) return;

    const pollProgress = async () => {
      try {
        const currentProgress = await videoService.getUploadProgress(videoId);
        setProgress(currentProgress);

        if (currentProgress.state === 'error') {
          setError(new Error('Upload failed'));
          setIsUploading(false);
        } else if (currentProgress.state === 'success') {
          setIsUploading(false);
        }
      } catch (error) {
        setError(error as Error);
        setIsUploading(false);
      }
    };

    const intervalId = setInterval(pollProgress, 1000);
    return () => clearInterval(intervalId);
  }, [videoId, isUploading]);

  const uploadVideo = useCallback(async (file: File, options: VideoUploadOptions) => {
    try {
      setError(null);
      setIsUploading(true);
      setProgress(null);

      const response = await videoService.uploadVideo(file, options);
      setVideoId(response.videoId);
    } catch (error) {
      setError(error as Error);
      setIsUploading(false);
    }
  }, []);

  const cancelUpload = useCallback(async () => {
    if (videoId) {
      try {
        await videoService.cancelUpload(videoId);
        setVideoId(null);
        setProgress(null);
        setIsUploading(false);
      } catch (error) {
        setError(error as Error);
      }
    }
  }, [videoId]);

  return {
    uploadVideo,
    cancelUpload,
    progress,
    error,
    isUploading,
    videoId
  };
} 