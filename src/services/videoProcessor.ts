import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { doc, updateDoc, getDoc, Firestore, setDoc } from 'firebase/firestore';
import { VideoMetadata, VideoError, VideoErrorCode } from '../types/video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video, AVPlaybackStatus } from 'expo-av';
import { View } from 'react-native';
import type { VideoTranscript } from '../features/learning-path/types';

const VIDEOS_COLLECTION = 'videos';
const THUMBNAILS_PATH = 'thumbnails';
const TRANSCRIPTS_COLLECTION = 'transcripts';

interface ProcessingResult {
  thumbnailUrl?: string;
  duration?: number;
  transcript?: VideoTranscript;
  status: 'ready' | 'error';
  error?: string;
}

interface ProcessingProgress {
  stage: 'metadata' | 'thumbnail' | 'transcription';
  progress: number;
  message: string;
}

/**
 * VideoProcessor class handles post-upload video processing
 * including metadata extraction, thumbnail generation, and transcription
 */
export class VideoProcessor {
  private storage: FirebaseStorage;
  private db: Firestore;
  private logger: Console;

  constructor(
    storage: FirebaseStorage,
    db: Firestore,
    logger: Console = console
  ) {
    this.storage = storage;
    this.db = db;
    this.logger = logger;
  }

  private async getVideoDuration(videoUrl: string, existingMetadata?: { duration?: number }): Promise<number> {
    try {
      // If we already have duration in metadata, use that
      if (existingMetadata?.duration && existingMetadata.duration > 0) {
        return existingMetadata.duration;
      }

      // Create a new Video instance with required props
      const video = new Video({ style: {} });
      
      // Load the video and wait for status
      const status = await new Promise<AVPlaybackStatus>((resolve, reject) => {
        video.loadAsync(
          { uri: videoUrl },
          { shouldPlay: false }
        ).then(status => {
          if (status.isLoaded) {
            resolve(status);
          } else {
            reject(new Error('Failed to load video'));
          }
        }).catch(reject);
      });

      // Check if status is loaded and has duration
      if (!status.isLoaded || !status.durationMillis) {
        throw new Error('Could not get video duration');
      }

      // Convert milliseconds to seconds
      return Math.round(status.durationMillis / 1000);
    } catch (error) {
      this.logger.error('[VideoProcessor] Error getting video duration:', error);
      throw new VideoError('Failed to get video duration', 'video/processing-failed');
    }
  }

  private async generateThumbnail(videoUrl: string, videoId: string, userId: string): Promise<string | undefined> {
    try {
      // Try to generate thumbnail at 0 seconds
      const result = await VideoThumbnails.getThumbnailAsync(videoUrl, {
        time: 0,
        quality: 0.5
      });

      if (!result?.uri) {
        throw new Error('No thumbnail generated');
      }

      // Upload thumbnail with userId in path
      const response = await fetch(result.uri);
      const blob = await response.blob();
      const thumbnailPath = `thumbnails/${userId}/${videoId}/thumbnail.jpg`;
      const thumbnailRef = ref(this.storage, thumbnailPath);
      
      await uploadBytes(thumbnailRef, blob);
      const url = await getDownloadURL(thumbnailRef);
      this.logger.info(`[VideoProcessor] Successfully generated and uploaded thumbnail: ${url}`);
      return url;
    } catch (firstError) {
      this.logger.error('[VideoProcessor] Error generating thumbnail at 0s:', firstError);
      
      try {
        // Try again at 1 second
        const result = await VideoThumbnails.getThumbnailAsync(videoUrl, {
          time: 1000,
          quality: 0.5
        });

        if (!result?.uri) {
          throw new Error('No thumbnail generated');
        }

        // Upload thumbnail with userId in path
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const thumbnailPath = `thumbnails/${userId}/${videoId}/thumbnail.jpg`;
        const thumbnailRef = ref(this.storage, thumbnailPath);
        
        await uploadBytes(thumbnailRef, blob);
        const url = await getDownloadURL(thumbnailRef);
        this.logger.info(`[VideoProcessor] Successfully generated and uploaded thumbnail at 1s: ${url}`);
        return url;
      } catch (secondError) {
        this.logger.error('[VideoProcessor] Error generating thumbnail at 1s:', secondError);
        return undefined;
      }
    }
  }

  /**
   * Process a video after upload
   * @param videoId The ID of the video to process
   * @param videoUrl The URL of the uploaded video
   * @param userId The ID of the user who uploaded the video
   * @param onProgress Optional progress callback
   */
  async processVideo(
    videoId: string,
    videoUrl: string,
    userId: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    this.logger.info(`[VideoProcessor] Starting video processing for videoId: ${videoId}`);
    
    try {
      // Update status to processing
      await this.updateVideoMetadata(videoId, {
        status: 'processing',
        updatedAt: new Date()
      });

      // Get video metadata first
      onProgress?.({ stage: 'metadata', progress: 0, message: 'Extracting metadata...' });
      const videoDoc = await getDoc(doc(this.db, VIDEOS_COLLECTION, videoId));
      const videoData = videoDoc.data();

      // Try to get duration
      let duration = 0;
      try {
        duration = await this.getVideoDuration(videoUrl, videoData);
        onProgress?.({ stage: 'metadata', progress: 50, message: 'Duration extracted' });
      } catch (durationError) {
        this.logger.error('Error getting duration, will update later:', durationError);
      }

      // Generate thumbnail
      onProgress?.({ stage: 'thumbnail', progress: 0, message: 'Generating thumbnail...' });
      let thumbnailUrl: string | undefined;
      try {
        thumbnailUrl = await this.generateThumbnail(videoUrl, videoId, userId);
        onProgress?.({ stage: 'thumbnail', progress: 100, message: 'Thumbnail generated' });
      } catch (thumbnailError) {
        this.logger.error('Error generating thumbnail:', thumbnailError);
      }

      // Note: Transcription is now handled by the server
      onProgress?.({ stage: 'transcription', progress: 100, message: 'Transcription will be handled by server' });

      // Prepare update with what we have
      const update: Partial<VideoMetadata> = {
        status: 'ready',
        updatedAt: new Date(),
        thumbnailUrl: thumbnailUrl || undefined
      };

      // Only include duration if it's greater than 0
      if (duration > 0) {
        update.duration = duration;
      }

      // Update video metadata
      await this.updateVideoMetadata(videoId, update);

      return {
        thumbnailUrl,
        duration,
        status: 'ready'
      };
    } catch (error) {
      this.logger.error('Video processing error:', error);
      
      // Update video status to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateVideoMetadata(videoId, {
        status: 'error' as const,
        updatedAt: new Date()
      }).catch(err => this.logger.error('Failed to update error status:', err));

      return {
        status: 'error',
        error: errorMessage
      };
    }
  }

  private async saveTranscript(videoId: string, transcript: VideoTranscript): Promise<void> {
    const transcriptRef = doc(this.db, TRANSCRIPTS_COLLECTION, videoId);
    await setDoc(transcriptRef, transcript);
  }

  private async updateVideoMetadata(videoId: string, update: Partial<VideoMetadata>): Promise<void> {
    const videoRef = doc(this.db, VIDEOS_COLLECTION, videoId);
    await updateDoc(videoRef, update);
  }
}