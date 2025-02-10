import { ref, uploadBytes, getDownloadURL, FirebaseStorage, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { storage, auth, db } from '../../../config/firebase';
import { COLLECTIONS } from '../../../constants';
import { VideoMetadata, VideoUploadOptions, VideoUploadProgress, VideoUploadResponse, VideoError } from '../../../types/video';
import { VideoProcessor } from '../../../services/videoProcessor';

// Helper function to generate a secure random ID
const generateVideoId = () => {
  // Use timestamp + random string for uniqueness
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
};

export class FirebaseVideoService {
  private activeUploads = new Map<string, ReturnType<typeof uploadBytesResumable>>();

  constructor(
    private storage: FirebaseStorage,
    private auth: Auth,
    private db: Firestore,
    private processor: VideoProcessor,
    private logger: Console = console
  ) {}

  async uploadVideo(file: File, options: VideoUploadOptions): Promise<VideoUploadResponse> {
    // Debug logs for auth state
    this.logger.info('[VideoService] Auth state:', {
      currentUser: this.auth.currentUser?.uid,
      isAuthenticated: !!this.auth.currentUser,
      token: await this.auth.currentUser?.getIdToken()
    });

    if (!this.auth.currentUser) {
      throw new Error('User must be authenticated to upload videos');
    }

    const videoId = generateVideoId();
    const userId = this.auth.currentUser.uid;
    const path = `videos/${userId}/${videoId}/${file.name}`;
    
    // Debug log for upload path
    this.logger.info('[VideoService] Uploading to path:', path);

    try {
      // Create initial video document with metadata
      const metadata: VideoMetadata = {
        ...options.metadata,
        id: videoId,
        creatorId: userId,
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId), metadata);

      // Upload to storage
      const storageRef = ref(this.storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      this.activeUploads.set(videoId, uploadTask);

      // Set up progress monitoring
      if (options.onProgress) {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress: VideoUploadProgress = {
              state: snapshot.state === 'canceled' ? 'cancelled' : snapshot.state,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes
            };
            if (options.onProgress) {
              options.onProgress(progress);
            }
          },
          (error) => {
            if (options.onProgress) {
              options.onProgress({
                state: 'error',
                progress: 0,
                bytesTransferred: 0,
                totalBytes: 0,
                error: error as Error
              });
            }
          }
        );
      }

      // Wait for upload to complete
      await uploadTask;
      const downloadUrl = await getDownloadURL(storageRef);

      // Update video document with URL
      await updateDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId), {
        videoUrl: downloadUrl,
        status: 'processing'
      });

      // Start processing
      await this.processor.processVideo(videoId, downloadUrl);

      return {
        videoId,
        downloadUrl
      };
    } catch (error) {
      this.logger.error('Video upload error:', error);
      
      // Update video document with error status
      await updateDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId), {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }).catch(err => this.logger.error('Failed to update error status:', err));

      throw error;
    } finally {
      this.activeUploads.delete(videoId);
    }
  }

  async getUploadProgress(videoId: string): Promise<VideoUploadProgress> {
    try {
      // Check if there's an active upload
      const uploadTask = this.activeUploads.get(videoId);
      if (uploadTask) {
        const snapshot = uploadTask.snapshot;
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        
        return {
          state: 'running',
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          progress
        };
      }

      // If no active upload, check video status in Firestore
      const videoDoc = await getDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId));
      if (!videoDoc.exists()) {
        throw new VideoError('Video not found', 'video/not-found');
      }

      const video = videoDoc.data();
      return {
        state: video.status === 'ready' ? 'success' : 'error',
        bytesTransferred: 0,
        totalBytes: 0,
        progress: video.status === 'ready' ? 100 : 0
      };
    } catch (error) {
      console.error('Error getting upload progress:', error);
      return {
        state: 'error',
        bytesTransferred: 0,
        totalBytes: 0,
        progress: 0,
        error: error as Error
      };
    }
  }

  async cancelUpload(videoId: string): Promise<void> {
    const uploadTask = this.activeUploads.get(videoId);
    if (uploadTask) {
      uploadTask.cancel();
      this.activeUploads.delete(videoId);
      await this.deleteVideo(videoId);
    }
  }

  async getVideo(videoId: string): Promise<VideoMetadata> {
    const docRef = doc(this.db, COLLECTIONS.VIDEOS, videoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Video not found');
    }
    
    return docSnap.data() as VideoMetadata;
  }

  async updateVideo(videoId: string, updates: Partial<VideoMetadata>): Promise<void> {
    const docRef = doc(this.db, COLLECTIONS.VIDEOS, videoId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteVideo(videoId: string): Promise<void> {
    try {
      const video = await this.getVideo(videoId);
      
      // Delete from Storage if URL exists
      if (video.videoUrl) {
        const storageRef = ref(this.storage, video.videoUrl);
        await deleteObject(storageRef);
      }
      
      // Delete thumbnail if exists
      if (video.thumbnailUrl) {
        const thumbnailRef = ref(this.storage, video.thumbnailUrl);
        await deleteObject(thumbnailRef);
      }
      
      // Delete from Firestore
      await deleteDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId));
      
      // Clean up upload task if exists
      this.activeUploads.delete(videoId);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
}

export const videoService = new FirebaseVideoService(
  storage,
  auth,
  db,
  new VideoProcessor(storage, db)
); 