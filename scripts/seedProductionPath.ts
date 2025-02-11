import 'dotenv/config';  // Add this at the top
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../src/config/firebase';

// Log to verify environment variables are loaded
console.log('Environment check:', {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? '✓' : '✗',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? '✓' : '✗'
});

const samplePath = {
  title: "Introduction to React Native",
  description: "Learn the fundamentals of building mobile apps with React Native. This comprehensive path will take you from basics to building your first app.",
  difficulty: "beginner",
  estimatedHours: 10,
  prerequisites: [
    "Basic JavaScript knowledge",
    "Familiarity with React concepts",
    "Understanding of mobile app development principles"
  ],
  milestones: [
    {
      id: "m1",
      title: "Getting Started",
      description: "Set up your development environment and understand React Native basics",
      order: 1,
      content: [
        {
          type: "video",
          videoId: "v1",
          title: "Setting Up Your Environment",
          description: "Learn how to set up React Native development environment",
          duration: 1800, // 30 minutes
          order: 1,
          isRequired: true
        },
        {
          type: "quiz",
          quizId: "q1",
          title: "Environment Setup Quiz",
          description: "Test your knowledge of the development environment setup",
          timeLimit: 600, // 10 minutes
          passingScore: 80,
          order: 2,
          isRequired: true
        }
      ],
      requiredScore: 80,
      unlockCriteria: {
        requiredVideos: ["v1"],
        requiredQuizzes: ["q1"]
      }
    }
  ],
  creatorId: "sample_creator",
  isPublic: true,
  category: "Mobile Development",
  tags: ["react-native", "mobile", "javascript", "beginner"],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

async function seedSamplePath() {
  try {
    console.log('Authenticating...');
    // Sign in with test user from .env
    await signInWithEmailAndPassword(auth, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
    console.log('Authentication successful');

    console.log('Creating sample learning path...');
    const docRef = await addDoc(collection(db, 'learningPaths'), samplePath);
    console.log('Sample learning path created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Execute and handle errors
seedSamplePath()
  .then(pathId => {
    console.log('Successfully created path with ID:', pathId);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create path:', error);
    process.exit(1);
  }); 