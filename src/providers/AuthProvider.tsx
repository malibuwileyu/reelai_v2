import React, { createContext, useContext, useEffect, useState } from 'react';
import { Auth, signInAnonymously, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthPersistenceService } from '../services/authPersistence';
import { showToast } from '../utils/toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
      await signInWithEmailAndPassword(auth as Auth, email, password);
      showToast('Successfully signed in!', 'success');
    } catch (error: any) {
      console.error('Sign in error:', error);
      showToast(error.message || 'Failed to sign in', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignInAnon = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth as Auth);
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