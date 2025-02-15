import { QuizGenerationService } from '../services/quizGenerationService';
import { QuestionBankService } from '../services/questionBankService';
import { REACT_FUNDAMENTALS, TEST_CONFIGS } from './data/testData';
import type { Question, QuestionType, QuestionDifficulty, MultipleChoiceQuestion, TrueFalseQuestion, FillInBlankQuestion } from '../types';

// This is a true E2E test that uses the real OpenAI API
describe('Quiz Generation E2E', () => {
  // Increase timeout for API calls
  jest.setTimeout(30000);

  // Skip tests if no API key is provided
  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ Skipping E2E tests: No OpenAI API key provided');
      return;
    }
    console.log('🚀 Running E2E tests with OpenAI API');
  });

  it('generates high-quality questions from transcript', async () => {
    if (!process.env.OPENAI_API_KEY) {
      return;
    }

    const config = {
      targetQuestionCount: 3,
      questionTypes: ['multiple_choice', 'true_false', 'fill_in_blank'] as QuestionType[],
      difficulty: 'intermediate' as QuestionDifficulty,
      includeTimestampReferences: false,
      minConfidenceScore: 0.7,
    };

    const questionBank = await QuizGenerationService.generateQuestionBank(
      'test-video-id',
      REACT_FUNDAMENTALS, // Use our test transcript
      config,
      {
        videoTitle: 'React Fundamentals E2E Test',
        videoDuration: 300,
      }
    );

    // Validate question bank structure
    expect(questionBank).toHaveProperty('id');
    expect(questionBank).toHaveProperty('videoId', 'test-video-id');
    expect(questionBank).toHaveProperty('questions');
    expect(questionBank).toHaveProperty('metadata');
    expect(questionBank.metadata.generationMethod).toBe('auto');

    // Validate questions array
    expect(Array.isArray(questionBank.questions)).toBe(true);
    expect(questionBank.questions.length).toBeGreaterThanOrEqual(config.targetQuestionCount);

    // Validate each question
    questionBank.questions.forEach(question => {
      // Common validations
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('type');
      expect(question).toHaveProperty('difficulty', config.difficulty);
      expect(question).toHaveProperty('explanation');
      expect(question.explanation?.length).toBeGreaterThan(50);
      expect(config.questionTypes).toContain(question.type);

      // Type-specific validations
      switch (question.type) {
        case 'multiple_choice': {
          const mcq = question as MultipleChoiceQuestion;
          expect(mcq.options).toHaveLength(4);
          expect(mcq.correctOptionIndex).toBeGreaterThanOrEqual(0);
          expect(mcq.correctOptionIndex).toBeLessThan(4);
          expect(mcq.distractorExplanations).toHaveLength(3);
          break;
        }
        case 'true_false': {
          const tfq = question as TrueFalseQuestion;
          expect(typeof tfq.correctAnswer).toBe('boolean');
          break;
        }
        case 'fill_in_blank': {
          const fibq = question as FillInBlankQuestion;
          expect(fibq.textBefore).toBeTruthy();
          expect(fibq.textAfter).toBeTruthy();
          expect(fibq.correctAnswer).toBeTruthy();
          expect(Array.isArray(fibq.acceptableAnswers)).toBe(true);
          expect(fibq.acceptableAnswers?.length).toBeGreaterThan(0);
          break;
        }
      }
    });

    // Store and verify persistence
    const storedBank = await QuestionBankService.createQuestionBank(questionBank);
    expect(storedBank.id).toBeTruthy();

    // Clean up
    await QuestionBankService.deleteQuestionBank(storedBank.id);
  });

  it('generates questions at different difficulty levels', async () => {
    if (!process.env.OPENAI_API_KEY) {
      return;
    }

    const difficulties: QuestionDifficulty[] = ['beginner', 'intermediate', 'advanced'];
    
    for (const difficulty of difficulties) {
      console.log(`Testing ${difficulty} difficulty...`);
      
      const config = TEST_CONFIGS[difficulty];
      const questionBank = await QuizGenerationService.generateQuestionBank(
        'test-video-id',
        REACT_FUNDAMENTALS,
        config,
        {
          videoTitle: `React Fundamentals ${difficulty} E2E Test`,
          videoDuration: 300,
        }
      );

      // Verify questions match requested difficulty
      expect(questionBank.questions.length).toBeGreaterThan(0);
      questionBank.questions.forEach(question => {
        expect(question.difficulty).toBe(difficulty);
      });

      // Store and clean up
      const storedBank = await QuestionBankService.createQuestionBank(questionBank);
      await QuestionBankService.deleteQuestionBank(storedBank.id);
    }
  });

  it('handles errors gracefully', async () => {
    if (!process.env.OPENAI_API_KEY) {
      return;
    }

    const config = {
      targetQuestionCount: 2,
      questionTypes: ['multiple_choice'] as QuestionType[],
      difficulty: 'intermediate' as QuestionDifficulty,
      includeTimestampReferences: false,
      minConfidenceScore: 0.7,
    };

    // Test with empty transcript
    const emptyTranscriptResult = await QuizGenerationService.generateQuestionBank(
      'test-video-id',
      '',
      config,
      {
        videoTitle: 'Empty Transcript Test',
        videoDuration: 300,
      }
    );

    // Verify empty transcript results in no questions
    expect(emptyTranscriptResult.questions).toHaveLength(0);

    // Test with invalid difficulty
    await expect(
      QuizGenerationService.generateQuestionBank(
        'test-video-id',
        'Some transcript content',
        {
          ...config,
          difficulty: 'invalid' as QuestionDifficulty,
        },
        {
          videoTitle: 'Invalid Difficulty Test',
          videoDuration: 300,
        }
      )
    ).rejects.toThrow();

    // Test with invalid question type
    await expect(
      QuizGenerationService.generateQuestionBank(
        'test-video-id',
        'Some transcript content',
        {
          ...config,
          questionTypes: ['invalid_type' as unknown as QuestionType],
        },
        {
          videoTitle: 'Invalid Question Type Test',
          videoDuration: 300,
        }
      )
    ).rejects.toThrow();
  });
}); 