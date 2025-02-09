import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../../../config/firebase';
import { COLLECTIONS } from '../../../models';
import { Video } from '../../../models/Video';
import { VideoUploadOptions, VideoUploadProgress, VideoUploadResponse, VideoService } from '../types';

class FirebaseVideoService implements VideoService {
  private storage = getStorage();
  private db = getFirestore();
  private activeUploads = new Map<string, ReturnType<typeof uploadBytesResumable>>();

  async uploadVideo(file: File, options: VideoUploadOptions): Promise<VideoUploadResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to upload videos');
      }

      // Create a unique ID for the video
      const videoId = uuidv4();
      const filePath = `videos/${user.uid}/${videoId}/${file.name}`;
      const storageRef = ref(this.storage, filePath);

      // Create video document in Firestore
      const videoDoc = {
        id: videoId,
        creatorId: user.uid,
        title: options.title,
        description: options.description || '',
        videoUrl: '', // Will be updated after upload
        thumbnailUrl: '', // Will be generated during processing
        status: 'uploading' as const,
        isPublic: options.isPublic || false,
        category: options.category || 'other',
        tags: options.tags || [],
        language: options.language || 'en',
        difficulty: options.difficulty || 'beginner',
        size: file.size,
        mimeType: file.type,
        duration: 0, // Will be extracted during processing
        views: 0,
        likes: 0,
        shareCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(this.db, COLLECTIONS.VIDEOS, videoId), videoDoc);

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file);
      this.activeUploads.set(videoId, uploadTask);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress);
        },
        (error) => {
          console.error('Upload error:', error);
          this.handleUploadError(videoId, error);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await this.handleUploadSuccess(videoId, downloadURL);
        }
      );

      return {
        videoId,
        status: 'uploading',
      };
    } catch (error) {
      console.error('Error starting video upload:', error);
      throw error;
    }
  }

  async getUploadProgress(videoId: string): Promise<VideoUploadProgress> {
    const uploadTask = this.activeUploads.get(videoId);
    if (!uploadTask) {
      const video = await this.getVideo(videoId);
      return {
        bytesTransferred: 0,
        totalBytes: 0,
        progress: video.status === 'ready' ? 100 : 0,
        state: video.status === 'ready' ? 'success' : 'error'
      };
    }

    const snapshot = uploadTask.snapshot;
    const state = (() => {
      switch (snapshot.state) {
        case 'running':
          return 'running';
        case 'paused':
          return 'paused';
        case 'canceled':
        case 'error':
          return 'error';
        case 'success':
          return 'success';
      }
    })();

    return {
      bytesTransferred: snapshot.bytesTransferred,
      totalBytes: snapshot.totalBytes,
      progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
      state
    };
  }

  async cancelUpload(videoId: string): Promise<void> {
    const uploadTask = this.activeUploads.get(videoId);
    if (uploadTask) {
      uploadTask.cancel();
      this.activeUploads.delete(videoId);
      await this.deleteVideo(videoId);
    }
  }

  async getVideo(videoId: string): Promise<Video> {
    const docRef = doc(this.db, COLLECTIONS.VIDEOS, videoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Video not found');
    }
    
    return docSnap.data() as Video;
  }

  async updateVideo(videoId: string, updates: Partial<Video>): Promise<void> {
    const docRef = doc(this.db, COLLECTIONS.VIDEOS, videoId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
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

  private async handleUploadError(videoId: string, error: Error): Promise<void> {
    try {
      await this.updateVideo(videoId, {
        status: 'error',
        updatedAt: serverTimestamp()
      } as Partial<Video>);
    } catch (updateError) {
      console.error('Error updating video status after upload error:', updateError);
    }
    this.activeUploads.delete(videoId);
  }

  private async handleUploadSuccess(videoId: string, downloadURL: string): Promise<void> {
    try {
      await this.updateVideo(videoId, {
        videoUrl: downloadURL,
        status: 'processing',
        updatedAt: serverTimestamp()
      } as Partial<Video>);
    } catch (error) {
      console.error('Error updating video after successful upload:', error);
      throw error;
    }
    this.activeUploads.delete(videoId);
  }
}

export const videoService = new FirebaseVideoService(); 