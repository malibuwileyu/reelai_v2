import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  FirestoreError
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { LearningPath, LearningPathProgress } from '../types';

const COLLECTION = {
  PATHS: 'learningPaths',
  PROGRESS: 'learningPathProgress'
} as const;

/**
 * Service for managing learning paths in Firebase
 */
export class LearningPathService {
  /**
   * Create a new learning path
   */
  static async createPath(path: Omit<LearningPath, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('📝 Creating learning path:', path);
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION.PATHS), {
        ...path,
        createdAt: now,
        updatedAt: now
      });
      console.log('✅ Created learning path with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating learning path:', error);
      throw error;
    }
  }

  /**
   * Get a learning path by ID
   */
  static async getPath(pathId: string): Promise<LearningPath | null> {
    try {
      console.log('🔍 Getting learning path:', pathId);
      const docRef = doc(db, COLLECTION.PATHS, pathId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('⚠️ Learning path not found:', pathId);
        return null;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as LearningPath;
      console.log('📚 Retrieved learning path:', data);
      return data;
    } catch (error) {
      console.error('❌ Error getting learning path:', error);
      throw error;
    }
  }

  /**
   * Get all public learning paths
   */
  static async getPublicPaths(): Promise<LearningPath[]> {
    try {
      console.log('🔍 Getting public learning paths');
      const q = query(
        collection(db, COLLECTION.PATHS),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const paths = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LearningPath[];
      console.log('📚 Retrieved public paths:', paths.length);
      return paths;
    } catch (error) {
      console.error('❌ Error getting public paths:', error);
      throw error;
    }
  }

  /**
   * Get learning paths by creator
   */
  static async getPathsByCreator(creatorId: string): Promise<LearningPath[]> {
    try {
      console.log('🔍 Getting paths for creator:', creatorId);
      const q = query(
        collection(db, COLLECTION.PATHS),
        where('creatorId', '==', creatorId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const paths = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LearningPath[];
      console.log('📚 Retrieved creator paths:', paths.length);
      return paths;
    } catch (error) {
      console.error('❌ Error getting creator paths:', error);
      throw error;
    }
  }

  /**
   * Update a learning path
   */
  static async updatePath(pathId: string, updates: Partial<LearningPath>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION.PATHS, pathId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating learning path:', error);
      throw error;
    }
  }

  /**
   * Delete a learning path
   */
  static async deletePath(pathId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION.PATHS, pathId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting learning path:', error);
      throw error;
    }
  }

  /**
   * Get progress for a learning path
   */
  static async getProgress(userId: string, pathId: string): Promise<LearningPathProgress | null> {
    try {
      console.log('🔍 Getting progress for user:', userId, 'path:', pathId);
      const docRef = doc(db, COLLECTION.PROGRESS, `${userId}_${pathId}`);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('⚠️ No progress found');
        return null;
      }

      const data = docSnap.data();
      const progressData: LearningPathProgress = {
        userId,
        pathId,
        currentMilestoneId: data.currentMilestoneId,
        completedMilestones: data.completedMilestones || [],
        completedVideos: data.completedVideos || [],
        quizScores: data.quizScores || {},
        startedAt: data.startedAt,
        lastAccessedAt: data.lastAccessedAt,
        completedAt: data.completedAt
      };
      console.log('📊 Retrieved progress:', progressData);
      return progressData;
    } catch (error) {
      console.error('❌ Error getting progress:', error);
      throw error;
    }
  }

  /**
   * Update user's progress for a learning path
   */
  static async updateProgress(
    userId: string,
    pathId: string,
    updates: Partial<LearningPathProgress>
  ): Promise<void> {
    try {
      console.log('✏️ Updating progress for user:', userId, 'path:', pathId);
      const docRef = doc(db, COLLECTION.PROGRESS, `${userId}_${pathId}`);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('✅ Progress updated successfully');
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }
  }
} 