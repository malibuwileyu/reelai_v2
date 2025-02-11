import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { doc, updateDoc, getDoc, Firestore } from 'firebase/firestore';
import { VideoMetadata, VideoError } from '../types/video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video, AVPlaybackStatus } from 'expo-av';
import { View } from 'react-native';

const VIDEOS_COLLECTION = 'videos';
const THUMBNAILS_PATH = 'thumbnails';

interface ProcessingResult {
  thumbnailUrl?: string;
  duration?: number;
  status: 'ready' | 'error';
  error?: string;
}

/**
 * VideoProcessor class handles post-upload video processing
 * including metadata extraction and status updates
 */
export class VideoProcessor {
  private storage: FirebaseStorage;
  private db: Firestore;
  private logger: Console;

  constructor(storage: FirebaseStorage, db: Firestore, logger: Console = console) {
    this.storage = storage;
    this.db = db;
    this.logger = logger;
  }

  private async getVideoDuration(videoUrl: string, existingMetadata?: { duration?: number }): Promise<number> {
    // Temporarily hardcoded to 0 to avoid errors
    // TODO: Implement proper video duration detection
    return 0;
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
   */
  async processVideo(videoId: string, videoUrl: string, userId: string): Promise<ProcessingResult> {
    this.logger.info(`[VideoProcessor] Starting video processing for videoId: ${videoId}`);
    
    try {
      // Update status to processing
      await this.updateVideoMetadata(videoId, {
        status: 'processing',
        updatedAt: new Date()
      });

      // Get video metadata first
      const videoDoc = await getDoc(doc(this.db, VIDEOS_COLLECTION, videoId));
      const videoData = videoDoc.data();

      // Try to get duration
      let duration = 0;
      try {
        duration = await this.getVideoDuration(videoUrl, videoData);
      } catch (durationError) {
        this.logger.error('Error getting duration, will update later:', durationError);
      }

      // Generate thumbnail
      let thumbnailUrl: string | undefined;
      try {
        thumbnailUrl = await this.generateThumbnail(videoUrl, videoId, userId);
      } catch (thumbnailError) {
        this.logger.error('Error generating thumbnail:', thumbnailError);
      }

      // Prepare update with what we have
      const update: Partial<VideoMetadata> = {
        status: 'ready',
        updatedAt: new Date()
      };

      if (duration > 0) {
        update.duration = duration;
      }

      if (thumbnailUrl) {
        update.thumbnailUrl = thumbnailUrl;
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
      const errorUpdate: Partial<VideoMetadata> = {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date()
      };
      await this.updateVideoMetadata(videoId, errorUpdate)
        .catch(err => this.logger.error('Failed to update error status:', err));

      throw error;
    }
  }

  /**
   * Update video metadata in Firestore
   */
  private async updateVideoMetadata(videoId: string, update: Partial<VideoMetadata>): Promise<void> {
    this.logger.info(`[VideoProcessor] Updating video metadata:`, update);
    
    try {
      // Get existing data first
      const videoDoc = await getDoc(doc(this.db, VIDEOS_COLLECTION, videoId));
      const existingData = videoDoc.data();

      // Remove any undefined values and merge with existing metadata
      const cleanUpdate = Object.fromEntries(
        Object.entries(update).filter(([_, value]) => value !== undefined)
      );

      // If we're updating status to ready, ensure we preserve metadata
      if (cleanUpdate.status === 'ready' && existingData?.metadata) {
        cleanUpdate.metadata = {
          ...existingData.metadata,
          duration: cleanUpdate.duration || existingData.metadata.duration
        };
      }

      // Ensure thumbnailUrl is a full Firebase Storage URL
      if (cleanUpdate.thumbnailUrl && typeof cleanUpdate.thumbnailUrl === 'string' && !cleanUpdate.thumbnailUrl.startsWith('https://')) {
        const thumbnailRef = ref(this.storage, cleanUpdate.thumbnailUrl);
        cleanUpdate.thumbnailUrl = await getDownloadURL(thumbnailRef);
      }
      
      await updateDoc(doc(this.db, VIDEOS_COLLECTION, videoId), cleanUpdate);
      this.logger.info(`[VideoProcessor] Metadata updated successfully:`, cleanUpdate);
    } catch (error) {
      this.logger.error(`[VideoProcessor] Error updating metadata:`, error);
      throw new VideoError(
        `Failed to update video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'video/metadata-update-failed'
      );
    }
  }
}