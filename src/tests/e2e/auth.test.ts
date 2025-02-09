import { auth } from '../../config/firebase';
import { FirebaseError } from 'firebase/app';
import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from 'firebase/auth';

describe('Firebase Authentication E2E Tests', () => {
  // Clean up after each test
  afterEach(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteUser(user);
      } catch (error) {
        console.warn('Error cleaning up test user:', error);
      }
    }
    await signOut(auth).catch(() => {});
  });

  it('should initialize Firebase correctly', () => {
    expect(auth).toBeDefined();
    expect(auth.app).toBeDefined();
  });

  it('should handle anonymous sign-in', async () => {
    const userCred = await signInAnonymously(auth);
    expect(userCred.user).toBeDefined();
    expect(userCred.user.isAnonymous).toBe(true);
  });

  it('should handle sign-up with email', async () => {
    const email = `test${Date.now()}@example.com`;
    const password = 'Test123!';

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    expect(userCred.user).toBeDefined();
    expect(userCred.user.email).toBe(email);
  });

  it('should handle sign-in with email', async () => {
    // First create a test user
    const email = `test${Date.now()}@example.com`;
    const password = 'Test123!';
    
    await createUserWithEmailAndPassword(auth, email, password);
    await signOut(auth);

    // Then test sign in
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    expect(userCred.user).toBeDefined();
    expect(userCred.user.email).toBe(email);
  });

  it('should handle sign-out', async () => {
    // First sign in
    await signInAnonymously(auth);
    expect(auth.currentUser).toBeDefined();

    // Then sign out
    await signOut(auth);
    expect(auth.currentUser).toBeNull();
  });
}); 