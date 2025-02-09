import { StorageService } from '../../services/storageService';
import { auth } from '../../config/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';

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

    try {
      // Test upload
      uploadedUrl = await StorageService.uploadVideo(
        testUserId,
        testVideoId,
        testFile,
        (progress) => {
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(100);
        }
      );

      expect(uploadedUrl).toBeDefined();
      expect(typeof uploadedUrl).toBe('string');
      expect(uploadedUrl).toContain(testFileName);

      // Test delete
      await StorageService.deleteVideo(testUserId, testVideoId, testFileName);
    } catch (error) {
      fail(`Test failed with error: ${error}`);
    }
  });

  it('should upload and delete a thumbnail', async () => {
    const testFile = createTestFile('thumbnail.jpg', 'image/jpeg');
    let uploadedUrl: string;

    try {
      // Test upload
      uploadedUrl = await StorageService.uploadThumbnail(
        testUserId,
        testVideoId,
        testFile
      );

      expect(uploadedUrl).toBeDefined();
      expect(typeof uploadedUrl).toBe('string');
      expect(uploadedUrl).toContain('thumbnail.jpg');

      // Test delete
      await StorageService.deleteThumbnail(testUserId, testVideoId, 'thumbnail.jpg');
    } catch (error) {
      fail(`Test failed with error: ${error}`);
    }
  });

  it('should upload and delete an avatar', async () => {
    const testFile = createTestFile('avatar.jpg', 'image/jpeg');
    let uploadedUrl: string;

    try {
      // Test upload
      uploadedUrl = await StorageService.uploadAvatar(testUserId, testFile);

      expect(uploadedUrl).toBeDefined();
      expect(typeof uploadedUrl).toBe('string');
      expect(uploadedUrl).toContain('avatar.jpg');

      // Test delete
      await StorageService.deleteAvatar(testUserId, 'avatar.jpg');
    } catch (error) {
      fail(`Test failed with error: ${error}`);
    }
  });

  it('should handle invalid file types', async () => {
    const invalidFile = createTestFile('invalid.txt', 'text/plain');

    await expect(
      StorageService.uploadVideo(testUserId, testVideoId, invalidFile)
    ).rejects.toThrow();
  });

  it('should handle large files', async () => {
    const largeFile = createTestFile('large.mp4', 'video/mp4', 600 * 1024 * 1024); // 600MB

    await expect(
      StorageService.uploadVideo(testUserId, testVideoId, largeFile)
    ).rejects.toThrow();
  });
}); 