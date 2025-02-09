import { auth, db } from '../../../config/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { videoService } from '../services/videoService';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../../../constants';

describe('Video Upload E2E Tests', () => {
  beforeEach(async () => {
    // Sign in anonymously for testing
    await signInAnonymously(auth);
  });

  afterEach(async () => {
    await signOut(auth);
  });

  it('should upload a video and update metadata', async () => {
    // Create a test video file
    const testVideoBlob = new Blob(['test video content'], { type: 'video/mp4' });
    const testFile = new File([testVideoBlob], 'test-video.mp4', { type: 'video/mp4' });

    // Start upload
    const { videoId } = await videoService.uploadVideo(testFile, {
      title: 'Test Video',
      description: 'Test Description',
    });

    // Wait for upload to complete or fail
    let uploadProgress;
    do {
      uploadProgress = await videoService.getUploadProgress(videoId);
      if (uploadProgress.state === 'error') {
        throw new Error(`Upload failed: ${uploadProgress.error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms between checks
    } while (uploadProgress.state === 'running');

    // Verify video document in Firestore
    const videoDoc = await getDoc(doc(db, COLLECTIONS.VIDEOS, videoId));
    expect(videoDoc.exists()).toBe(true);
    expect(videoDoc.data()).toMatchObject({
      title: 'Test Video',
      description: 'Test Description',
      status: 'ready',
    });
  });

  it('should handle upload cancellation', async () => {
    // Create a larger test video file to ensure we have time to cancel
    const testVideoBlob = new Blob([new ArrayBuffer(5 * 1024 * 1024)], { type: 'video/mp4' });
    const testFile = new File([testVideoBlob], 'large-test-video.mp4', { type: 'video/mp4' });

    // Start upload
    const { videoId } = await videoService.uploadVideo(testFile, {
      title: 'Cancel Test Video',
    });

    // Cancel the upload immediately
    videoService.cancelUpload(videoId);

    // Wait for cancellation to complete
    let uploadProgress;
    do {
      uploadProgress = await videoService.getUploadProgress(videoId);
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (uploadProgress.state === 'running');

    expect(uploadProgress.state).toBe('cancelled');

    // Verify video document is deleted or marked as cancelled
    const videoDoc = await getDoc(doc(db, COLLECTIONS.VIDEOS, videoId));
    if (videoDoc.exists()) {
      expect(videoDoc.data()?.status).toBe('cancelled');
    } else {
      expect(videoDoc.exists()).toBe(false);
    }
  });

  it('should handle invalid file types', async () => {
    // Create a test text file
    const testBlob = new Blob(['not a video'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    // Attempt to upload invalid file
    const { videoId } = await videoService.uploadVideo(testFile, { title: 'Invalid File' });

    // Wait for upload to fail
    let uploadProgress;
    do {
      uploadProgress = await videoService.getUploadProgress(videoId);
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (uploadProgress.state === 'running');

    expect(uploadProgress.state).toBe('error');
    expect(uploadProgress.error).toBeTruthy();
  });
}); 