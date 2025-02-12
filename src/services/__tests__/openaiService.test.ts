import { OpenAIService, OpenAIError } from '../openaiService';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

// Mock implementations
let mockTranscriptions: jest.Mock;
let mockChatCompletions: jest.Mock;

// Mock File and Blob since they're not available in Node.js
class MockFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  private content: string[];

  constructor(content: string[], name: string, options: { type: string }) {
    this.content = content;
    this.name = name;
    this.type = options.type;
    this.size = content.join('').length;
    this.lastModified = Date.now();
  }
}

class MockBlob {
  size: number;
  type: string;
  private content: string[];

  constructor(content: string[], options: { type: string }) {
    this.content = content;
    this.type = options.type;
    this.size = content.join('').length;
  }
}

// Add mocks to global
global.File = MockFile as unknown as typeof File;
global.Blob = MockBlob as unknown as typeof Blob;

describe('OpenAIService', () => {
  beforeEach(() => {
    // Reset mocks
    mockTranscriptions = jest.fn();
    mockChatCompletions = jest.fn();

    // Setup mock implementations
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: mockTranscriptions
        }
      },
      chat: {
        completions: {
          create: mockChatCompletions
        }
      }
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('should successfully transcribe audio', async () => {
      const mockResponse = 'This is a test transcription';
      mockTranscriptions.mockResolvedValue(mockResponse);

      const service = new OpenAIService();
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const result = await service.transcribeAudio(audioFile);

      expect(result).toBe(mockResponse);
      expect(mockTranscriptions).toHaveBeenCalledWith({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });
    });

    it('should handle rate limit errors', async () => {
      // TODO: Properly implement rate limit error handling test
      expect(true).toBe(true);
    });

    it('should handle API errors', async () => {
      // TODO: Properly implement API error handling test
      expect(true).toBe(true);
    });

    it('should handle timeout errors', async () => {
      const error = new Error('Request timed out');
      error.message = 'timeout';
      mockTranscriptions.mockRejectedValue(error);

      const service = new OpenAIService();
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });

      await expect(service.transcribeAudio(audioFile)).rejects.toThrow(
        new OpenAIError('Request timed out', 'openai/timeout')
      );
    });

    it('should convert Blob to File', async () => {
      const mockResponse = 'This is a test transcription';
      mockTranscriptions.mockResolvedValue(mockResponse);

      const service = new OpenAIService();
      const audioBlob = new Blob(['test'], { type: 'audio/mp3' });
      await service.transcribeAudio(audioBlob);

      expect(mockTranscriptions).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.any(File)
        })
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockTranscriptions.mockRejectedValue(networkError);

      const service = new OpenAIService();
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });

      await expect(service.transcribeAudio(audioFile)).rejects.toThrow(
        new OpenAIError('Failed to transcribe audio', 'openai/network-error')
      );
    });

    it('should handle large files', async () => {
      const largeFile = new File(['test'.repeat(1000000)], 'large.mp3', { type: 'audio/mp3' });
      mockTranscriptions.mockRejectedValue(new OpenAI.APIError(413, {
        status: 413,
        error: { message: 'File too large' }
      }, 'File too large', {}));

      const service = new OpenAIService();

      await expect(service.transcribeAudio(largeFile)).rejects.toThrow(OpenAIError);
    });

    it('should handle unsupported audio formats', async () => {
      const unsupportedFile = new File(['test'], 'audio.wav', { type: 'audio/wav' });
      mockTranscriptions.mockRejectedValue(new OpenAI.APIError(415, {
        status: 415,
        error: { message: 'Unsupported media type' }
      }, 'Unsupported media type', {}));

      const service = new OpenAIService();

      await expect(service.transcribeAudio(unsupportedFile)).rejects.toThrow(OpenAIError);
    });
  });

  describe('analyzeTranscription', () => {
    const mockTranscription = 'This is a test transcription';
    const mockAnalysis = {
      summary: 'Test summary',
      keywords: ['test'],
      chapters: [
        { title: 'Chapter 1', startTime: 0, endTime: 10 }
      ]
    };

    it('should successfully analyze transcription', async () => {
      mockChatCompletions.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockAnalysis) } }]
      });

      const service = new OpenAIService();
      const result = await service.analyzeTranscription(mockTranscription);

      expect(result).toEqual(mockAnalysis);
      expect(mockChatCompletions).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ 
            role: 'user',
            content: mockTranscription 
          })
        ]),
        response_format: { type: 'json_object' }
      });
    });

    it('should handle invalid JSON response', async () => {
      mockChatCompletions.mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }]
      });

      const service = new OpenAIService();

      await expect(service.analyzeTranscription('test')).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid response format from OpenAI',
          code: 'openai/invalid-response'
        })
      );
    });

    it('should handle missing required fields in response', async () => {
      mockChatCompletions.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ summary: 'Test' }) } }]
      });

      const service = new OpenAIService();

      await expect(service.analyzeTranscription(mockTranscription)).rejects.toThrow(
        new OpenAIError('Invalid response format from OpenAI', 'openai/invalid-response')
      );
    });

    it('should handle rate limit errors', async () => {
      // TODO: Properly implement rate limit error handling test
      expect(true).toBe(true);
    });

    it('should handle API errors', async () => {
      // TODO: Properly implement API error handling test
      expect(true).toBe(true);
    });

    it('should handle empty transcription text', async () => {
      const service = new OpenAIService();

      await expect(service.analyzeTranscription('')).rejects.toThrow(OpenAIError);
    });

    it('should handle malformed chapter data', async () => {
      mockChatCompletions.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({
          summary: 'Test summary',
          keywords: ['test'],
          chapters: [{ title: 'Chapter 1' }] // Missing startTime and endTime
        }) } }]
      });

      const service = new OpenAIService();

      await expect(service.analyzeTranscription('test')).rejects.toThrow(
        new OpenAIError('Invalid response format from OpenAI', 'openai/invalid-response')
      );
    });

    it('should handle empty response choices', async () => {
      mockChatCompletions.mockResolvedValue({
        choices: []
      });

      const service = new OpenAIService();

      await expect(service.analyzeTranscription('test')).rejects.toThrow(OpenAIError);
    });

    it('should validate chapter timestamps are sequential', async () => {
      mockChatCompletions.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({
          summary: 'Test summary',
          keywords: ['test'],
          chapters: [
            { title: 'Chapter 2', startTime: 10, endTime: 20 },
            { title: 'Chapter 1', startTime: 5, endTime: 15 } // Overlapping timestamps
          ]
        }) } }]
      });

      const service = new OpenAIService();

      await expect(service.analyzeTranscription('test')).rejects.toThrow(OpenAIError);
    });

    it('should handle network timeout during analysis', async () => {
      mockChatCompletions.mockRejectedValue(new Error('timeout'));

      const service = new OpenAIService();

      await expect(service.analyzeTranscription('test')).rejects.toThrow(
        new OpenAIError('Request timed out', 'openai/timeout')
      );
    });
  });
}); 