import { StorageService } from '../../services/storageService';
import { auth } from '../../config/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { VideoService } from '../../services/videoService';
import { db, storage } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../../constants';

describe('Storage Service E2E Tests', () => {
  const testUserId = 'test-user';
  const testVideoId = 'test-video';
  const testFileName = 'test-file.mp4';

  // Helper to create a test file
  const createTestFile = (name: string, type: string, size: number = 1024): File => {
    const buffer = new ArrayBuffer(size);
    return new File([buffer], name, { type });
  };

  beforeEach(async () => {
    // Sign in anonymously for testing
    await signInAnonymously(auth);
  });

  afterEach(async () => {
    // Clean up by signing out
    await signOut(auth);
  });

  it('should upload and delete a video', async () => {
    const testFile = createTestFile(testFileName, 'video/mp4');
    let uploadedUrl: string;

    // Test upload
    await expect(async () => {
      uploadedUrl = await StorageService.uploadVideo(
        testUserId,
        testVideoId,
        testFile
      );
      expect(uploadedUrl).toContain(testFileName);

      // Test delete
      await StorageService.deleteVideo(testUserId, testVideoId, testFileName);
    }).not.toThrow();
  });

  it('should upload and delete a thumbnail', async () => {
    const testFile = createTestFile('thumbnail.jpg', 'image/jpeg');
    let uploadedUrl: string;

    // Test upload
    await expect(async () => {
      uploadedUrl = await StorageService.uploadThumbnail(
        testUserId,
        testVideoId,
        testFile
      );
      expect(uploadedUrl).toBeTruthy();

      // Test delete
      await StorageService.deleteThumbnail(testUserId, testVideoId, 'thumbnail.jpg');
    }).not.toThrow();
  });

  it('should upload and delete an avatar', async () => {
    const testFile = createTestFile('avatar.jpg', 'image/jpeg');
    let uploadedUrl: string;

    // Test upload
    await expect(async () => {
      uploadedUrl = await StorageService.uploadAvatar(testUserId, testFile);
      expect(uploadedUrl).toBeTruthy();

      // Test delete
      await StorageService.deleteAvatar(testUserId, 'avatar.jpg');
    }).not.toThrow();
  });

  it('should reject invalid file types', async () => {
    const invalidFile = createTestFile('invalid.txt', 'text/plain');
    await expect(
      StorageService.uploadVideo(testUserId, testVideoId, invalidFile)
    ).rejects.toThrow();
  });

  it('should reject files that are too large', async () => {
    const largeFile = createTestFile('large.mp4', 'video/mp4', 600 * 1024 * 1024); // 600MB
    await expect(
      StorageService.uploadVideo(testUserId, testVideoId, largeFile)
    ).rejects.toThrow();
  });
});

describe('Video Upload E2E Tests', () => {
  let videoService: VideoService;

  beforeEach(async () => {
    // Sign in anonymously for testing
    await signInAnonymously(auth);
    videoService = new VideoService(storage, auth, db);
  });

  afterEach(async () => {
    await signOut(auth);
  });

  it('should upload a video and process it successfully', async () => {
    // Create a test video file
    const testVideoBlob = new Blob(['test video content'], { type: 'video/mp4' });
    const testFile = new File([testVideoBlob], 'test-video.mp4', { type: 'video/mp4' });

    // Track upload progress
    let uploadProgress = 0;
    const onProgress = (progress: any) => {
      uploadProgress = progress.progress;
    };

    // Start upload
    const result = await videoService.uploadVideo(testFile, {
      title: 'Test Video',
      description: 'Test Description',
      isPublic: true,
      category: 'test',
      onProgress
    });

    // Verify result
    expect(result.success).toBe(true);
    expect(result.videoId).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.status).toBe('ready');
    expect(result.metadata.thumbnailUrl).toBeDefined();

    // Verify video document in Firestore
    const videoDoc = await getDoc(doc(db, COLLECTIONS.VIDEOS, result.videoId));
    expect(videoDoc.exists()).toBe(true);
    expect(videoDoc.data()).toMatchObject({
      title: 'Test Video',
      description: 'Test Description',
      status: 'ready',
      isPublic: true,
      category: 'test'
    });

    // Verify progress was tracked
    expect(uploadProgress).toBeGreaterThan(0);
  });

  it('should handle invalid file types', async () => {
    // Create an invalid file
    const testBlob = new Blob(['not a video'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

    // Attempt upload with invalid file
    await expect(videoService.uploadVideo(testFile, {
      title: 'Invalid File',
      description: 'Should Fail'
    })).rejects.toThrow('Invalid video file type');
  });

  it('should handle file size limits', async () => {
    // Create a file that exceeds size limit (100MB)
    const largeBlob = new Blob([new ArrayBuffer(101 * 1024 * 1024)], { type: 'video/mp4' });
    const largeFile = new File([largeBlob], 'large.mp4', { type: 'video/mp4' });

    // Attempt upload with oversized file
    await expect(videoService.uploadVideo(largeFile, {
      title: 'Large File',
      description: 'Should Fail'
    })).rejects.toThrow('Video file too large');
  });

  it('should handle video deletion', async () => {
    // First upload a video
    const testVideoBlob = new Blob(['test video content'], { type: 'video/mp4' });
    const testFile = new File([testVideoBlob], 'test-video.mp4', { type: 'video/mp4' });

    const result = await videoService.uploadVideo(testFile, {
      title: 'Delete Test',
      description: 'To be deleted'
    });

    // Then delete it
    await videoService.deleteVideo(result.videoId);

    // Verify video document is deleted
    const videoDoc = await getDoc(doc(db, COLLECTIONS.VIDEOS, result.videoId));
    expect(videoDoc.exists()).toBe(false);
  });

  it('should handle unauthorized video deletion', async () => {
    // Create a video with a different user ID
    const testVideoBlob = new Blob(['test video content'], { type: 'video/mp4' });
    const testFile = new File([testVideoBlob], 'test-video.mp4', { type: 'video/mp4' });

    const result = await videoService.uploadVideo(testFile, {
      title: 'Auth Test',
      description: 'Test unauthorized deletion'
    });

    // Sign out and sign in as different user
    await signOut(auth);
    await signInAnonymously(auth);

    // Attempt to delete as different user
    await expect(videoService.deleteVideo(result.videoId))
      .rejects.toThrow('Not authorized to delete this video');
  });
}); 