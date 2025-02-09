import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface VideoMetadata {
  duration: number;
  format: string;
  resolution: string;
}

export const onVideoUploaded = onObjectFinalized(async (event) => {
  console.log('Processing video upload event:', event);

  // Only process video files
  if (!event.data.contentType?.startsWith('video/')) {
    console.log('Not a video file, skipping processing');
    return;
  }

  const filePath = event.data.name;
  if (!filePath) {
    console.error('File path is undefined');
    return;
  }

  try {
    // Extract video metadata using FFmpeg or similar tool
    // This is a placeholder for actual video processing
    const metadata: VideoMetadata = {
      duration: 0, // To be extracted
      format: event.data.contentType,
      resolution: '1080p' // To be extracted
    };

    // Extract videoId from path (format: videos/{userId}/{videoId}/filename)
    const pathParts = filePath.split('/');
    const videoId = pathParts.length >= 3 ? pathParts[2] : null;
    console.log('Extracted videoId:', videoId);

    if (videoId) {
      const docRef = db.collection('videos').doc(videoId);
      console.log('Updating document:', docRef.path);

      const updateData = {
        status: 'ready',
        metadata,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      console.log('Update data:', updateData);

      await docRef.set(updateData, { merge: true });
      console.log('Document updated successfully');

      // Verify the update
      const updatedDoc = await docRef.get();
      console.log('Updated document data:', updatedDoc.data());
    }

    console.log(`Successfully processed video: ${filePath}`);
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}); 