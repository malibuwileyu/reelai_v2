import { auth } from '../config/firebase';
import { getAuth, signInAnonymously } from 'firebase/auth';

export const testFirebaseConnection = async () => {
  try {
    // Test 1: Check if auth is initialized
    console.log('🔍 Firebase Auth Test:');
    console.log('1. Auth Initialization:', {
      isInitialized: !!auth,
      config: auth.config,
      currentUser: auth.currentUser ? 'exists' : 'none'
    });

    // Test 2: Try anonymous sign in to verify API key and project
    console.log('\n2. Testing Anonymous Auth:');
    const anonResult = await signInAnonymously(auth);
    console.log('Anonymous auth successful:', {
      uid: anonResult.user.uid,
      isAnonymous: anonResult.user.isAnonymous
    });

    return {
      success: true,
      auth: {
        initialized: true,
        anonymousAuthWorking: true
      }
    };
  } catch (error: any) {
    console.error('\n❌ Firebase Test Failed:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
}; 