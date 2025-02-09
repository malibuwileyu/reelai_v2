import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import { afterAll } from '@jest/globals';

const projectConfig = {
  projectId: 'demo-project',
  databaseURL: 'http://localhost:8080',
  storageBucket: 'demo-project.appspot.com'
};

// Initialize the firebase-functions-test SDK using emulator settings
const test = functionsTest({
  projectId: projectConfig.projectId,
  databaseURL: projectConfig.databaseURL,
  storageBucket: projectConfig.storageBucket
});

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
  projectId: projectConfig.projectId,
  credential: admin.credential.applicationDefault()
});

// Clean up resources after tests
afterAll(async () => {
  test.cleanup();
  await admin.app().delete();
});

export { admin, test }; 