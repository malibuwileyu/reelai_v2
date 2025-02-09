import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export all functions
export * from './video/processVideo';
export * from './user/userManagement';
export * from './notification/notifications'; 