import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { User } from '../models/User';

const COLLECTION = 'users';

export class UserService {
  /**
   * Get a user by ID
   */
  static async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }

      return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Get multiple users by IDs
   */
  static async getUsers(userIds: string[]): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTION);
      const q = query(usersRef, where('id', 'in', userIds));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION, userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
} 