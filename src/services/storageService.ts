import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, StorageReference } from 'firebase/storage';
import { app, auth } from '../config/firebase';

const storage = getStorage(app);

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface StorageError extends Error {
  code: string;
}

export class StorageService {
  static async deleteFile(path: string): Promise<void> {
    try {
      // If the path is a full URL, extract the path portion
      if (path.startsWith('https://')) {
        // Extract the path after the storage bucket
        const storageUrl = new URL(path);
        const pathParts = decodeURIComponent(storageUrl.pathname).split('/o/');
        if (pathParts.length > 1) {
          path = pathParts[1].split('?')[0]; // Remove query parameters
        } else {
          throw new Error('Invalid storage URL format');
        }
      }

      // Create storage reference with the correct path
      const storageRef = ref(storage, path);
      try {
        await deleteObject(storageRef);
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError);
        // If the file doesn't exist, don't throw an error
        if ((deleteError as any)?.code === 'storage/object-not-found') {
          console.warn('File not found, skipping deletion');
          return;
        }
        throw deleteError;
      }
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  static async uploadVideo(
    userId: string,
    videoId: string,
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<string> {
    // Debug logs
    console.log('[StorageService] Current auth state:', {
      currentUser: auth.currentUser?.uid,
      isAuthenticated: !!auth.currentUser,
      uploadingForUser: userId,
      token: await auth.currentUser?.getIdToken(),
    });

    const path = `videos/${userId}/${videoId}/${file.name}`;
    console.log('[StorageService] Uploading to path:', path);
    
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