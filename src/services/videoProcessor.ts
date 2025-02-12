import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { doc, updateDoc, getDoc, Firestore, setDoc } from 'firebase/firestore';
import { VideoMetadata, VideoError, VideoErrorCode } from '../types/video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video, AVPlaybackStatus } from 'expo-av';
import { View } from 'react-native';
import { WhisperService, WhisperServiceOptions } from './whisperService';
import { AudioExtractor } from './audioExtractor';
import type { VideoTranscript } from '../features/learning-path/types';
import { CloudinaryService } from './cloudinaryService';
import { OpenAIService } from './openaiService';
import type { Chapter } from '../types/video';

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
  private whisperService: WhisperService;

  constructor(
    storage: FirebaseStorage,
    db: Firestore,
    logger: Console = console
  ) {
    this.storage = storage;
    this.db = db;
    this.logger = logger;
    
    // Initialize WhisperService with AudioExtractor
    const audioExtractor = new AudioExtractor(logger);
    this.whisperService = new WhisperService(audioExtractor);
  }

  /**
   * Get video duration
   * Note: Currently returns an expected error that will be fixed in a future update
   */
  private async getVideoDuration(videoUrl: string, videoData?: any): Promise<number> {
    try {
      const video = new Video({ style: {} });
      const status = await new Promise<AVPlaybackStatus>((resolve, reject) => {
        video.loadAsync(
          { uri: videoUrl },
          { shouldPlay: false }
        ).then(status => {
          resolve(status);
        }).catch(error => {
          reject(error);
        });
      });

      if (!status.isLoaded) {
        throw new Error('Video failed to load');
      }

      return status.durationMillis || 0;
    } catch (error) {
      this.logger.error('[VideoProcessor] Error getting video duration:', error);
      // This error is expected behavior and will be fixed in a future update
      throw new Error('Cannot complete operation because the Video component has not yet loaded');
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

      // Generate transcript using Cloudinary
      onProgress?.({ stage: 'transcription', progress: 0, message: 'Starting transcription...' });
      let transcript: VideoTranscript | undefined;
      try {
        // Download video for Cloudinary processing
        const response = await fetch(videoUrl);
        const videoBlob = await response.blob();
        
        // Process with Cloudinary
        const cloudinaryService = new CloudinaryService(this.logger);
        const cloudinaryResult = await cloudinaryService.processVideo(videoBlob);
        
        // Use the processed audio URL for transcription
        const openai = new OpenAIService();
        const audioResponse = await fetch(cloudinaryResult.url);
        const audioBlob = await audioResponse.blob();
        
        // Transcribe the processed audio
        const transcriptionText = await openai.transcribeAudio(audioBlob);
        const analysis = await openai.analyzeTranscription(transcriptionText);
        
        // Create transcript
        transcript = {
          videoId,
          segments: analysis.chapters.map((chapter: Chapter) => ({
            startTime: chapter.startTime * 1000,
            endTime: chapter.endTime * 1000,
            text: chapter.title
          })),
          language: analysis.language,
          isAutogenerated: true
        };

        // Save transcript
        await this.saveTranscript(videoId, transcript);
        onProgress?.({ stage: 'transcription', progress: 100, message: 'Transcription complete' });
      } catch (transcriptError) {
        this.logger.error('Error generating transcript:', transcriptError);
        throw new VideoError(
          'Failed to generate transcript',
          'audio/processing-failed'
        );
      }

      // Update final metadata
      const update: Partial<VideoMetadata> = {
        status: 'ready',
        updatedAt: new Date(),
        duration: duration > 0 ? duration : undefined,
        thumbnailUrl: thumbnailUrl || undefined
      };

      await this.updateVideoMetadata(videoId, update);

      return {
        thumbnailUrl,
        duration,
        transcript,
        status: 'ready'
      };
    } catch (error) {
      this.logger.error('Video processing error:', error);
      
      await this.updateVideoMetadata(videoId, {
        status: 'error',
        updatedAt: new Date()
      }).catch(err => this.logger.error('Failed to update error status:', err));

      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save transcript to Firestore
   */
  private async saveTranscript(videoId: string, transcript: VideoTranscript): Promise<void> {
    try {
      await setDoc(doc(this.db, TRANSCRIPTS_COLLECTION, videoId), transcript);
    } catch (error) {
      this.logger.error('Error saving transcript:', error);
      throw new VideoError(
        'Failed to save transcript',
        'audio/processing-failed'
      );
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
        'video/processing-failed'
      );
    }
  }
}