import { CloudEvent } from '@google-cloud/functions-framework';
import { onVideoUploaded } from '../index';
import { admin, test } from './setup';

describe('onVideoUploaded', () => {
  it('should process video and update status', async () => {
    const videoId = 'test-video-1';
    const event: CloudEvent<any> = {
      specversion: '1.0',
      type: 'google.cloud.storage.object.v1.finalized',
      source: '//storage.googleapis.com/projects/_/buckets/test-bucket',
      id: '123',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        name: `videos/${videoId}/original.mp4`,
        bucket: 'test-bucket'
      }
    };

    await onVideoUploaded(event);
    // ... rest of test ...
  });

  it('should handle errors gracefully', async () => {
    const videoId = 'test-video-2';
    const event: CloudEvent<any> = {
      specversion: '1.0',
      type: 'google.cloud.storage.object.v1.finalized',
      source: '//storage.googleapis.com/projects/_/buckets/test-bucket',
      id: '456',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: {
        name: `videos/${videoId}/original.mp4`,
        bucket: 'test-bucket'
      }
    };

    await onVideoUploaded(event);
    // ... rest of test ...
  });
}); 