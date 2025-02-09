/// <reference types="jest" />
import '@testing-library/jest-native/extend-expect';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Debug: Log all environment variables
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
});

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase Config:', firebaseConfig);

// Initialize Firebase for testing
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use auth emulator in test environment
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

// Use Firestore emulator in test environment
connectFirestoreEmulator(db, 'localhost', 8080);

// Global test setup
global.beforeAll(() => {
  // Add any global test setup here
  console.log('Using Firebase config:', {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✓ present' : '✗ missing',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ present' : '✗ missing',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✓ present' : '✗ missing',
  });
});

global.afterAll(() => {
  // Add any global test cleanup here
}); 