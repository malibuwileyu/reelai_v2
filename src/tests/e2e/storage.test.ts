import { StorageService } from '../../services/storageService';
import { auth } from '../../config/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { beforeEach, describe, expect, it } from '@jest/globals';

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