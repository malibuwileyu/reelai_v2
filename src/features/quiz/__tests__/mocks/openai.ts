import OpenAI from 'openai';

export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockImplementation(async ({ messages }) => {
        const content = messages[messages.length - 1].content;
        
        // Multiple choice questions
        if (content.includes('multiple choice questions')) {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  questions: [{
                    question: "What is the primary purpose of React components?",
                    options: [
                      "To create reusable pieces of UI with their own logic and presentation",
                      "To style HTML elements using CSS",
                      "To handle database operations and data storage",
                      "To manage server-side routing and navigation"
                    ],
                    correctOptionIndex: 0,
                    distractorExplanations: [
                      "CSS styling is a separate concern from component logic",
                      "Database operations are typically handled by backend services",
                      "Routing is handled by separate routing libraries"
                    ],
                    explanation: "React components are the foundation of React applications, designed to be reusable pieces of UI that encapsulate both the visual elements and their associated logic. This modular approach enables developers to build complex interfaces from simple, independent pieces."
                  }]
                })
              }
            }]
          };
        }
        
        // True/false questions
        if (content.includes('true/false questions')) {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  questions: [{
                    question: "React components must return a single root JSX element.",
                    correctAnswer: true,
                    explanation: "This is a fundamental rule in React's component architecture. Every component must have exactly one root element in its JSX return statement. Multiple elements must be wrapped in a parent container or fragment to maintain this rule."
                  }]
                })
              }
            }]
          };
        }
        
        // Fill in blank questions
        if (content.includes('fill-in-the-blank questions')) {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  questions: [{
                    textBefore: "In React, props are",
                    textAfter: "and cannot be modified by a component.",
                    correctAnswer: "read-only",
                    acceptableAnswers: ["read-only", "immutable", "unchangeable", "not mutable"],
                    explanation: "Props (properties) in React are read-only by design. This immutability is a core principle that ensures predictable data flow. Components should never modify their own props."
                  }]
                })
              }
            }]
          };
        }

        // Calibration questions
        if (content.includes('assess their difficulty level')) {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  calibrations: [{
                    questionId: "test-id",
                    assessedDifficulty: "intermediate",
                    confidenceScore: 0.85,
                    explanation: "This question tests understanding of core React concepts and requires analysis of multiple options."
                  }]
                })
              }
            }]
          };
        }

        throw new Error(`Unhandled prompt type: ${content}`);
      })
    }
  }
} as unknown as OpenAI; 