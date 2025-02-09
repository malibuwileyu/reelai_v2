import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Listen for user creation through a callable function
export const onUserCreated = onCall(async (request) => {
  const user = request.auth;
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    // Create user document in Firestore
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.token.email,
      displayName: user.token.name || `user_${user.uid}`,
      photoURL: user.token.picture,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      followers: 0,
      videosCount: 0,
      followingCount: 0,
      profileCompleted: false,
      onboardingCompleted: false,
      accountType: 'user',
      preferences: {
        language: 'en',
        theme: 'dark',
        notifications: true
      }
    });

    console.log(`Created user document for ${user.uid}`);
    return { success: true };
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Failed to create user document');
  }
});

// Listen for user deletion through a callable function
export const onUserDeleted = onCall(async (request) => {
  const user = request.auth;
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    // Delete user's data
    const batch = db.batch();
    
    // Delete user document
    batch.delete(db.collection('users').doc(user.uid));
    
    // Get and delete user's videos
    const videosSnapshot = await db.collection('videos')
      .where('creatorId', '==', user.uid)
      .get();
    
    videosSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Get and delete user's progress
    const progressSnapshot = await db.collection('progress')
      .where('userId', '==', user.uid)
      .get();
    
    progressSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit all deletions
    await batch.commit();
    
    console.log(`Cleaned up data for deleted user ${user.uid}`);
    return { success: true };
  } catch (error) {
    console.error('Error cleaning up user data:', error);
    throw new Error('Failed to clean up user data');
  }
}); 