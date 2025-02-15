import { OpenAI } from 'openai';
import * as FileSystem from 'expo-file-system';

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
  | 'openai/file-too-large'
  | 'openai/request-aborted';

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
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

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
   * @param audioBlob Audio blob to transcribe (must be < 25MB)
   * @returns Transcription text
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      this.logger.info('[OpenAIService] Starting transcription process...');
      this.logger.info('[OpenAIService] Audio blob details:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Validate file size
      if (audioBlob.size > this.MAX_FILE_SIZE) {
        this.logger.error('[OpenAIService] File size exceeds limit:', {
          size: audioBlob.size,
          limit: this.MAX_FILE_SIZE
        });
        throw new OpenAIError(
          'File size exceeds 25MB limit',
          'openai/file-too-large'
        );
      }

      // Validate file type
      if (!this.SUPPORTED_FORMATS.includes(audioBlob.type)) {
        this.logger.error('[OpenAIService] Unsupported audio format:', audioBlob.type);
        throw new OpenAIError(
          `Unsupported audio format: ${audioBlob.type}. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`,
          'openai/api-error'
        );
      }

      this.logger.info('[OpenAIService] Creating File object...');
      // Create a File object from the Blob with .m4a extension
      const file = new File([audioBlob], 'audio.m4a', { type: 'audio/m4a' });
      this.logger.info('[OpenAIService] File object created:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      this.logger.info('[OpenAIService] Creating FormData...');
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'text');
      this.logger.info('[OpenAIService] FormData created with fields:', {
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });

      this.logger.info('[OpenAIService] Sending request to OpenAI...');
      // Send the request using fetch directly
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.client.apiKey}`,
        },
        body: formData,
        signal: controller.signal
      });

      this.logger.info('[OpenAIService] Received response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorData: string;
        try {
          errorData = await response.text();
          this.logger.error('[OpenAIService] API error response:', errorData);
        } catch (e) {
          errorData = 'Could not read error response';
          this.logger.error('[OpenAIService] Could not read error response:', e);
        }
        
        if (response.status === 429) {
          throw new OpenAIError('Rate limit exceeded', 'openai/rate-limit');
        } else if (response.status === 413) {
          throw new OpenAIError('File too large', 'openai/file-too-large');
        } else if (response.status === 415) {
          throw new OpenAIError('Unsupported media type', 'openai/api-error');
        }
        
        throw new OpenAIError(
          `OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`,
          'openai/api-error'
        );
      }

      this.logger.info('[OpenAIService] Reading response text...');
      let text: string;
      try {
        text = await response.text();
      } catch (e) {
        this.logger.error('[OpenAIService] Error reading response:', e);
        throw new OpenAIError(
          'Failed to read API response',
          'openai/invalid-response'
        );
      }
      
      if (!text) {
        this.logger.error('[OpenAIService] Empty response from API');
        throw new OpenAIError(
          'Empty response from OpenAI',
          'openai/invalid-response'
        );
      }

      this.logger.info('[OpenAIService] Transcription completed successfully');
      return text;
    } catch (error: unknown) {
      this.logger.error('[OpenAIService] Transcription error:', error);

      if (error instanceof OpenAI.APIError) {
        const { status } = error;
        this.logger.error('[OpenAIService] API error details:', {
          status,
          message: error.message,
          error
        });
        
        if (status === 429) {
          throw new OpenAIError('Rate limit exceeded', 'openai/rate-limit');
        } else if (status === 413) {
          throw new OpenAIError('File too large', 'openai/api-error');
        } else if (status === 415) {
          throw new OpenAIError('Unsupported media type', 'openai/api-error');
        } else {
          throw new OpenAIError(`OpenAI API error: ${error.message}`, 'openai/api-error');
        }
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new OpenAIError('Request aborted', 'openai/request-aborted');
      }

      if (error instanceof Error && error.message.includes('timeout')) {
        throw new OpenAIError('Request timed out', 'openai/timeout');
      }

      if (error instanceof OpenAIError) {
        throw error;
      }

      throw new OpenAIError(
        error instanceof Error ? error.message : 'Failed to transcribe audio',
        'openai/network-error'
      );
    } finally {
      clearTimeout(timeoutId);
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
    language: string;
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

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
}); 