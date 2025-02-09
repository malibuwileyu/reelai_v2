import { useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInAnonymously,
  updateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { showToast } from '../utils/toast';
import { AuthPersistenceService } from '../services/authPersistence';

interface AuthError {
  code: string;
  message: string;
}

interface UseAuth {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  signInAnon: () => Promise<User>;
  refreshUser: () => void;
  updateEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const auth = getAuth();

  useEffect(() => {
    // Check for persisted user on mount
    AuthPersistenceService.getUser().then(persistedUser => {
      if (persistedUser) {
        setUser(persistedUser as User);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Persist user data
        await AuthPersistenceService.saveUser(user);
        setUser(user);
      } else {
        // Clear persisted data
        await AuthPersistenceService.clearAuth();
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Force refresh the user object
  const refreshUser = () => {
    if (auth.currentUser) {
      setUser({ ...auth.currentUser });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await AuthPersistenceService.saveUser(result.user);
      showToast('Successfully signed in!', 'success');
      return result.user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      await AuthPersistenceService.saveUser(result.user);
      showToast('Account created successfully!', 'success');
      return result.user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInAnon = async () => {
    try {
      const result = await signInAnonymously(auth);
      await AuthPersistenceService.saveUser(result.user);
      showToast('Signed in anonymously', 'success');
      return result.user;
    } catch (error: any) {
      console.error('Anonymous sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await AuthPersistenceService.clearAuth();
      showToast('Signed out successfully', 'success');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    try {
      setError(null);
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message || 'An unknown error occurred',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (newEmail: string, currentPassword: string) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('User not authenticated or no email set');
      }

      // Re-authenticate user before email change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await firebaseUpdateEmail(user, newEmail);
      await AuthPersistenceService.saveUser(user);
      refreshUser();
    } catch (error) {
      console.error('Update email error:', error);
      
      if (error instanceof Error && error.message.includes('auth/operation-not-allowed')) {
        throw new Error(
          'Email changes are currently disabled. This feature requires email verification to be set up. ' +
          'Please contact support or try again later.'
        );
      }
      
      throw error as AuthError;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('User not authenticated or no email set');
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await firebaseUpdatePassword(user, newPassword);
      await AuthPersistenceService.saveUser(user);
      refreshUser();
    } catch (error) {
      console.error('Update password error:', error);
      throw error as AuthError;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInAnon,
    refreshUser,
    updateEmail,
    updatePassword,
  };
} 