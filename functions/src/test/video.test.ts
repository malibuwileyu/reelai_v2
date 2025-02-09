import { test, admin } from './setup';
import { onVideoUploaded } from '../video/processVideo';
import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

jest.setTimeout(10000);

describe('Video Processing Functions', () => {
  beforeEach(async () => {
    // Clear test data before each test
    const videosRef = admin.firestore().collection('videos');
    const snapshot = await videosRef.get();
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
  }, 10000);

  afterAll(async () => {
    // Final cleanup
    const videosRef = admin.firestore().collection('videos');
    const snapshot = await videosRef.get();
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
  });

  // Helper function to wait for document update
  const waitForDocumentUpdate = async (docRef: admin.firestore.DocumentReference, maxAttempts = 5) => {
    for (let i = 0; i < maxAttempts; i++) {
      const doc = await docRef.get();
      const data = doc.data();
      if (data?.status === 'ready') {
        return data;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
    }
    throw new Error('Document did not update within the expected time');
  };

  it('should process video upload and update metadata', async () => {
    // Create a test video document
    const videoId = 'test-video-123';
    const docRef = admin.firestore().collection('videos').doc(videoId);
    
    await docRef.set({
      status: 'processing',
      title: 'Test Video',
      creatorId: 'test-user-123'
    });

    // Mock storage event
    const wrapped = test.wrap(onVideoUploaded);
    const testEvent = {
      data: {
        contentType: 'video/mp4',
        name: `videos/test-user-123/${videoId}/video.mp4`,
      }
    };

    // Execute function
    await wrapped(testEvent);

    // Wait for and verify results
    const data = await waitForDocumentUpdate(docRef);
    expect(data).toBeDefined();
    expect(data.status).toBe('ready');
    expect(data.metadata).toBeDefined();
    expect(data.metadata.format).toBe('video/mp4');
  }, 10000);

  it('should skip non-video files', async () => {
    const wrapped = test.wrap(onVideoUploaded);
    const testEvent = {
      data: {
        contentType: 'image/jpeg',
        name: 'images/test.jpg',
      }
    };

    await wrapped(testEvent);
    // Function should exit early without error
  }, 10000);
}); 