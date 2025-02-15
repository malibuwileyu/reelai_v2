import { OpenAI } from 'openai';

// Initialize OpenAI client with proper configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  defaultQuery: {
    model: 'gpt-4'
  }
}); 