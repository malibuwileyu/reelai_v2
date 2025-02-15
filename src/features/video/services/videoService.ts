import { ref, uploadBytes, getDownloadURL, FirebaseStorage, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { storage, auth, db } from '../../../config/firebase';
import { COLLECTIONS } from '../../../constants';
import { VideoMetadata, VideoUploadOptions, VideoUploadProgress, VideoUploadResponse, VideoError, VideoErrorCode } from '../../../types/video';
import { VideoProcessor } from '../../../services/videoProcessor';
import { StorageService } from '../../../services/storageService';

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
    try {
      // Force token refresh to ensure valid authentication
      await this.auth.currentUser?.getIdToken(true);
      
      if (!this.auth.currentUser) {
        throw new VideoError('User must be authenticated to upload videos', 'auth/not-authenticated');
      }

      const videoId = generateVideoId();
      const storageRef = ref(this.storage, `videos/${this.auth.currentUser.uid}/${videoId}`);

      this.logger.debug('Starting video upload:', {
        videoId,
        userId: this.auth.currentUser.uid,
        path: storageRef.fullPath
      });

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          title: options.title,
          description: options.description || '',
          isPublic: String(options.isPublic || false),
          category: options.category || 'uncategorized',
          language: options.language || 'en',
          difficulty: options.difficulty || 'beginner'
        }
      });

      this.activeUploads.set(videoId, uploadTask);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (options.onProgress) {
              options.onProgress({
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                status: 'uploading'
              });
            }
          },
          (error) => {
            // Enhanced error logging with server response
            this.logger.error('Upload error:', {
              code: error.code,
              message: error.message,
              serverResponse: error.serverResponse,
              name: error.name,
              stack: error.stack
            });

            if (options.onProgress) {
              options.onProgress({
                bytesTransferred: 0,
                totalBytes: 0,
                progress: 0,
                status: 'error'
              });
            }

            // Create a more detailed error message including server response
            let errorMessage = 'Failed to upload video';
            if (error.serverResponse) {
              try {
                const serverError = JSON.parse(error.serverResponse);
                errorMessage = `Upload failed: ${serverError.error?.message || error.message}`;
              } catch {
                errorMessage = `Upload failed: ${error.serverResponse}`;
              }
            }

            // Map Firebase Storage error codes to our VideoError codes
            let errorCode: VideoErrorCode = 'video/upload-failed';
            switch (error.code) {
              case 'storage/unauthorized':
                errorCode = 'auth/not-authorized';
                break;
              case 'storage/quota-exceeded':
              case 'storage/cannot-slice-blob':
              case 'storage/server-file-wrong-size':
                errorCode = 'video/file-too-large';
                break;
              case 'storage/invalid-format':
                errorCode = 'video/invalid-format';
                break;
            }

            reject(new VideoError(errorMessage, errorCode));
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(storageRef);
              if (options.onProgress) {
                options.onProgress({
                  bytesTransferred: uploadTask.snapshot.bytesTransferred,
                  totalBytes: uploadTask.snapshot.totalBytes,
                  progress: 100,
                  status: 'complete'
                });
              }
              resolve({
                videoId,
                downloadUrl
              });
            } catch (error) {
              this.logger.error('Error getting download URL:', error);
              reject(new VideoError('Failed to get download URL', 'video/upload-failed'));
            }
          }
        );
      });
    } catch (error) {
      this.logger.error('Error during upload setup:', error);
      throw error instanceof VideoError ? error : new VideoError('Failed to setup upload', 'video/upload-failed');
    }
  }

  async getUploadProgress(videoId: string): Promise<VideoUploadProgress> {
    try {
      const uploadTask = this.activeUploads.get(videoId);
      if (uploadTask) {
        const snapshot = uploadTask.snapshot;
        return {
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          status: 'uploading'
        };
      }

      // If no active upload, check Firestore for video status
      const videoDoc = await getDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId));
      if (!videoDoc.exists()) {
        throw new VideoError('Video not found', 'video/upload-failed');
      }

      const video = videoDoc.data();
      return {
        bytesTransferred: 0,
        totalBytes: 0,
        progress: video.status === 'ready' ? 100 : 0,
        status: video.status === 'ready' ? 'complete' : 'error'
      };
    } catch (error) {
      console.error('Error getting upload progress:', error);
      return {
        bytesTransferred: 0,
        totalBytes: 0,
        progress: 0,
        status: 'error'
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
      
      // Delete video file and thumbnail from Storage
      const deletePromises: Promise<void>[] = [];
      
      if (video.videoUrl) {
        deletePromises.push(
          StorageService.deleteFile(video.videoUrl)
            .catch(error => {
              this.logger.error('Error deleting video file:', error);
              // Continue with deletion of other resources
            })
        );
      }
      
      if (video.thumbnailUrl) {
        deletePromises.push(
          StorageService.deleteFile(video.thumbnailUrl)
            .catch(error => {
              this.logger.error('Error deleting thumbnail:', error);
              // Continue with deletion of other resources
            })
        );
      }
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      
      // Delete from Firestore
      await deleteDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId));
      
      // Clean up upload task if exists
      this.activeUploads.delete(videoId);
    } catch (error) {
      this.logger.error('Error deleting video:', error);
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