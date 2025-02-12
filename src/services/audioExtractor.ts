import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { VideoError } from '../types/video';

/**
 * Service for extracting audio from videos using FFmpeg.wasm
 */
export class AudioExtractor {
  private ffmpeg: FFmpeg;
  private logger: Console;
  private isLoaded: boolean = false;

  constructor(logger: Console = console) {
    this.logger = logger;
    this.ffmpeg = new FFmpeg();
  }

  /**
   * Initialize FFmpeg instance
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      try {
        this.logger.info('Loading FFmpeg...');
        // Load FFmpeg core
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await this.ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });
        this.isLoaded = true;
        this.logger.info('FFmpeg loaded successfully');
      } catch (error) {
        this.logger.error('Failed to load FFmpeg:', error);
        throw new VideoError(
          'Failed to initialize audio extraction',
          'audio/ffmpeg-load-failed'
        );
      }
    }
  }

  /**
   * Extract audio from a video file
   * @param videoFile The video file to extract audio from
   * @param onProgress Optional progress callback
   * @returns The extracted audio as a Blob
   */
  async extractAudio(
    videoFile: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      await this.ensureLoaded();

      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp3';

      this.logger.info('Starting audio extraction...');

      // Write the input file
      const fileData = new Uint8Array(await videoFile.arrayBuffer());
      await this.ffmpeg.writeFile(inputFileName, fileData);

      // Set up progress tracking
      this.ffmpeg.on('progress', ({ progress, time }) => {
        const percent = Math.round(progress * 100);
        this.logger.debug(`FFmpeg Progress: ${percent}% (${time}ms)`);
        onProgress?.(percent);
      });

      // Extract audio using FFmpeg
      await this.ffmpeg.exec([
        '-i', inputFileName,           // Input file
        '-vn',                         // Disable video
        '-acodec', 'libmp3lame',      // Use MP3 codec
        '-ar', '16000',               // Set sample rate to 16kHz
        '-ac', '1',                   // Convert to mono
        '-b:a', '64k',                // Set bitrate
        '-f', 'mp3',                  // Force MP3 format
        outputFileName                 // Output file
      ]);

      // Read the output file
      const data = await this.ffmpeg.readFile(outputFileName);
      
      // Clean up files
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);

      this.logger.info('Audio extraction completed successfully');

      // Convert the output data to a Blob
      return new Blob([data], { type: 'audio/mp3' });
    } catch (error) {
      this.logger.error('Audio extraction failed:', error);
      throw new VideoError(
        'Failed to extract audio from video',
        'audio/extraction-failed'
      );
    }
  }

  /**
   * Clean up FFmpeg instance
   */
  async destroy(): Promise<void> {
    if (this.isLoaded) {
      try {
        await this.ffmpeg.terminate();
        this.isLoaded = false;
      } catch (error) {
        this.logger.error('Error destroying FFmpeg instance:', error);
      }
    }
  }
} 