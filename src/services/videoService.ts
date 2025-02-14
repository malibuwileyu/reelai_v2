import { ref, uploadBytesResumable, getDownloadURL, deleteObject, FirebaseStorage } from 'firebase/storage';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { storage, auth, db } from '../config/firebase';
import { 
  VideoMetadata, 
  VideoUploadOptions, 
  VideoUploadResult, 
  UploadProgress,
  VideoError,
  ProcessingServerRequest,
  ProcessingServerResponse
} from '../types/video';
import { VideoProcessor } from './videoProcessor';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const VIDEOS_COLLECTION = 'videos';
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

// Server URL configuration
const SERVER_URL = 'http://192.168.1.70:3000';  // Simplified for local development

/**
 * Service for managing video uploads and metadata
 */
export class VideoService {
  private storage: FirebaseStorage;
  private auth: Auth;
  private db: Firestore;
  private processor: VideoProcessor;
  private logger: Console;

  constructor(
    storageInstance: FirebaseStorage = storage,
    authInstance: Auth = auth,
    dbInstance: Firestore = db,
    logger: Console = console
  ) {
    this.storage = storageInstance;
    this.auth = authInstance;
    this.db = dbInstance;
    this.processor = new VideoProcessor(storageInstance, dbInstance, logger);
    this.logger = logger;
  }

  /**
   * Send video to processing server
   */
  private async sendToProcessingServer(
    videoId: string, 
    videoUrl: string, 
    userId: string
  ): Promise<ProcessingServerResponse> {
    try {
      this.logger.info('[VideoService] Sending video to processing server:', {
        videoId,
        userId,
        serverUrl: SERVER_URL,
        timestamp: new Date().toISOString()
      });
      
      const request: ProcessingServerRequest = {
        videoId,
        videoUrl,
        userId,
        message: `Processing video ${videoId} for user ${userId}`
      };

      this.logger.info('[VideoService] Request payload:', request);

      const response = await fetch(`${SERVER_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `${Date.now()}-${videoId}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      this.logger.info('[VideoService] Response status:', response.status);
      
      const responseText = await response.text();
      this.logger.info('[VideoService] Raw response:', responseText);

      if (!response.ok) {
        throw new VideoError(
          `Server responded with ${response.status}: ${responseText}`,
          'video/processing-failed'
        );
      }

      const result = JSON.parse(responseText) as ProcessingServerResponse;
      
      if (result.status === 'error') {
        throw new VideoError(
          result.message || 'Processing server returned error status',
          'video/processing-failed'
        );
      }

      this.logger.info('[VideoService] Processing server response:', result);
      return result;
    } catch (error) {
      this.logger.error('[VideoService] Processing server error:', error);
      
      if (error instanceof VideoError) {
        throw error;
      }
      
      throw new VideoError(
        error instanceof Error ? error.message : 'Failed to process video on server',
        'video/processing-failed'
      );
    }
  }

  /**
   * Generate a unique video ID
   */
  private generateVideoId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
  }

  /**
   * Upload a video file to Firebase Storage
   */
  async uploadVideo(
    file: File,
    options: VideoUploadOptions
  ): Promise<VideoUploadResult> {
    try {
      if (!this.auth.currentUser) {
        throw new VideoError(
          'User must be authenticated to upload videos',
          'auth/not-authenticated'
        );
      }

      // Validate file
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        throw new VideoError(
          'Invalid video format. Supported formats: MP4, MOV, AVI',
          'video/invalid-type'
        );
      }

      if (file.size > MAX_VIDEO_SIZE) {
        throw new VideoError(
          'Video file is too large. Maximum size: 100MB',
          'video/file-too-large'
        );
      }

      const videoId = this.generateVideoId();
      const userId = this.auth.currentUser.uid;
      const path = `videos/${userId}/${videoId}/${file.name}`;
      
      this.logger.info('[VideoService] Starting upload:', {
        videoId,
        userId,
        path,
        fileSize: file.size,
        fileType: file.type
      });

      // Create storage reference
      const storageRef = ref(this.storage, path);
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Track upload progress
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            this.logger.info(`[VideoService] Upload progress: ${progress.progress}%`);
            options.onProgress?.(progress);
          },
          (error) => {
            this.logger.error('[VideoService] Upload error:', error);
            reject(new VideoError('Failed to upload video', 'video/upload-failed'));
          },
          async () => {
            try {
              // Get download URL
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              this.logger.info('[VideoService] Upload completed:', {
                videoId,
                downloadUrl
              });

              // Create initial metadata
              const metadata: VideoMetadata = {
                id: videoId,
                title: options.title,
                description: options.description || '',
                creatorId: userId,
                videoUrl: downloadUrl,
                status: 'processing',
                createdAt: new Date(),
                updatedAt: new Date(),
                size: file.size,
                mimeType: file.type,
                duration: 0,
                category: options.category,
                tags: options.tags || [],
                isPublic: options.isPublic || false,
                language: options.language || 'en',
                difficulty: options.difficulty,
                views: 0,
                likes: 0
              };

              // Save metadata to Firestore
              await setDoc(doc(this.db, VIDEOS_COLLECTION, videoId), metadata);
              
              // Send to processing server and wait for response
              try {
                const processingResponse = await this.sendToProcessingServer(videoId, downloadUrl, userId);
                this.logger.info('[VideoService] Processing server success:', processingResponse);
              } catch (error) {
                this.logger.error('[VideoService] Processing server error:', error);
                // Continue with upload success even if processing fails
              }
              
              // Resolve with success
              resolve({
                success: true,
                videoId,
                metadata
              });
            } catch (error) {
              this.logger.error('[VideoService] Post-upload error:', error);
              reject(error instanceof VideoError ? error : new VideoError('Failed to process video', 'video/processing-failed'));
            }
          }
        );
      });
    } catch (error) {
      this.logger.error('[VideoService] Video upload error:', error);
      throw error instanceof VideoError ? error : new VideoError('Failed to upload video', 'video/upload-failed');
    }
  }

  /**
   * Get video metadata by ID
   */
  async getVideo(videoId: string): Promise<VideoMetadata> {
    try {
      const videoDoc = await getDoc(doc(this.db, VIDEOS_COLLECTION, videoId));
      if (!videoDoc.exists()) {
        throw new VideoError('Video not found', 'video/invalid-format');
      }
      return videoDoc.data() as VideoMetadata;
    } catch (error) {
      console.error('Get video error:', error);
      throw error instanceof VideoError ? error : new VideoError('Failed to get video', 'video/invalid-format');
    }
  }

  /**
   * Delete a video and its metadata
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      const video = await this.getVideo(videoId);
      if (video.videoUrl) {
        await deleteObject(ref(this.storage, video.videoUrl));
      }
      await deleteDoc(doc(this.db, VIDEOS_COLLECTION, videoId));
    } catch (error) {
      console.error('Delete video error:', error);
      throw error instanceof VideoError ? error : new VideoError('Failed to delete video', 'video/invalid-format');
    }
  }
} 