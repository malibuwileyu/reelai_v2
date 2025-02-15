import { QuizGenerationConfig, QuestionDifficulty, QuestionType } from '../../types';

export const REACT_FUNDAMENTALS = `
React is a JavaScript library for building user interfaces. Components are the foundation of React applications.
A component is a reusable piece of UI that can contain its own logic and presentation.

Key Concepts:

1. Components
- Components are JavaScript functions that return markup
- Components can be nested inside other components
- Components can accept properties (props) to customize their behavior
- Components should be pure functions for predictable behavior

2. JSX
- JSX is a syntax extension for JavaScript that lets you write HTML-like markup in your JavaScript code
- JSX elements must have a closing tag
- Components must return a single root JSX element
- JSX attributes use camelCase naming convention

3. Props
- Props are read-only and cannot be modified by a component
- Props can be of any JavaScript type
- Props allow components to be configured dynamically
- Default props can be specified for optional values

4. State
- State allows components to remember information and update the UI
- State is managed using the useState Hook
- State updates trigger component re-renders
- State should be treated as immutable

5. Event Handling
- React events are named using camelCase
- Event handlers are passed as functions, not strings
- Event handlers can access component state and props
- Event handlers can update state using state setter functions

Best Practices:
- Keep components focused on a single responsibility
- Lift state up to share data between components
- Use controlled components for form inputs
- Break down complex UIs into smaller, reusable components
`;

export const TEST_CONFIGS: Record<QuestionDifficulty, QuizGenerationConfig> = {
  beginner: {
    targetQuestionCount: 5,
    questionTypes: ['multiple_choice', 'true_false'],
    difficulty: 'beginner',
    includeTimestampReferences: false,
    minConfidenceScore: 0.7,
  },
  intermediate: {
    targetQuestionCount: 8,
    questionTypes: ['multiple_choice', 'true_false', 'fill_in_blank'],
    difficulty: 'intermediate',
    includeTimestampReferences: false,
    minConfidenceScore: 0.8,
  },
  advanced: {
    targetQuestionCount: 10,
    questionTypes: ['multiple_choice', 'true_false', 'fill_in_blank'],
    difficulty: 'advanced',
    includeTimestampReferences: false,
    minConfidenceScore: 0.9,
  },
};

// Expected question patterns for validation
export const EXPECTED_PATTERNS: Record<QuestionDifficulty, {
  concepts: string[];
  questionTypes: QuestionType[];
  minExplanationLength: number;
}> = {
  beginner: {
    concepts: ['components', 'JSX', 'props'],
    questionTypes: ['multiple_choice', 'true_false'],
    minExplanationLength: 50,
  },
  intermediate: {
    concepts: ['components', 'JSX', 'props', 'state', 'event handling'],
    questionTypes: ['multiple_choice', 'true_false', 'fill_in_blank'],
    minExplanationLength: 75,
  },
  advanced: {
    concepts: ['components', 'JSX', 'props', 'state', 'event handling', 'best practices'],
    questionTypes: ['multiple_choice', 'true_false', 'fill_in_blank'],
    minExplanationLength: 100,
  },
}; 