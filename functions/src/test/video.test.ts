import { describe, it, expect } from '@jest/globals';
import { onVideoUploaded } from '../video/processVideo';
import * as admin from 'firebase-admin';
import { StorageEvent } from 'firebase-functions/v2/storage';
import { admin as setupAdmin } from './setup';

describe('Video Processing Functions', () => {
  const waitForDocumentUpdate = async (videoId: string, maxAttempts = 20) => {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const doc = await admin.firestore().collection('videos').doc(videoId).get();
      if (doc.exists && doc.data()?.status === 'ready') {
        return doc.data();
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between attempts
    }
    throw new Error(`Document ${videoId} did not update to 'ready' status within ${maxAttempts * 500}ms`);
  };

  it('should process video upload and update metadata', async () => {
    const videoId = 'test-video-123';
    const userId = 'test-user-123';
    const event: StorageEvent = {
      data: {
        name: `videos/${userId}/${videoId}/video.mp4`,
        contentType: 'video/mp4',
        size: 42,
        bucket: 'test-bucket',
        generation: 123,
        metageneration: 1,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        id: 'test-object-id',
        storageClass: 'STANDARD'
      },
      bucket: 'test-bucket',
      source: '//storage.googleapis.com/projects/_/buckets/test-bucket',
      subject: `projects/_/buckets/test-bucket/objects/videos/${userId}/${videoId}/video.mp4`,
      id: 'test-event-id',
      type: 'google.cloud.storage.object.v1.finalized',
      time: new Date().toISOString(),
      specversion: '1.0'
    };

    await onVideoUploaded(event);
    const videoData = await waitForDocumentUpdate(videoId);
    
    expect(videoData).toBeDefined();
    expect(videoData?.status).toBe('ready');
    expect(videoData?.metadata).toMatchObject({
      format: 'video/mp4',
      resolution: '1080p',
    });
  }, 30000); // Increase test timeout to 30 seconds

  it('should skip non-video files', async () => {
    const event: StorageEvent = {
      data: {
        name: 'images/test.jpg',
        contentType: 'image/jpeg',
        size: 42,
        bucket: 'test-bucket',
        generation: 123,
        metageneration: 1,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        id: 'test-object-id',
        storageClass: 'STANDARD'
      },
      bucket: 'test-bucket',
      source: '//storage.googleapis.com/projects/_/buckets/test-bucket',
      subject: `projects/_/buckets/test-bucket/objects/images/test.jpg`,
      id: 'test-event-id',
      type: 'google.cloud.storage.object.v1.finalized',
      time: new Date().toISOString(),
      specversion: '1.0'
    };

    await onVideoUploaded(event);
    // No assertions needed as we just verify it doesn't throw
  }, 10000); // 10 second timeout for simpler test
});

describe('onVideoUploaded', () => {
  it('should process video and update status', async () => {
    const videoId = 'test-video-1';
    const event: StorageEvent = {
      data: {
        contentType: 'video/mp4',
        name: `videos/user123/${videoId}/original.mp4`,
        bucket: 'test-bucket',
        size: 1024,
        generation: 12345,
        metageneration: 1,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        id: 'test-object-id',
        storageClass: 'STANDARD'
      },
      bucket: 'test-bucket',
      source: '//storage.googleapis.com/projects/_/buckets/test-bucket',
      subject: `projects/_/buckets/test-bucket/objects/videos/user123/${videoId}/original.mp4`,
      id: 'test-event-id',
      type: 'google.cloud.storage.object.v1.finalized',
      time: new Date().toISOString(),
      specversion: '1.0'
    };

    await onVideoUploaded(event);

    // Verify the document was updated
    const docRef = setupAdmin.firestore().collection('videos').doc(videoId);
    const doc = await docRef.get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.status).toBe('ready');
    expect(doc.data()?.metadata).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const videoId = 'test-video-2';
    const event: StorageEvent = {
      data: {
        contentType: 'video/mp4',
        name: `videos/user123/${videoId}/original.mp4`,
        bucket: 'test-bucket',
        size: 1024,
        generation: 12345,
        metageneration: 1,
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString(),
        id: 'test-object-id',
        storageClass: 'STANDARD'
      },
      bucket: 'test-bucket',
      source: '//storage.googleapis.com/projects/_/buckets/test-bucket',
      subject: `projects/_/buckets/test-bucket/objects/videos/user123/${videoId}/original.mp4`,
      id: 'test-event-id',
      type: 'google.cloud.storage.object.v1.finalized',
      time: new Date().toISOString(),
      specversion: '1.0'
    };

    // Mock Firestore to throw an error
    jest.spyOn(setupAdmin.firestore(), 'collection').mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    await expect(onVideoUploaded(event)).rejects.toThrow('Test error');
  });
}); 