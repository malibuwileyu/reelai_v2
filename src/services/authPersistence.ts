import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';

const AUTH_USER_KEY = '@auth_user';

export class AuthPersistenceService {
  static async saveUser(user: User): Promise<void> {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
      };
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  static async getUser(): Promise<Partial<User> | null> {
    try {
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }
} 