import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { LearningPathService } from '../src/features/learning-path/services/learningPathService';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Check environment
console.log('Firebase configuration:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function updatePath() {
  try {
    // Sign in with test account
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      throw new Error('Test credentials not found in environment');
    }

    console.log('Signing in with test account:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Signed in successfully:', userCredential.user.uid);

    const pathId = process.argv[2];
    if (!pathId) {
      throw new Error('Path ID is required');
    }

    console.log('Updating learning path:', pathId);

    const path = await LearningPathService.getPath(pathId);
    if (!path) {
      throw new Error('Path not found');
    }

    // Update the first milestone with the video content
    const updatedMilestones = path.milestones.map(milestone => {
      if (milestone.order === 1) {
        return {
          ...milestone,
          content: [
            {
              type: 'video' as const,
              videoId: 'intro-react-native-101',
              title: 'Introduction to React Native Development',
              description: 'Learn the fundamentals of React Native development, including setup, components, and basic concepts.',
              duration: 180000, // 3 minutes in milliseconds
              order: 0,
              isRequired: true,
              videoUrl: 'https://storage.googleapis.com/reel-videos/intro-react-native.mp4',
            },
            {
              type: 'quiz' as const,
              quizId: 'intro-react-native-101-quiz',
              title: 'React Native Fundamentals Quiz',
              description: 'Test your understanding of React Native basics',
              timeLimit: 600000, // 10 minutes in milliseconds
              passingScore: 70,
              order: 1,
              isRequired: true
            }
          ],
          unlockCriteria: {
            requiredVideos: ['intro-react-native-101']
          }
        };
      }
      return milestone;
    });

    await LearningPathService.updatePath(pathId, {
      ...path,
      milestones: updatedMilestones
    });

    console.log('✅ Learning path updated successfully');
  } catch (error) {
    console.error('Error updating learning path:', error);
    process.exit(1);
  }
}

updatePath(); 