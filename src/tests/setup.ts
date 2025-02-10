/// <reference types="jest" />
import '@testing-library/jest-native/extend-expect';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, FirestoreSettings } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Add type declaration for global
declare global {
  var wrapFirestoreData: <T extends Record<string, unknown>>(data: T) => T & { testEnv: boolean };
}

// Debug: Log all environment variables
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
});

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'test-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'test-project',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

console.log('Firebase Config:', firebaseConfig);

// Clean up any existing Firebase apps
getApps().forEach(app => {
  deleteApp(app).catch(console.error);
});

// Initialize Firebase for testing
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific settings for tests
const firestoreSettings: FirestoreSettings = {
  experimentalForceLongPolling: true,
};

const db = initializeFirestore(app, firestoreSettings);

const auth = getAuth(app);
const storage = getStorage(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8080);
connectStorageEmulator(storage, 'localhost', 9199);

// Wrap Firestore operations to add test environment flag
const wrapOperation = <T extends Record<string, unknown>>(data: T): T & { testEnv: boolean } => {
  return { ...data, testEnv: true };
};

// Mock Firestore methods globally
global.wrapFirestoreData = wrapOperation;

// Global test setup
global.beforeAll(() => {
  // Add any global test setup here
  console.log('Using Firebase config:', {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✓ present' : '✗ missing',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ present' : '✗ missing',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✓ present' : '✗ missing',
  });
});

global.afterAll(async () => {
  // Clean up Firebase apps
  const apps = getApps();
  await Promise.all(apps.map(app => deleteApp(app)));
}); 