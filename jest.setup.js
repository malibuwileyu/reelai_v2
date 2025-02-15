// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({
    add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  })),
  doc: jest.fn(() => ({
    id: 'mock-doc-id',
  })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      id: 'mock-doc-id',
      videoId: 'test-video-123',
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is React?',
          options: ['A library', 'A framework', 'A language', 'A database'],
          correctOptionIndex: 0,
          explanation: 'React is a JavaScript library for building user interfaces.',
        },
      ],
      metadata: {
        videoTitle: 'Introduction to React',
        videoDuration: 300,
        generationMethod: 'auto',
      },
      createdAt: { seconds: 1234567890, nanoseconds: 0 },
      updatedAt: { seconds: 1234567890, nanoseconds: 0 },
    }),
  })),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [
      {
        id: 'mock-doc-id',
        data: () => ({
          id: 'mock-doc-id',
          videoId: 'test-video-123',
          questions: [],
        }),
      },
    ],
  })),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  Timestamp: {
    now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
    fromDate: (date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
  },
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockImplementation(({ messages }) => {
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
                        "To style HTML elements",
                        "To handle database operations",
                        "To manage server-side routing"
                      ],
                      correctOptionIndex: 0,
                      distractorExplanations: [
                        "Styling is handled through CSS, not components directly",
                        "Database operations are typically handled by backend services",
                        "Routing is handled by separate routing libraries"
                      ],
                      explanation: "React components are the foundation of React applications, designed to be reusable building blocks that encapsulate both the UI elements and their associated logic. This modular approach allows developers to build complex interfaces from simple, self-contained pieces."
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
                      acceptableAnswers: ["read-only", "immutable", "unchangeable"],
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

          // Default response for other cases
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  questions: [{
                    question: "What is React?",
                    options: [
                      "A JavaScript library for building user interfaces",
                      "A database management system",
                      "A programming language",
                      "An operating system"
                    ],
                    correctOptionIndex: 0,
                    distractorExplanations: [
                      "React is not a database system, it's a UI library",
                      "React is built with JavaScript, not a language itself",
                      "React is a library, not an operating system"
                    ],
                    explanation: "React is a JavaScript library developed by Facebook for building user interfaces, particularly single-page applications where UI updates are frequent and dynamic."
                  }]
                })
              }
            }]
          };
        })
      }
    }
  }))
}));

// Mock React Native's Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Global setup
beforeAll(() => {
  // Add any global setup here
});

// Global teardown
afterAll(() => {
  // Add any global cleanup here
});

// Add custom matchers
expect.extend({
  toHaveStyle(received, style) {
    const pass = this.equals(received.props.style, style);
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to have style ${this.utils.printExpected(style)}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to have style ${this.utils.printExpected(style)}`,
        pass: false,
      };
    }
  },
}); 