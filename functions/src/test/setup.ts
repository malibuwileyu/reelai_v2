import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import { afterAll } from '@jest/globals';

const projectConfig = {
  projectId: 'demo-project'
};

// Initialize the firebase-functions-test SDK without credentials (for emulator use)
const test = functionsTest(undefined, undefined);

// Initialize Firebase Admin
admin.initializeApp(projectConfig);

// Clean up resources after tests
afterAll(async () => {
  test.cleanup();
  await admin.app().delete();
});

export { admin, test }; 