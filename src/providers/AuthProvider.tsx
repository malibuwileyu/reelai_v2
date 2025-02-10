import React, { createContext, useContext, useEffect, useState } from 'react';
import { Auth, signInAnonymously, signInWithEmailAndPassword, signOut, User, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthPersistenceService } from '../services/authPersistence';
import { showToast } from '../utils/toast';
import { COLLECTIONS } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInAnon: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user on mount
    const initializeAuth = async () => {
      try {
        const persistedUser = await AuthPersistenceService.getUser();
        if (persistedUser) {
          setUser(persistedUser as User);
        }
      } catch (error) {
        console.error('Error loading persisted user:', error);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const unsubscribe = (auth as Auth).onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          await AuthPersistenceService.saveUser(user);
          setUser(user);
        } catch (error) {
          console.error('Error saving user:', error);
        }
      } else {
        try {
          await AuthPersistenceService.clearAuth();
          setUser(null);
        } catch (error) {
          console.error('Error clearing auth:', error);
        }
      }
      setLoading(false);
    });

    initializeAuth();
    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('[AuthProvider] Starting sign in for:', email);
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth as Auth, email, password);
      const user = userCredential.user;
      console.log('[AuthProvider] Signed in user:', user.uid);

      // Check if user document exists
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('[AuthProvider] User document not found, creating...');
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || `user_${user.uid}`,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          followers: 0,
          videosCount: 0,
          followingCount: 0,
          profileCompleted: false,
          onboardingCompleted: false,
          accountType: 'user',
          currentStreak: 0,
          longestStreak: 0,
          lastWatchedDate: null,
          preferences: {
            language: 'en',
            theme: 'dark',
            notifications: true
          }
        });
        console.log('[AuthProvider] Created missing user document');
      } else {
        console.log('[AuthProvider] User document exists');
      }

      showToast('Successfully signed in!', 'success');
    } catch (error: any) {
      console.error('[AuthProvider] Sign in error:', error);
      showToast(error.message || 'Failed to sign in', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      console.log('[AuthProvider] Starting sign up for:', email);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('[AuthProvider] Created auth user:', user.uid);

      // Create user document in Firestore
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      console.log('[AuthProvider] Creating user document at:', userDocRef.path);
      
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        displayName: displayName || `user_${user.uid}`,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        followers: 0,
        videosCount: 0,
        followingCount: 0,
        profileCompleted: false,
        onboardingCompleted: false,
        accountType: 'user',
        currentStreak: 0,
        longestStreak: 0,
        lastWatchedDate: null,
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: true
        }
      });
      console.log('[AuthProvider] User document created successfully');

      // Update profile
      await updateProfile(user, {
        displayName: displayName
      });
      console.log('[AuthProvider] Updated user profile');

      // Save to persistence
      await AuthPersistenceService.saveUser(user);
      console.log('[AuthProvider] Saved user to persistence');

      // Set user in state
      setUser(user);
      showToast('Successfully signed up!', 'success');
    } catch (error: any) {
      console.error('[AuthProvider] Signup error:', error);
      showToast(error.message || 'Failed to sign up', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignInAnon = async () => {
    setLoading(true);
    try {
      // Sign in anonymously
      const userCredential = await signInAnonymously(auth as Auth);
      const user = userCredential.user;

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        email: null,
        displayName: `Guest_${user.uid.slice(0, 6)}`,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        followers: 0,
        videosCount: 0,
        followingCount: 0,
        profileCompleted: false,
        onboardingCompleted: false,
        accountType: 'anonymous',
        currentStreak: 0,
        longestStreak: 0,
        lastWatchedDate: null,
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: true
        }
      });

      // Save to persistence
      await AuthPersistenceService.saveUser(user);

      // Set user in state
      setUser(user);
      showToast('Signed in as guest', 'success');
    } catch (error: any) {
      console.error('Anonymous sign in error:', error);
      showToast(error.message || 'Failed to sign in as guest', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth as Auth);
      await AuthPersistenceService.clearAuth();
      showToast('Successfully signed out', 'success');
    } catch (error: any) {
      console.error('Sign out error:', error);
      showToast(error.message || 'Failed to sign out', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInAnon: handleSignInAnon,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}; 