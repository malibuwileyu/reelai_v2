import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { doc, updateDoc, getDoc, Firestore } from 'firebase/firestore';
import { VideoMetadata, VideoError } from '../types/video';
import * as VideoThumbnails from 'expo-video-thumbnails';

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

  /**
   * Process a video after upload
   * @param videoId The ID of the video to process
   * @param videoUrl The URL of the uploaded video
   * @param duration The duration of the video in milliseconds
   */
  async processVideo(videoId: string, videoUrl: string, duration?: number): Promise<ProcessingResult> {
    this.logger.info(`[VideoProcessor] Starting video processing for videoId: ${videoId}`);
    
    try {
      // Update status to processing
      await this.updateVideoMetadata(videoId, {
        status: 'processing',
        updatedAt: new Date()
      });

      // Generate thumbnail
      let thumbnailUrl: string | undefined;
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
          time: 0,
          quality: 0.5
        });

        // Convert data URI to blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload thumbnail to Firebase Storage
        const thumbnailRef = ref(this.storage, `${THUMBNAILS_PATH}/${videoId}/thumbnail.jpg`);
        await uploadBytes(thumbnailRef, blob);
        thumbnailUrl = await getDownloadURL(thumbnailRef);

        this.logger.info(`[VideoProcessor] Thumbnail generated and uploaded: ${thumbnailUrl}`);
      } catch (thumbnailError) {
        this.logger.error(`[VideoProcessor] Error generating thumbnail:`, thumbnailError);
        // Continue processing even if thumbnail generation fails
      }

      // Mark as ready and update with thumbnail URL if available
      await this.updateVideoMetadata(videoId, {
        status: 'ready',
        thumbnailUrl,
        updatedAt: new Date()
      });
      
      return {
        status: 'ready',
        thumbnailUrl,
        duration: duration || 0
      };
    } catch (error) {
      this.logger.error(`[VideoProcessor] Error processing video:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during video processing';
      
      // Update video document with error status
      await this.updateVideoMetadata(videoId, {
        status: 'error',
        updatedAt: new Date()
      }).catch(updateError => {
        this.logger.error('[VideoProcessor] Failed to update error status:', updateError);
      });

      return {
        status: 'error',
        error: errorMessage
      };
    }
  }

  /**
   * Update video metadata in Firestore
   */
  private async updateVideoMetadata(videoId: string, update: Partial<VideoMetadata>): Promise<void> {
    this.logger.info(`[VideoProcessor] Updating video metadata:`, update);
    
    try {
      await updateDoc(doc(this.db, VIDEOS_COLLECTION, videoId), update);
      this.logger.info(`[VideoProcessor] Metadata updated successfully`);
    } catch (error) {
      this.logger.error(`[VideoProcessor] Error updating metadata:`, error);
      throw new VideoError(
        `Failed to update video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'video/metadata-update-failed'
      );
    }
  }
} 