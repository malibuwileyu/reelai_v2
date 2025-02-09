import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../config/firebase';

const storage = getStorage(app);

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface StorageError extends Error {
  code: string;
}

export class StorageService {
  static async uploadVideo(
    userId: string,
    videoId: string,
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<string> {
    const path = `videos/${userId}/${videoId}/${file.name}`;
    const storageRef = ref(storage, path);
    
    try {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      if (onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }
      
      await uploadTask;
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }

  static async uploadThumbnail(
    userId: string,
    videoId: string,
    file: File
  ): Promise<string> {
    const path = `thumbnails/${userId}/${videoId}/${file.name}`;
    const storageRef = ref(storage, path);
    
    try {
      await uploadBytesResumable(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      throw error;
    }
  }

  static async uploadAvatar(
    userId: string,
    file: File
  ): Promise<string> {
    const path = `avatars/${userId}/${file.name}`;
    const storageRef = ref(storage, path);
    
    try {
      await uploadBytesResumable(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  }

  static async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  static async deleteVideo(userId: string, videoId: string, fileName: string): Promise<void> {
    await this.deleteFile(`videos/${userId}/${videoId}/${fileName}`);
  }

  static async deleteThumbnail(userId: string, videoId: string, fileName: string): Promise<void> {
    await this.deleteFile(`thumbnails/${userId}/${videoId}/${fileName}`);
  }

  static async deleteAvatar(userId: string, fileName: string): Promise<void> {
    await this.deleteFile(`avatars/${userId}/${fileName}`);
  }
} 