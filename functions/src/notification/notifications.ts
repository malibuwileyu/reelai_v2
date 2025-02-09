import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

interface NotificationData {
  title: string;
  body: string;
  type: 'video_processed' | 'like' | 'comment' | 'milestone';
  data?: Record<string, string>;
}

async function sendNotification(userId: string, notification: NotificationData) {
  try {
    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return;
    }

    // Send notification
    await messaging.send({
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {}
    });

    // Store notification in Firestore
    await db.collection('notifications').add({
      userId,
      ...notification,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Notify when video processing is complete
export const onVideoProcessed = onDocumentUpdated('videos/{videoId}', async (event) => {
  const newData = event.data?.after.data();
  const previousData = event.data?.before.data();

  if (newData?.status === 'ready' && previousData?.status === 'processing') {
    await sendNotification(newData.creatorId, {
      title: 'Video Processing Complete',
      body: `Your video "${newData.title}" is now ready to view!`,
      type: 'video_processed',
      data: {
        videoId: event.params.videoId
      }
    });
  }
});

// Notify on new video like
export const onNewLike = onDocumentCreated('videos/{videoId}/likes/{likeId}', async (event) => {
  const likeData = event.data?.data();
  if (!likeData) return;

  const videoDoc = await db.collection('videos').doc(event.params.videoId).get();
  const videoData = videoDoc.data();

  if (videoData && likeData.userId !== videoData.creatorId) {
    await sendNotification(videoData.creatorId, {
      title: 'New Like',
      body: `Someone liked your video "${videoData.title}"`,
      type: 'like',
      data: {
        videoId: event.params.videoId,
        likeId: event.params.likeId
      }
    });
  }
});

// Notify on learning milestone
export const onMilestoneAchieved = onDocumentUpdated('progress/{progressId}', async (event) => {
  const newData = event.data?.after.data();
  const previousData = event.data?.before.data();

  if (newData?.completed && !previousData?.completed) {
    await sendNotification(newData.userId, {
      title: 'Milestone Achieved! 🎉',
      body: 'Congratulations! You\'ve completed another learning milestone.',
      type: 'milestone',
      data: {
        progressId: event.params.progressId
      }
    });
  }
}); 