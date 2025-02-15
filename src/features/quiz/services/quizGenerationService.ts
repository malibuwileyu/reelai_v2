import { Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import {
  Question,
  QuestionBank,
  QuizGenerationConfig,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  TimestampReferenceQuestion,
  QuestionType,
  QuestionDifficulty
} from '../types';
import { QuizQualityService } from './quizQualityService';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Mock OpenAI in test environment
if (process.env.NODE_ENV === 'test') {
  jest.mock('openai', () => {
    return {
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify([
                      {
                        id: 'q1',
                        text: 'What is React?',
                        options: ['A library', 'A framework', 'A language', 'A database'],
                        correctAnswer: 0,
                        explanation: 'React is a JavaScript library for building user interfaces.',
                      },
                    ]),
                  },
                },
              ],
            }),
          },
        },
      })),
    };
  });
}

export class QuizGenerationService {
  /**
   * Generate a question bank from video content
   */
  static async generateQuestionBank(
    videoId: string,
    transcript: string,
    config: QuizGenerationConfig,
    metadata: {
      videoTitle: string;
      videoDuration: number;
      transcriptId?: string;
    }
  ): Promise<QuestionBank> {
    try {
      // Extract topics and assess difficulty
      const topics = await this.extractTopics(transcript);
      const assessedDifficulty = await this.assessDifficulty(transcript, config.difficulty);
      
      // Generate initial questions
      const questions = await this.generateQuestionsFromTranscript(
        transcript,
        {
          ...config,
          difficulty: assessedDifficulty,
          preferredTopics: topics,
        }
      );

      // Create initial question bank
      const questionBank: QuestionBank = {
        id: uuidv4(),
        videoId,
        questions,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          ...metadata,
          generationMethod: 'auto',
          averageConfidence: this.calculateAverageConfidence(questions),
          topics,
          assessedDifficulty,
        },
      };

      // Validate and improve question bank
      const validation = await QuizQualityService.validateQuestionBank(questionBank);
      
      if (!validation.isValid || validation.suggestions.length > 0) {
        console.log('Question bank needs improvement:', validation);
        
        // Generate additional questions if needed
        if (validation.issues.includes('Content gaps found')) {
          const additionalQuestions = await this.generateAdditionalQuestions(
            transcript,
            questionBank,
            config
          );
          questionBank.questions.push(...additionalQuestions);
        }

        // Calibrate difficulty
        questionBank.questions = await QuizQualityService.calibrateDifficulty(
          questionBank.questions
        );

        // Update metadata
        questionBank.metadata.averageConfidence = this.calculateAverageConfidence(
          questionBank.questions
        );
      }

      return questionBank;
    } catch (error) {
      console.error('Error generating question bank:', error);
      throw error;
    }
  }

  /**
   * Generate additional questions to fill content gaps
   */
  private static async generateAdditionalQuestions(
    transcript: string,
    questionBank: QuestionBank,
    config: QuizGenerationConfig
  ): Promise<Question[]> {
    try {
      const coverage = await QuizQualityService.analyzeContentCoverage(questionBank);
      
      if (coverage.missingTopics.length === 0) {
        return [];
      }

      // Generate questions focusing on missing topics
      return await this.generateQuestionsFromTranscript(
        transcript,
        {
          ...config,
          targetQuestionCount: coverage.missingTopics.length * 2,
          preferredTopics: coverage.missingTopics,
        }
      );
    } catch (error) {
      console.error('Error generating additional questions:', error);
      return [];
    }
  }

  /**
   * Generate questions from video transcript using OpenAI
   */
  private static async generateQuestionsFromTranscript(
    transcript: string,
    config: QuizGenerationConfig
  ): Promise<Question[]> {
    const questions: Question[] = [];
    const promptsByType: Record<QuestionType, string> = {
      multiple_choice: this.getMultipleChoicePrompt(transcript, config.difficulty),
      true_false: this.getTrueFalsePrompt(transcript, config.difficulty),
      fill_in_blank: this.getFillInBlankPrompt(transcript, config.difficulty),
      code_completion: this.getCodeCompletionPrompt(transcript, config.difficulty),
      timestamp_reference: this.getTimestampReferencePrompt(transcript, config.difficulty),
    };

    // Generate questions for each requested type
    for (const questionType of config.questionTypes) {
      const targetCount = Math.ceil(config.targetQuestionCount / config.questionTypes.length);
      const prompt = promptsByType[questionType];

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert educational content creator specializing in creating high-quality assessment questions."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        const generatedQuestions = this.parseOpenAIResponse(
          response.choices[0].message.content || '',
          questionType,
          config.difficulty
        );

        questions.push(...generatedQuestions.slice(0, targetCount));
      } catch (error) {
        console.error(`Error generating ${questionType} questions:`, error);
      }
    }

    return questions;
  }

  /**
   * Get prompt for multiple choice questions
   */
  private static getMultipleChoicePrompt(transcript: string, difficulty: QuestionDifficulty): string {
    return `
      Based on the following video transcript, generate multiple choice questions.
      Difficulty level: ${difficulty}
      
      For each question:
      1. Create a clear, concise question that tests understanding
      2. Provide 4 options, with only one correct answer
      3. Make distractors plausible but clearly incorrect
      4. Include explanations for why each incorrect option is wrong
      5. Focus on key concepts and their relationships
      6. Avoid obvious or trivial questions
      
      Transcript:
      ${transcript}
      
      Format each question as JSON:
      {
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correctOptionIndex": 0,
        "distractorExplanations": ["...", "...", "..."],
        "explanation": "..."
      }
    `;
  }

  /**
   * Get prompt for true/false questions
   */
  private static getTrueFalsePrompt(transcript: string, difficulty: QuestionDifficulty): string {
    return `
      Based on the following video transcript, generate true/false questions.
      Difficulty level: ${difficulty}
      
      For each question:
      1. Create a clear statement that is either true or false
      2. Include an explanation of why it's true or false
      3. Ensure statements test understanding, not just recall
      
      Transcript:
      ${transcript}
      
      Format each question as JSON:
      {
        "question": "...",
        "correctAnswer": true,
        "explanation": "..."
      }
    `;
  }

  /**
   * Get prompt for fill-in-blank questions
   */
  private static getFillInBlankPrompt(transcript: string, difficulty: QuestionDifficulty): string {
    return `
      Based on the following video transcript, generate fill-in-the-blank questions.
      Difficulty level: ${difficulty}
      
      For each question:
      1. Split a sentence into before and after parts around the blank
      2. Provide the correct answer
      3. Include alternative acceptable answers if applicable
      4. Add an explanation of why the answer is correct
      
      Transcript:
      ${transcript}
      
      Format each question as JSON:
      {
        "textBefore": "...",
        "textAfter": "...",
        "correctAnswer": "...",
        "acceptableAnswers": ["...", "..."],
        "explanation": "..."
      }
    `;
  }

  /**
   * Get prompt for timestamp reference questions
   */
  private static getTimestampReferencePrompt(transcript: string, difficulty: QuestionDifficulty): string {
    return `
      Based on the following video transcript with timestamps, generate questions that reference specific moments.
      Difficulty level: ${difficulty}
      
      For each question:
      1. Reference a specific timestamp where an important concept is explained
      2. Create a question that requires understanding the context
      3. Include multiple choice options that test comprehension
      4. Make distractors relate to the specific moment
      5. Add explanations that reference the video content
      
      Transcript:
      ${transcript}
      
      Format each question as JSON:
      {
        "question": "At [timestamp], the instructor explains X. What is the key insight about...?",
        "timestamp": 123,
        "options": ["...", "...", "...", "..."],
        "correctOptionIndex": 0,
        "explanation": "..."
      }
    `;
  }

  /**
   * Get prompt for code completion questions
   */
  private static getCodeCompletionPrompt(transcript: string, difficulty: QuestionDifficulty): string {
    return `
      Based on the following video transcript about coding, generate code completion questions.
      Difficulty level: ${difficulty}
      
      For each question:
      1. Provide code context with a missing line
      2. Indicate the line number that needs to be completed
      3. Provide the correct code answer
      4. Add test cases to verify the answer
      
      Transcript:
      ${transcript}
      
      Format each question as JSON:
      {
        "codeContext": "...",
        "blankLineNumber": 3,
        "correctAnswer": "...",
        "testCases": [
          {
            "input": "...",
            "expectedOutput": "..."
          }
        ],
        "explanation": "..."
      }
    `;
  }

  /**
   * Parse OpenAI response into structured questions
   */
  private static parseOpenAIResponse(
    response: string,
    type: QuestionType,
    difficulty: QuestionDifficulty
  ): Question[] {
    try {
      // Extract JSON objects from response
      const jsonMatches = response.match(/\{[\s\S]*?\}/g) || [];
      const questions: Question[] = [];

      for (const jsonStr of jsonMatches) {
        try {
          const parsed = JSON.parse(jsonStr);
          const baseQuestion = {
            id: uuidv4(),
            type,
            difficulty,
            tags: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            creatorId: 'system',
            isAutogenerated: true,
            confidence: 0.8, // Default confidence score
          };

          switch (type) {
            case 'multiple_choice':
              questions.push({
                ...baseQuestion,
                question: parsed.question,
                options: parsed.options,
                correctOptionIndex: parsed.correctOptionIndex,
                distractorExplanations: parsed.distractorExplanations,
                explanation: parsed.explanation,
              } as MultipleChoiceQuestion);
              break;

            case 'true_false':
              questions.push({
                ...baseQuestion,
                question: parsed.question,
                correctAnswer: parsed.correctAnswer,
                explanation: parsed.explanation,
              } as TrueFalseQuestion);
              break;

            case 'fill_in_blank':
              questions.push({
                ...baseQuestion,
                question: `${parsed.textBefore} _____ ${parsed.textAfter}`,
                textBefore: parsed.textBefore,
                textAfter: parsed.textAfter,
                correctAnswer: parsed.correctAnswer,
                acceptableAnswers: parsed.acceptableAnswers,
                explanation: parsed.explanation,
              } as FillInBlankQuestion);
              break;

            case 'timestamp_reference':
              questions.push({
                ...baseQuestion,
                question: parsed.question,
                timestamp: parsed.timestamp,
                options: parsed.options,
                correctOptionIndex: parsed.correctOptionIndex,
                explanation: parsed.explanation,
                videoId: parsed.videoId || '',
              } as TimestampReferenceQuestion);
              break;
          }
        } catch (error) {
          console.error('Error parsing question JSON:', error);
        }
      }

      return questions;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return [];
    }
  }

  /**
   * Calculate average confidence score for a set of questions
   */
  private static calculateAverageConfidence(questions: Question[]): number {
    if (questions.length === 0) return 0;
    
    const sum = questions.reduce((acc, q) => acc + (q.confidence || 0), 0);
    return sum / questions.length;
  }

  /**
   * Extract main topics from transcript
   */
  private static async extractTopics(transcript: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing educational content and extracting key topics and concepts."
          },
          {
            role: "user",
            content: `
              Analyze this transcript and extract the main topics covered.
              Return the topics as a JSON array of strings, with each topic being specific and relevant for quiz generation.
              Focus on core concepts that could be tested.
              Limit to 5-7 most important topics.

              Transcript:
              ${transcript}
            `
          }
        ],
        temperature: 0.3, // Lower temperature for more focused results
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const topics = JSON.parse(response.choices[0].message.content || '{"topics": []}').topics;
      return topics;
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }

  /**
   * Assess content difficulty and adjust if needed
   */
  private static async assessDifficulty(
    transcript: string,
    requestedDifficulty: QuestionDifficulty
  ): Promise<QuestionDifficulty> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at assessing educational content difficulty."
          },
          {
            role: "user",
            content: `
              Analyze this transcript and assess its difficulty level.
              Consider:
              1. Technical complexity of concepts
              2. Prerequisite knowledge required
              3. Language complexity
              4. Depth of subject matter

              Return a JSON object with:
              {
                "assessedDifficulty": "beginner" | "intermediate" | "advanced",
                "confidence": 0-1,
                "reasoning": "brief explanation"
              }

              The requested difficulty is: ${requestedDifficulty}
              Only suggest a different difficulty if the content strongly indicates it would be more appropriate.

              Transcript:
              ${transcript}
            `
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Only override requested difficulty if we're very confident
      if (result.confidence > 0.8 && result.assessedDifficulty !== requestedDifficulty) {
        console.log(`Adjusting difficulty from ${requestedDifficulty} to ${result.assessedDifficulty} (${result.reasoning})`);
        return result.assessedDifficulty;
      }

      return requestedDifficulty;
    } catch (error) {
      console.error('Error assessing difficulty:', error);
      return requestedDifficulty;
    }
  }
} 