import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import type { QuestionBank } from '../types';

const COLLECTION_NAME = 'questionBanks';

export class QuestionBankService {
  /**
   * Create a new question bank
   */
  static async createQuestionBank(questionBank: Omit<QuestionBank, 'id'>): Promise<QuestionBank> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...questionBank,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        ...questionBank,
        id: docRef.id,
      } as QuestionBank;
    } catch (error) {
      console.error('Error creating question bank:', error);
      throw error;
    }
  }

  /**
   * Get a question bank by ID
   */
  static async getQuestionBank(id: string): Promise<QuestionBank | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        ...docSnap.data(),
        id: docSnap.id,
      } as QuestionBank;
    } catch (error) {
      console.error('Error getting question bank:', error);
      throw error;
    }
  }

  /**
   * Get all question banks for a video
   */
  static async getQuestionBanksForVideo(videoId: string): Promise<QuestionBank[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('videoId', '==', videoId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as QuestionBank[];
    } catch (error) {
      console.error('Error getting question banks for video:', error);
      throw error;
    }
  }

  /**
   * Update a question bank
   */
  static async updateQuestionBank(
    id: string,
    updates: Partial<Omit<QuestionBank, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating question bank:', error);
      throw error;
    }
  }

  /**
   * Delete a question bank
   */
  static async deleteQuestionBank(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting question bank:', error);
      throw error;
    }
  }

  /**
   * Get question banks by metadata criteria
   */
  static async searchQuestionBanks(criteria: {
    generationMethod?: 'auto' | 'manual' | 'hybrid';
    minConfidence?: number;
    videoTitle?: string;
  }): Promise<QuestionBank[]> {
    try {
      let q = query(collection(db, COLLECTION_NAME));

      if (criteria.generationMethod) {
        q = query(q, where('metadata.generationMethod', '==', criteria.generationMethod));
      }

      if (criteria.minConfidence) {
        q = query(q, where('metadata.averageConfidence', '>=', criteria.minConfidence));
      }

      if (criteria.videoTitle) {
        q = query(q, where('metadata.videoTitle', '==', criteria.videoTitle));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as QuestionBank[];
    } catch (error) {
      console.error('Error searching question banks:', error);
      throw error;
    }
  }
} 