import mockAsyncStorage from './mocks/asyncStorage';
import { mockFFmpeg, mockFFmpegUtils } from './mocks/ffmpeg';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock FFmpeg
jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => mockFFmpeg)
}));

jest.mock('@ffmpeg/util', () => mockFFmpegUtils);

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(),
  getApps: jest.fn(() => [])
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInAnonymously: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-user-id',
      email: null,
      isAnonymous: true
    }
  }))
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  onSnapshot: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn()
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: {
    create: jest.fn()
  }
}));

jest.mock('expo-av', () => ({
  Video: 'Video',
  Audio: {
    Sound: {
      createAsync: jest.fn()
    }
  }
}));

jest.mock('expo-video-thumbnails', () => ({
  getThumbnailAsync: jest.fn()
}));

// Mock fetch for Firebase Rules Testing
global.fetch = jest.fn(() => 
  Promise.resolve(new Response(JSON.stringify({}), {
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  }))
);

// Mock environment variables
Object.assign(process.env, {
  FIREBASE_API_KEY: 'test-api-key',
  FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: '123456789',
  FIREBASE_APP_ID: '1:123456789:web:abcdef',
  OPENAI_API_KEY: 'test-openai-key'
}); 