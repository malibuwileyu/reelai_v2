import { OpenAI } from 'openai';
import { 
  Question, 
  QuestionType, 
  QuestionDifficulty, 
  MultipleChoiceQuestion, 
  TrueFalseQuestion, 
  FillInBlankQuestion, 
  TimestampReferenceQuestion,
  QuestionBank 
} from '../types';
import { openai } from './openaiService';

interface QuestionBankValidation {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

interface CalibrationResult {
  suggestedDifficulty: QuestionDifficulty;
  confidence: number;
  reasoning: string;
  suggestions: string[];
}

export class QuizQualityService {
  private static openai: OpenAI;

  static initialize(apiKey: string) {
    this.openai = openai;
  }

  static async evaluateQuestion(question: Question) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a quiz quality evaluator. Analyze the given question and provide feedback.'
          },
          {
            role: 'user',
            content: `Evaluate this question:
${JSON.stringify(question, null, 2)}`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      return JSON.parse(content);
    } catch (error) {
      console.error('Error evaluating question:', error);
      throw error;
    }
  }

  static async validateQuestionBank(questions: Question[]): Promise<QuestionBankValidation> {
    try {
      console.log('Validating question bank:', questions);
      
      const validation: QuestionBankValidation = {
        isValid: true,
        issues: [],
        suggestions: []
      };

      // Check if there are any questions
      if (!questions || questions.length === 0) {
        validation.isValid = false;
        validation.issues.push('Question bank has no questions');
        validation.suggestions.push('Generate at least one question');
        return validation;
      }

      // Check question types distribution
      const typeCount = new Map<QuestionType, number>();
      questions.forEach((q: Question) => {
        typeCount.set(q.type, (typeCount.get(q.type) || 0) + 1);
      });

      if (typeCount.size < 2) {
        validation.suggestions.push('Consider adding more question types for variety');
      }

      // Validate individual questions
      questions.forEach((question: Question, index: number) => {
        const questionNumber = index + 1;
        
        // Check question text or fill in blank text
        if (question.type === 'fill_in_blank') {
          const fibq = question as FillInBlankQuestion;
          if (!fibq.textBefore || !fibq.textAfter) {
            validation.issues.push(`Question ${questionNumber}: Fill in blank question must have text before and after the blank`);
            validation.isValid = false;
          } else {
            // Check context completeness
            if (fibq.textBefore.trim().length < 10 || fibq.textAfter.trim().length < 10) {
              validation.issues.push(`Question ${questionNumber}: Fill in blank context is too short`);
              validation.isValid = false;
            }
          }
        } else {
          if (!question.question || question.question.trim().length < 10) {
            validation.issues.push(`Question ${questionNumber}: Question text is too short or missing`);
            validation.isValid = false;
          }
        }

        // Check explanation length and quality
        if (!question.explanation) {
          validation.issues.push(`Question ${questionNumber}: Explanation is missing`);
          validation.isValid = false;
        } else {
          const explanation = question.explanation.trim();
          if (explanation.length < 50) {
            validation.issues.push(`Question ${questionNumber}: Explanation is too short (minimum 50 characters)`);
            validation.isValid = false;
          }
          if (!explanation.includes('.') || explanation.split('.').length < 2) {
            validation.issues.push(`Question ${questionNumber}: Explanation should have at least 2 sentences`);
            validation.isValid = false;
          }
        }

        // Type-specific validation
        switch (question.type) {
          case 'multiple_choice': {
            const mcq = question as MultipleChoiceQuestion;
            
            // Validate options
            if (!mcq.options || mcq.options.length !== 4) {
              validation.issues.push(`Question ${questionNumber}: Multiple choice question must have exactly 4 options`);
              validation.isValid = false;
            } else {
              // Check for duplicate options
              const uniqueOptions = new Set(mcq.options);
              if (uniqueOptions.size !== mcq.options.length) {
                validation.issues.push(`Question ${questionNumber}: Multiple choice options must be unique`);
                validation.isValid = false;
              }
              
              // Check option length
              mcq.options.forEach((option: string, optIndex: number) => {
                if (option.trim().length < 2) {
                  validation.issues.push(`Question ${questionNumber}: Option ${optIndex + 1} is too short`);
                  validation.isValid = false;
                }
              });
            }

            // Validate correct option index
            if (typeof mcq.correctOptionIndex !== 'number' || mcq.correctOptionIndex < 0 || mcq.correctOptionIndex > 3) {
              validation.issues.push(`Question ${questionNumber}: Invalid correct option index`);
              validation.isValid = false;
            }

            // Validate distractor explanations
            if (!mcq.distractorExplanations || mcq.distractorExplanations.length !== mcq.options.length - 1) {
              validation.issues.push(`Question ${questionNumber}: Missing distractor explanations`);
              validation.isValid = false;
            } else {
              mcq.distractorExplanations.forEach((explanation: string, index: number) => {
                if (!explanation || explanation.trim().length < 20) {
                  validation.issues.push(`Question ${questionNumber}: Distractor explanation ${index + 1} is too short`);
                  validation.isValid = false;
                }
              });
            }
            break;
          }

          case 'true_false': {
            const tfq = question as TrueFalseQuestion;
            if (typeof tfq.correctAnswer !== 'boolean') {
              validation.issues.push(`Question ${questionNumber}: True/false question must have a boolean correct answer`);
              validation.isValid = false;
            }
            // Check for clear true/false statement
            if (!tfq.question.trim().endsWith('?') && !tfq.question.trim().endsWith('.')) {
              validation.issues.push(`Question ${questionNumber}: True/false statement must end with a period or question mark`);
              validation.isValid = false;
            }
            break;
          }

          case 'fill_in_blank': {
            const fibq = question as FillInBlankQuestion;
            if (!fibq.textBefore || !fibq.textAfter) {
              validation.issues.push(`Question ${questionNumber}: Fill in blank question must have text before and after the blank`);
              validation.isValid = false;
            } else {
              // Check context completeness
              if (fibq.textBefore.trim().length < 10 || fibq.textAfter.trim().length < 10) {
                validation.issues.push(`Question ${questionNumber}: Fill in blank context is too short`);
                validation.isValid = false;
              }
            }
            if (!fibq.correctAnswer) {
              validation.issues.push(`Question ${questionNumber}: Fill in blank question must have a correct answer`);
              validation.isValid = false;
            }
            if (!fibq.acceptableAnswers || fibq.acceptableAnswers.length === 0) {
              validation.issues.push(`Question ${questionNumber}: Fill in blank question should have acceptable alternative answers`);
              validation.isValid = false;
            } else {
              // Check for duplicate answers
              const uniqueAnswers = new Set(fibq.acceptableAnswers);
              if (uniqueAnswers.size !== fibq.acceptableAnswers.length) {
                validation.issues.push(`Question ${questionNumber}: Acceptable answers must be unique`);
                validation.isValid = false;
              }
            }
            break;
          }

          case 'timestamp_reference': {
            const tsq = question as TimestampReferenceQuestion;
            if (typeof tsq.timestamp !== 'number' || tsq.timestamp < 0) {
              validation.issues.push(`Question ${questionNumber}: Invalid timestamp`);
              validation.isValid = false;
            }
            if (!tsq.options || tsq.options.length !== 4) {
              validation.issues.push(`Question ${questionNumber}: Timestamp reference question must have exactly 4 options`);
              validation.isValid = false;
            }
            if (typeof tsq.correctOptionIndex !== 'number' || tsq.correctOptionIndex < 0 || tsq.correctOptionIndex > 3) {
              validation.issues.push(`Question ${questionNumber}: Invalid correct option index`);
              validation.isValid = false;
            }
            break;
          }
        }

        // Check confidence score
        if (!question.confidence || question.confidence < 0.7) {
          validation.issues.push(`Question ${questionNumber}: Low confidence score`);
          validation.isValid = false;
        }
      });

      // Add suggestions for improvement
      if (questions.length < 5) {
        validation.suggestions.push('Consider generating more questions for better coverage');
      }

      const avgConfidence = questions.reduce((sum: number, q: Question) => sum + (q.confidence || 0), 0) / questions.length;
      if (avgConfidence < 0.8) {
        validation.suggestions.push('Question confidence scores are low, consider regenerating some questions');
      }

      // Check difficulty distribution
      const difficultyCount = new Map<QuestionDifficulty, number>();
      questions.forEach((q: Question) => {
        difficultyCount.set(q.difficulty, (difficultyCount.get(q.difficulty) || 0) + 1);
      });

      if (difficultyCount.size === 1) {
        validation.suggestions.push('Consider adding questions of varying difficulty levels');
      }

      console.log('Validation result:', validation);
      return validation;
    } catch (error) {
      console.error('Error validating question bank:', error);
      return {
        isValid: false,
        issues: ['Failed to validate question bank due to an error'],
        suggestions: ['Please check the question bank format and try again']
      };
    }
  }

  static async calculateRelevanceScore(question: Question, transcript: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a quiz quality evaluator. Calculate the relevance score for the given question based on the transcript.'
          },
          {
            role: 'user',
            content: `Calculate relevance score for this question:
${JSON.stringify(question, null, 2)}

Based on this transcript:
${transcript}`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      return JSON.parse(content);
    } catch (error) {
      console.error('Error calculating relevance score:', error);
      throw error;
    }
  }

  static async analyzeContentCoverage(questions: Question[], transcript: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a quiz quality evaluator. Analyze how well the questions cover the content in the transcript.'
          },
          {
            role: 'user',
            content: `Analyze content coverage for these questions:
${JSON.stringify(questions, null, 2)}

Based on this transcript:
${transcript}`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing content coverage:', error);
      throw error;
    }
  }

  static async calibrateDifficulty(questions: Question[]): Promise<Question[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a quiz quality evaluator. Analyze and calibrate the difficulty of the given questions.

For each question, you MUST provide:
1. suggestedDifficulty: Must be exactly "beginner", "intermediate", or "advanced"
2. confidence: Must be a number between 0 and 1
3. reasoning: Must explain why the difficulty level was chosen
4. suggestions: Array of specific and actionable improvements

Return response in EXACTLY this format:
{
  "calibrations": [
    {
      "suggestedDifficulty": "beginner",
      "confidence": 0.8,
      "reasoning": "This question tests basic recall of fundamental concepts. The language is clear and straightforward, and the concepts being tested are foundational. It focuses on the definition and basic purpose of React components.",
      "suggestions": [
        "Add more context about how components fit into the larger React ecosystem",
        "Consider including an example of a simple component"
      ]
    }
  ]
}

IMPORTANT:
- suggestedDifficulty MUST be exactly "beginner", "intermediate", or "advanced"
- confidence MUST be a number between 0 and 1
- reasoning MUST explain why the difficulty level was chosen
- suggestions MUST be specific and actionable
- Return EXACTLY one calibration object per question
- For beginner questions: Focus on basic concepts and definitions
- For intermediate questions: Test application and relationships
- For advanced questions: Require analysis and synthesis of multiple concepts`
          },
          {
            role: 'user',
            content: `Calibrate difficulty for these questions:
${JSON.stringify(questions, null, 2)}

For each question:
1. Analyze the complexity of concepts being tested
2. Consider the depth of understanding required
3. Evaluate the clarity and specificity of the question
4. Check if the explanation matches the difficulty level
5. Suggest improvements if needed

Return the calibration data in the EXACT format specified.`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const result = JSON.parse(content);
      
      // Validate calibration response
      if (!result.calibrations || !Array.isArray(result.calibrations)) {
        console.error('Invalid calibration response:', result);
        return questions;
      }

      // Validate each calibration
      const validCalibrations = result.calibrations.every((cal: CalibrationResult) => 
        cal.suggestedDifficulty && 
        ['beginner', 'intermediate', 'advanced'].includes(cal.suggestedDifficulty) &&
        typeof cal.confidence === 'number' &&
        cal.confidence >= 0 && cal.confidence <= 1 &&
        typeof cal.reasoning === 'string' &&
        cal.reasoning.length > 0 &&
        Array.isArray(cal.suggestions)
      );

      if (!validCalibrations) {
        console.error('Invalid calibration format:', result);
        return questions;
      }

      // Apply calibrations to questions
      return questions.map((question, index) => {
        const calibration = result.calibrations[index];
        if (calibration) {
          return {
            ...question,
            difficulty: calibration.suggestedDifficulty,
            confidence: calibration.confidence,
            calibrationReasoning: calibration.reasoning,
            improvementSuggestions: calibration.suggestions
          };
        }
        return question;
      });
    } catch (error) {
      console.error('Error calibrating difficulty:', error);
      return questions; // Return original questions on error
    }
  }
} 