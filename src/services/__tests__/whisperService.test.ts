import { OpenAIService, OpenAIError } from '../openaiService';
import { WhisperService } from '../whisperService';
import { AudioExtractor } from '../audioExtractor';
import { VideoError } from '../../types/video';
import type { VideoTranscript } from '../../features/learning-path/types';

// Mock dependencies
jest.mock('../openaiService');
jest.mock('../audioExtractor');

// Mock File and Blob since they're not available in Node.js
class MockBlob {
  size: number;
  type: string;
  
  constructor(content: any[], options?: { type?: string }) {
    this.size = content.length;
    this.type = options?.type || '';
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
}

class MockFile extends MockBlob {
  name: string;
  lastModified: number;
  
  constructor(content: any[], name: string, options?: { type?: string; lastModified?: number }) {
    super(content, options);
    this.name = name;
    this.lastModified = options?.lastModified || Date.now();
  }
}

global.File = MockFile as any;
global.Blob = MockBlob as any;

describe('WhisperService', () => {
  let whisperService: WhisperService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;
  let mockAudioExtractor: jest.Mocked<AudioExtractor>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOpenAIService = {
      transcribeAudio: jest.fn(),
      analyzeTranscription: jest.fn()
    } as unknown as jest.Mocked<OpenAIService>;
    
    mockAudioExtractor = {
      extractAudio: jest.fn(),
      extractChunks: jest.fn()
    } as unknown as jest.Mocked<AudioExtractor>;
    
    whisperService = new WhisperService(mockAudioExtractor, mockOpenAIService);
  });

  describe('transcribeLongAudio', () => {
    it('should handle OpenAI transcription errors', async () => {
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const mockError = new OpenAIError('Transcription failed', 'openai/api-error');
      
      mockAudioExtractor.extractChunks.mockResolvedValue([new Blob(['chunk'])]);
      mockOpenAIService.transcribeAudio.mockRejectedValue(mockError);
      mockOpenAIService.analyzeTranscription.mockResolvedValue({
        summary: '',
        keywords: [],
        chapters: [],
        language: 'en'
      });
      
      await expect(whisperService.transcribeLongAudio(audioFile)).rejects.toEqual(mockError);
    });

    it('should handle OpenAI analysis errors', async () => {
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const mockError = new OpenAIError('Analysis failed', 'openai/invalid-response');
      
      mockAudioExtractor.extractChunks.mockResolvedValue([new Blob(['chunk'])]);
      mockOpenAIService.transcribeAudio.mockResolvedValue('Test transcription');
      mockOpenAIService.analyzeTranscription.mockRejectedValue(mockError);
      
      await expect(whisperService.transcribeLongAudio(audioFile)).rejects.toEqual(mockError);
    });

    it('should combine transcripts from multiple chunks', async () => {
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const chunks = [new Blob(['chunk1']), new Blob(['chunk2'])];
      
      mockAudioExtractor.extractChunks.mockResolvedValue(chunks);
      mockOpenAIService.transcribeAudio
        .mockResolvedValueOnce('First chunk text')
        .mockResolvedValueOnce('Second chunk text');
      mockOpenAIService.analyzeTranscription
        .mockResolvedValueOnce({
          summary: 'A greeting to the world',
          keywords: ['hello', 'world'],
          chapters: [
            { title: 'Hello', startTime: 0, endTime: 5 }
          ],
          language: 'en'
        })
        .mockResolvedValueOnce({
          summary: 'A greeting to the world',
          keywords: ['hello', 'world'],
          chapters: [
            { title: 'World', startTime: 0, endTime: 5 }
          ],
          language: 'en'
        });
      
      const result = await whisperService.transcribeLongAudio(audioFile);
      expect(result.segments[0].text).toBe('Hello');
      expect(result.segments[1].text).toBe('World');
      expect(result.language).toBe('en');
    });

    it('should detect language consistently across chunks', async () => {
      const audioFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
      const chunks = [new Blob(['chunk1']), new Blob(['chunk2'])];
      
      mockAudioExtractor.extractChunks.mockResolvedValue(chunks);
      mockOpenAIService.transcribeAudio
        .mockResolvedValueOnce('Premier morceau de texte')
        .mockResolvedValueOnce('Deuxième morceau de texte');
      mockOpenAIService.analyzeTranscription
        .mockResolvedValueOnce({
          summary: 'Une salutation au monde',
          keywords: ['bonjour', 'monde'],
          chapters: [
            { title: 'Bonjour', startTime: 0, endTime: 5 }
          ],
          language: 'fr'
        })
        .mockResolvedValueOnce({
          summary: 'Une salutation au monde',
          keywords: ['bonjour', 'monde'],
          chapters: [
            { title: 'le monde', startTime: 0, endTime: 5 }
          ],
          language: 'fr'
        });
      
      const result = await whisperService.transcribeLongAudio(audioFile);
      expect(result.segments[0].text).toBe('Bonjour');
      expect(result.segments[1].text).toBe('le monde');
      expect(result.language).toBe('fr');
    });
  });
});