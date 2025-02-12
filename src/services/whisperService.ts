import { AudioExtractor } from './audioExtractor';
import { OpenAIService, OpenAIError } from './openaiService';
import { VideoError } from '../types/video';
import type { VideoTranscript } from '../features/learning-path/types';
import * as FileSystem from 'expo-file-system';

export interface WhisperServiceOptions {
  chunkSize?: number;  // Size in bytes
  detectLanguage?: boolean;
  model?: 'whisper-1';
  temperature?: number;
}

const DEFAULT_OPTIONS: WhisperServiceOptions = {
  chunkSize: 24 * 1024 * 1024, // 24MB to stay safely under limit
  detectLanguage: true,
  model: 'whisper-1',
  temperature: 0
};

/**
 * Service for handling long-form audio transcription using Whisper API
 * with chunked processing support
 */
export class WhisperService {
  private openai: OpenAIService;
  private extractor: AudioExtractor;
  private logger: Console;

  constructor(
    extractor: AudioExtractor,
    openaiService?: OpenAIService,
    logger: Console = console
  ) {
    this.extractor = extractor;
    this.openai = openaiService || new OpenAIService();
    this.logger = logger;
  }

  /**
   * Transcribe a long audio file by splitting it into chunks
   */
  async transcribeLongAudio(
    videoFile: Blob | { uri: string, type?: string },
    options: WhisperServiceOptions = {}
  ): Promise<VideoTranscript> {
    try {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      
      // If it's a Blob, create a temporary file
      let fileWithUri: { uri: string, type?: string };
      if (videoFile instanceof Blob) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) resolve(reader.result.toString());
          };
          reader.readAsDataURL(videoFile);
        });

        const tempPath = `${FileSystem.documentDirectory}temp_video_${Date.now()}.mp4`;
        await FileSystem.writeAsStringAsync(tempPath, base64.split(',')[1], {
          encoding: FileSystem.EncodingType.Base64
        });
        fileWithUri = { uri: tempPath, type: videoFile.type };
      } else {
        fileWithUri = videoFile;
      }

      // Validate file
      if (!fileWithUri.uri) {
        throw new VideoError('Invalid video file', 'audio/invalid-format');
      }

      // Extract chunks
      this.logger.info('Extracting audio chunks...');
      const chunks = await this.extractor.extractChunks(fileWithUri, opts.chunkSize);
      this.logger.info(`Extracted ${chunks.length} chunks`);

      // Process each chunk
      let offset = 0;
      const results: VideoTranscript[] = [];

      for (let i = 0; i < chunks.length; i++) {
        this.logger.info(`Processing chunk ${i + 1}/${chunks.length}`);
        
        try {
          const text = await this.openai.transcribeAudio(chunks[i]);
          const analysis = await this.openai.analyzeTranscription(text);

          // Adjust timestamps based on chunk position
          const transcript: VideoTranscript = {
            videoId: '',  // Will be set by video service
            segments: analysis.chapters.map(chapter => ({
              startTime: chapter.startTime * 1000 + offset,
              endTime: chapter.endTime * 1000 + offset,
              text: chapter.title
            })),
            language: opts.detectLanguage ? analysis.language : 'en',
            isAutogenerated: true
          };

          results.push(transcript);
          
          // Update offset for next chunk
          const lastSegment = transcript.segments[transcript.segments.length - 1];
          offset = lastSegment ? lastSegment.endTime : offset;
        } catch (error) {
          this.logger.error(`Error processing chunk ${i + 1}:`, error);
          throw error;
        }
      }

      // Combine results
      return this.combineTranscripts(results);
    } catch (error) {
      this.logger.error('Transcription error:', error);
      
      if (error instanceof OpenAIError || error instanceof VideoError) {
        throw error;
      }

      throw new VideoError(
        'Failed to process audio',
        'audio/processing-failed'
      );
    }
  }

  /**
   * Combine multiple transcripts into one
   */
  private combineTranscripts(transcripts: VideoTranscript[]): VideoTranscript {
    if (transcripts.length === 0) {
      throw new VideoError(
        'No transcripts to combine',
        'audio/processing-failed'
      );
    }

    // Combine segments and ensure they're ordered by time
    const segments = transcripts
      .flatMap(t => t.segments)
      .sort((a, b) => a.startTime - b.startTime);

    // Use the most common language
    const language = this.getMostCommonLanguage(transcripts);

    return {
      videoId: '',  // Will be set by video service
      segments,
      language,
      isAutogenerated: true
    };
  }

  /**
   * Get the most common language from multiple transcripts
   */
  private getMostCommonLanguage(transcripts: VideoTranscript[]): string {
    const langCount = transcripts.reduce((count, transcript) => {
      const lang = transcript.language;
      count[lang] = (count[lang] || 0) + 1;
      return count;
    }, {} as Record<string, number>);

    return Object.entries(langCount)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
} 