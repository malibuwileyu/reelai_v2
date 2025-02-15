import { db } from '../../../config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import type { MilestoneQuizProgress, MilestoneQuizAttempt } from '../types/quizMilestone';
import type { QuestionBank } from '../../quiz/types';

export class QuizMilestoneService {
  static async getQuiz(quizId: string): Promise<QuestionBank | null> {
    try {
      console.log('🎯 Fetching quiz:', quizId);
      const quizRef = doc(db, 'quizzes', quizId);
      const quizDoc = await getDoc(quizRef);
      
      if (!quizDoc.exists()) {
        console.log('❌ Quiz not found:', quizId);
        return null;
      }

      const quiz = quizDoc.data() as Omit<QuestionBank, 'id'>;
      console.log('📚 Quiz data:', quiz);
      return {
        ...quiz,
        id: quizDoc.id
      };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }

  static async getQuizQuestions(quizId: string): Promise<QuestionBank['questions']> {
    try {
      console.log('🎯 Fetching quiz questions for:', quizId);
      const questionsRef = collection(db, 'quizzes', quizId, 'questions');
      const questionsSnapshot = await getDocs(questionsRef);
      
      const questions = questionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as QuestionBank['questions'];

      console.log('📚 Quiz questions:', questions);
      return questions;
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      throw error;
    }
  }

  static async getQuizAttempts(quizId: string, userId: string): Promise<MilestoneQuizAttempt[]> {
    try {
      console.log('🎯 Fetching quiz attempts for user:', userId, 'quiz:', quizId);
      const attemptsRef = collection(db, 'quizAttempts');
      const attemptsQuery = query(
        attemptsRef,
        where('quizId', '==', quizId),
        where('userId', '==', userId)
      );
      
      const attemptsSnapshot = await getDocs(attemptsQuery);
      const attempts = attemptsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as MilestoneQuizAttempt[];

      console.log('📚 Quiz attempts:', attempts);
      return attempts;
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      throw error;
    }
  }
} 