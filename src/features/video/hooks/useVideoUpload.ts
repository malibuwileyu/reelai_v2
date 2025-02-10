import { useState, useCallback, useEffect } from 'react';
import { videoService } from '../services/videoService';
import { VideoUploadOptions, VideoUploadProgress, VideoUploadResponse, VideoMetadata } from '../../../types/video';

interface UseVideoUploadResult {
  uploadVideo: (file: File, metadata: VideoMetadata) => Promise<VideoUploadResponse>;
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

  const uploadVideo = useCallback(async (file: File, metadata: VideoMetadata): Promise<VideoUploadResponse> => {
    try {
      setError(null);
      setIsUploading(true);
      setProgress(null);

      const options: VideoUploadOptions = {
        metadata,
        onProgress: (progress) => setProgress(progress)
      };

      const response = await videoService.uploadVideo(file, options);
      setVideoId(response.videoId);

      // Wait for upload to complete
      return new Promise((resolve, reject) => {
        const checkProgress = setInterval(async () => {
          try {
            const currentProgress = await videoService.getUploadProgress(response.videoId);
            setProgress(currentProgress);

            if (currentProgress.state === 'success') {
              clearInterval(checkProgress);
              setIsUploading(false);
              resolve(response);
            } else if (currentProgress.state === 'error') {
              clearInterval(checkProgress);
              setIsUploading(false);
              reject(new Error('Upload failed'));
            }
          } catch (error) {
            clearInterval(checkProgress);
            setIsUploading(false);
            reject(error);
          }
        }, 1000);
      });
    } catch (error) {
      setError(error as Error);
      setIsUploading(false);
      throw error;
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