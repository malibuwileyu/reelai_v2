import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioExtractor } from '../services/audioExtractor';
import { VideoError } from '../types/video';

export interface UseAudioExtractorOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (audioBlob: Blob) => void;
  onError?: (error: VideoError) => void;
}

export interface UseAudioExtractorResult {
  isLoading: boolean;
  isExtracting: boolean;
  error: VideoError | null;
  progress: number;
  extractAudio: (videoFile: File | Blob) => Promise<Blob>;
}

/**
 * Hook for handling audio extraction from videos
 */
export function useAudioExtractor({
  onProgress,
  onComplete,
  onError
}: UseAudioExtractorOptions = {}): UseAudioExtractorResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<VideoError | null>(null);
  const [progress, setProgress] = useState(0);
  
  const extractorRef = useRef<AudioExtractor | null>(null);

  useEffect(() => {
    // Initialize the extractor
    extractorRef.current = new AudioExtractor();

    // Cleanup on unmount
    return () => {
      if (extractorRef.current) {
        extractorRef.current.destroy().catch(console.error);
        extractorRef.current = null;
      }
    };
  }, []);

  const extractAudio = useCallback(async (videoFile: File | Blob): Promise<Blob> => {
    if (!extractorRef.current) {
      throw new VideoError(
        'Audio extractor not initialized',
        'audio/extraction-failed'
      );
    }

    try {
      setError(null);
      setIsExtracting(true);
      setProgress(0);

      const audioBlob = await extractorRef.current.extractAudio(videoFile, (progress) => {
        setProgress(progress);
        onProgress?.(progress);
      });

      setProgress(100);
      onComplete?.(audioBlob);
      return audioBlob;
    } catch (error) {
      const videoError = error instanceof VideoError
        ? error
        : new VideoError('Failed to extract audio', 'audio/extraction-failed');
      
      setError(videoError);
      onError?.(videoError);
      throw videoError;
    } finally {
      setIsExtracting(false);
    }
  }, [onProgress, onComplete, onError]);

  return {
    isLoading,
    isExtracting,
    error,
    progress,
    extractAudio
  };
} 