import { VideoError } from '../types/video';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface VideoFileWithUri {
  uri: string;
  type?: string;
  size?: number;
}

export class AudioExtractor {
  private logger: Console;
  private readonly CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks for safer processing

  constructor(logger: Console = console) {
    this.logger = logger;
  }

  async extractAudio(
    videoFile: VideoFileWithUri,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    let recording: Audio.Recording | null = null;
    let sound: Audio.Sound | null = null;

    try {
      this.logger.info('[AudioExtractor] Starting audio extraction...', {
        fileType: videoFile.type || 'unknown',
        uri: videoFile.uri
      });

      // Set up audio mode
      this.logger.info('[AudioExtractor] Setting up audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      // Create and prepare recording with high quality preset
      this.logger.info('[AudioExtractor] Creating recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording = newRecording;

      // Load the video
      this.logger.info('[AudioExtractor] Loading video...');
      const { sound: videoSound } = await Audio.Sound.createAsync(
        { uri: videoFile.uri },
        { shouldPlay: false, volume: 0 }, // Mute the video playback
        (status) => {
          if (status.isLoaded && status.positionMillis && status.durationMillis) {
            const progress = (status.positionMillis / status.durationMillis) * 100;
            onProgress?.(progress);
          }
        }
      );
      sound = videoSound;

      // Start recording and play video
      this.logger.info('[AudioExtractor] Starting recording and playback...');
      await recording.startAsync();
      await sound.playAsync();

      // Wait for video to finish
      return new Promise<Blob>((resolve, reject) => {
        if (!sound || !recording) {
          reject(new VideoError('Sound or recording not initialized', 'audio/extraction-failed'));
          return;
        }

        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (!status.isLoaded) return;
          
          if (status.didJustFinish) {
            try {
              this.logger.info('[AudioExtractor] Video finished, stopping recording...');
              await recording?.stopAndUnloadAsync();
              
              // Get the recording URI
              const uri = recording?.getURI();
              if (!uri) {
                throw new VideoError('No recording URI available', 'audio/extraction-failed');
              }

              // Read the recorded audio file
              this.logger.info('[AudioExtractor] Reading recorded audio...');
              const audioData = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64
              });

              // Create audio blob
              this.logger.info('[AudioExtractor] Creating audio blob...');
              const audioBlob = new Blob(
                [Uint8Array.from(atob(audioData), c => c.charCodeAt(0))],
                { type: 'audio/m4a' }
              );

              resolve(audioBlob);
            } catch (error) {
              reject(error);
            } finally {
              // Cleanup
              if (sound) await sound.unloadAsync();
              if (recording) await recording.stopAndUnloadAsync();
            }
          }
        });
      });
    } catch (error) {
      this.logger.error('[AudioExtractor] Audio extraction failed:', error);
      
      // Cleanup on error
      if (sound) await sound.unloadAsync();
      if (recording) await recording.stopAndUnloadAsync();
      
      throw error instanceof VideoError ? error : new VideoError(
        'Failed to extract audio from video',
        'audio/extraction-failed'
      );
    }
  }

  async extractChunks(
    videoFile: VideoFileWithUri,
    maxChunkSize: number = this.CHUNK_SIZE
  ): Promise<Blob[]> {
    try {
      this.logger.info('[AudioExtractor] Starting audio chunking...');
      // First extract the audio
      const audioBlob = await this.extractAudio(videoFile);
      const totalSize = audioBlob.size;

      this.logger.info('[AudioExtractor] Audio blob created', {
        totalSize,
        maxChunkSize
      });

      if (totalSize <= maxChunkSize) {
        this.logger.info('[AudioExtractor] Audio size within limits, no chunking needed');
        return [audioBlob];
      }

      // Convert blob to base64 for chunking
      this.logger.info('[AudioExtractor] Converting audio for chunking...');
      const base64Data = await this.blobToBase64(audioBlob);
      const chunks: Blob[] = [];

      // Calculate chunk sizes in base64
      const base64ChunkSize = Math.floor(maxChunkSize * 4/3); // Account for base64 encoding
      let offset = 0;

      while (offset < base64Data.length) {
        const chunkSize = Math.min(base64ChunkSize, base64Data.length - offset);
        this.logger.info(`[AudioExtractor] Creating chunk at offset ${offset}, size ${chunkSize}`);
        
        const chunkBase64 = base64Data.slice(offset, offset + chunkSize);
        const chunkBlob = this.base64ToBlob(chunkBase64, 'audio/m4a');
        chunks.push(chunkBlob);
        
        offset += chunkSize;
        const progress = (offset / base64Data.length) * 100;
        this.logger.info(`[AudioExtractor] Chunking progress: ${progress.toFixed(1)}%`);
      }

      this.logger.info('[AudioExtractor] Audio chunking complete', {
        totalChunks: chunks.length,
        averageChunkSize: totalSize / chunks.length
      });

      return chunks;
    } catch (error) {
      this.logger.error('[AudioExtractor] Error during audio chunking:', error);
      throw error instanceof VideoError ? error : new VideoError(
        'Failed to process audio chunks',
        'audio/chunk-failed'
      );
    }
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return new Blob([byteArray], { type });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}