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
  VideoError 
} from '../types/video';
import { VideoProcessor } from './videoProcessor';

const VIDEOS_COLLECTION = 'videos';
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

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
   * Upload a video file to Firebase Storage
   */
  async uploadVideo(
    file: File,
    options: VideoUploadOptions
  ): Promise<VideoUploadResult> {
    try {
      this.logger.info('[VideoService] Starting video upload process');
      
      // Validate user authentication
      const user = this.auth.currentUser;
      if (!user) {
        const error = 'User must be authenticated to upload videos';
        this.logger.error('[VideoService]', error);
        throw new VideoError(error, 'auth/not-authenticated');
      }

      // Validate file type
      if (!file || !ALLOWED_VIDEO_TYPES.includes(file.type)) {
        const error = `Invalid video file type: ${file.type}. Allowed types are: ${ALLOWED_VIDEO_TYPES.join(', ')}`;
        this.logger.error('[VideoService]', error);
        throw new VideoError(error, 'video/invalid-type');
      }

      // Validate file size
      if (file.size > MAX_VIDEO_SIZE) {
        const error = 'Video file too large';
        this.logger.error('[VideoService]', error);
        throw new VideoError(error, 'video/file-too-large');
      }

      // Create video document
      const videoId = doc(collection(this.db, VIDEOS_COLLECTION)).id;
      this.logger.info(`[VideoService] Created video ID: ${videoId}`);
      
      const metadata: VideoMetadata = {
        id: videoId,
        title: options.title,
        description: options.description,
        creatorId: user.uid,
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: file.size,
        mimeType: file.type,
        duration: 0,
        category: options.category,
        tags: options.tags,
        isPublic: options.isPublic ?? false,
        language: options.language ?? 'en',
        difficulty: options.difficulty,
        views: 0,
        likes: 0
      };

      // Save initial metadata
      this.logger.info('[VideoService] Saving initial metadata');
      await setDoc(doc(this.db, VIDEOS_COLLECTION, videoId), metadata);

      // Upload to Firebase Storage
      const storageRef = ref(this.storage, `videos/${user.uid}/${videoId}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          // Progress callback
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              status: 'uploading'
            };
            this.logger.info(`[VideoService] Upload progress: ${progress.progress}%`);
            options.onProgress?.(progress);
          },
          // Error callback
          (error) => {
            this.logger.error('[VideoService] Upload error:', error);
            // Update metadata with error status
            updateDoc(doc(this.db, VIDEOS_COLLECTION, videoId), {
              status: 'error',
              updatedAt: new Date()
            }).catch(error => this.logger.error('[VideoService] Error updating status:', error));
            
            reject(new VideoError('Failed to upload video', 'video/upload-failed'));
          },
          // Complete callback
          async () => {
            try {
              this.logger.info('[VideoService] Upload completed successfully');
              
              // Get download URL
              const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              this.logger.info('[VideoService] Got download URL:', videoUrl);
              
              // Update metadata with URL and processing status
              const updatedMetadata: Partial<VideoMetadata> = {
                videoUrl,
                status: 'processing',
                updatedAt: new Date()
              };
              
              await updateDoc(doc(this.db, VIDEOS_COLLECTION, videoId), updatedMetadata);
              
              // Start video processing after upload is complete
              this.logger.info('[VideoService] Starting video processing');
              const processingResult = await this.processor.processVideo(
                videoId, 
                videoUrl,
                metadata.duration
              );
              this.logger.info('[VideoService] Video processing completed:', processingResult);
              
              // Update final metadata with processing results
              const finalMetadata: Partial<VideoMetadata> = {
                ...updatedMetadata,
                status: processingResult.status,
                thumbnailUrl: processingResult.thumbnailUrl,
                duration: processingResult.duration,
                updatedAt: new Date()
              };
              
              await updateDoc(doc(this.db, VIDEOS_COLLECTION, videoId), finalMetadata);
              
              resolve({
                success: true,
                videoId,
                metadata: { ...metadata, ...finalMetadata }
              });
            } catch (error) {
              this.logger.error('[VideoService] Post-upload error:', error);
              reject(new VideoError('Failed to process video', 'video/processing-failed'));
            }
          }
        );
      });
    } catch (error) {
      this.logger.error('[VideoService] Video upload error:', error);
      throw error instanceof VideoError ? error : new VideoError('Failed to upload video');
    }
  }

  /**
   * Get video metadata by ID
   */
  async getVideo(videoId: string): Promise<VideoMetadata> {
    try {
      const videoDoc = await getDoc(doc(this.db, VIDEOS_COLLECTION, videoId));
      if (!videoDoc.exists()) {
        throw new VideoError('Video not found', 'video/not-found');
      }
      return videoDoc.data() as VideoMetadata;
    } catch (error) {
      console.error('Get video error:', error);
      throw error instanceof VideoError ? error : new VideoError('Failed to get video');
    }
  }

  /**
   * Delete a video and its metadata
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      const video = await this.getVideo(videoId);
      
      // Verify ownership
      const user = this.auth.currentUser;
      if (!user || video.creatorId !== user.uid) {
        throw new VideoError('Not authorized to delete this video', 'auth/not-authorized');
      }

      // Delete from Storage if URL exists
      if (video.videoUrl) {
        const storageRef = ref(this.storage, `videos/${user.uid}/${videoId}`);
        await deleteObject(storageRef);
      }

      // Delete metadata
      await deleteDoc(doc(this.db, VIDEOS_COLLECTION, videoId));
    } catch (error) {
      console.error('Delete video error:', error);
      throw error instanceof VideoError ? error : new VideoError('Failed to delete video');
    }
  }
} 