import 'openai/shims/node';
import OpenAI from 'openai';

/**
 * Error codes for OpenAI-related operations
 */
export type OpenAIErrorCode = 
  | 'openai/api-error'
  | 'openai/rate-limit'
  | 'openai/invalid-api-key'
  | 'openai/network-error'
  | 'openai/timeout'
  | 'openai/invalid-response'
  | 'openai/file-too-large';

/**
 * Custom error class for OpenAI-related operations
 */
export class OpenAIError extends Error {
  readonly code: OpenAIErrorCode;

  constructor(message: string, code: OpenAIErrorCode) {
    super(message);
    this.code = code;
    this.name = 'OpenAIError';
  }
}

/**
 * Service for interacting with OpenAI APIs
 */
export class OpenAIService {
  private client: OpenAI;
  private logger: Console;
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  private readonly SUPPORTED_FORMATS = ['audio/mp3', 'audio/mpeg', 'audio/m4a'];

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new OpenAIError('OpenAI API key is required', 'openai/invalid-api-key');
    }
    this.client = new OpenAI({ apiKey: key });
    this.logger = console;
  }

  /**
   * Transcribe audio using Whisper API
   * @param audioFile Audio file to transcribe (must be < 25MB)
   * @returns Transcription text
   */
  async transcribeAudio(audioFile: File | Blob): Promise<string> {
    try {
      this.logger.info('Starting audio transcription...');

      // Validate file size
      if (audioFile.size > this.MAX_FILE_SIZE) {
        throw new OpenAIError(
          'File size exceeds 25MB limit',
          'openai/file-too-large'
        );
      }

      // Validate file format
      if (audioFile instanceof File && !this.SUPPORTED_FORMATS.includes(audioFile.type)) {
        throw new OpenAIError(
          'Unsupported audio format. Supported formats: MP3, M4A',
          'openai/api-error'
        );
      }

      // Convert Blob to File if needed
      const file = audioFile instanceof File ? audioFile : new File(
        [audioFile],
        'audio.mp3',
        { type: 'audio/mp3' }
      );

      const response = await this.client.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });

      if (!response) {
        throw new OpenAIError(
          'Empty response from OpenAI',
          'openai/invalid-response'
        );
      }

      this.logger.info('Transcription completed successfully');
      return response;
    } catch (error: unknown) {
      this.logger.error('Transcription error:', error);

      if (error instanceof OpenAI.APIError) {
        const { status } = error;
        
        if (status === 429) {
          throw new OpenAIError('Rate limit exceeded', 'openai/rate-limit');
        } else if (status === 413) {
          throw new OpenAIError('File too large', 'openai/api-error');
        } else if (status === 415) {
          throw new OpenAIError('Unsupported media type', 'openai/api-error');
        } else {
          throw new OpenAIError('Internal server error', 'openai/api-error');
        }
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new OpenAIError('Request timed out', 'openai/timeout');
      }

      if (error instanceof OpenAIError) {
        throw error;
      }

      throw new OpenAIError(
        'Failed to transcribe audio',
        'openai/network-error'
      );
    }
  }

  /**
   * Process transcription with additional analysis
   * @param text Text to analyze
   * @returns Enhanced transcription with analysis
   */
  async analyzeTranscription(text: string): Promise<{
    summary: string;
    keywords: string[];
    chapters: Array<{
      title: string;
      startTime: number;
      endTime: number;
    }>;
  }> {
    try {
      if (!text.trim()) {
        throw new OpenAIError(
          'Empty transcription text',
          'openai/invalid-response'
        );
      }

      this.logger.info('Analyzing transcription...');

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that analyzes video transcripts. 
            Generate a concise summary, extract key topics/keywords, and suggest 
            logical chapter breaks based on content transitions.
            
            Format your response as JSON with the following structure:
            {
              "summary": "Brief 2-3 sentence summary",
              "keywords": ["keyword1", "keyword2", ...],
              "chapters": [
                {
                  "title": "Chapter title",
                  "startTime": startTimeInSeconds,
                  "endTime": endTimeInSeconds
                }
              ]
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: 'json_object' }
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new OpenAIError(
          'Empty response from OpenAI',
          'openai/invalid-response'
        );
      }

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      if (!result.summary || !result.keywords || !result.chapters) {
        throw new OpenAIError(
          'Invalid response format from OpenAI',
          'openai/invalid-response'
        );
      }

      // Validate chapter data
      for (const chapter of result.chapters) {
        if (typeof chapter.startTime !== 'number' || typeof chapter.endTime !== 'number') {
          throw new OpenAIError(
            'Invalid chapter timestamps',
            'openai/invalid-response'
          );
        }
      }

      // Validate sequential timestamps
      for (let i = 1; i < result.chapters.length; i++) {
        if (result.chapters[i].startTime < result.chapters[i-1].endTime) {
          throw new OpenAIError(
            'Chapter timestamps must be sequential',
            'openai/invalid-response'
          );
        }
      }

      this.logger.info('Transcription analysis completed');
      return result;
    } catch (error: unknown) {
      this.logger.error('Analysis error:', error);

      if (error instanceof OpenAI.APIError) {
        const { status } = error;
        
        if (status === 429) {
          throw new OpenAIError('Rate limit exceeded', 'openai/rate-limit');
        } else {
          throw new OpenAIError('Internal server error', 'openai/api-error');
        }
      }

      if (error instanceof SyntaxError) {
        throw new OpenAIError('Invalid response format from OpenAI', 'openai/invalid-response');
      }

      if (error instanceof OpenAIError) {
        if (error.message === 'Invalid chapter timestamps') {
          throw new OpenAIError('Invalid response format from OpenAI', 'openai/invalid-response');
        }
        throw error;
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new OpenAIError('Request timed out', 'openai/timeout');
      }

      throw new OpenAIError(
        'Failed to analyze transcription',
        'openai/api-error'
      );
    }
  }
} 