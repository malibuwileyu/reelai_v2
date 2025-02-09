import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import functionsTest from 'firebase-functions-test';

// Load environment variables
const projectConfig = {
  projectId: process.env.FIREBASE_TEST_PROJECT_ID || 'test-project',
  databaseURL: `http://${process.env.FIREBASE_FIRESTORE_EMULATOR_HOST}`,
  storageBucket: process.env.FIREBASE_TEST_STORAGE_BUCKET || 'test-project.appspot.com'
};

// Initialize Firebase Admin with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

admin.initializeApp({
  projectId: projectConfig.projectId,
  credential: admin.credential.applicationDefault(),
  databaseURL: projectConfig.databaseURL,
  storageBucket: projectConfig.storageBucket
});

// Initialize test SDK
const test = functionsTest({
  projectId: projectConfig.projectId,
  databaseURL: projectConfig.databaseURL,
  storageBucket: projectConfig.storageBucket
});

// Export for use in tests
export { admin, functions, test };

// Cleanup after tests
afterAll(async () => {
  await Promise.all([
    admin.app().delete(),
    test.cleanup()
  ]);
}); 