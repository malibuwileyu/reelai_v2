import { cloudinary } from '../config/cloudinary';
import { VideoError } from '../types/video';

interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  format: string;
  duration: number;
}

interface CloudinaryTranscriptionResult {
  url: string;
  duration: number;
  transcript?: string;
}

export class CloudinaryService {
  private logger: Console;

  constructor(logger: Console = console) {
    this.logger = logger;
  }

  /**
   * Process video through Cloudinary, extracting audio and generating transcript
   */
  async processVideo(videoFile: File | Blob): Promise<CloudinaryTranscriptionResult> {
    try {
      this.logger.info('[CloudinaryService] Starting video processing...');

      // Upload to Cloudinary with audio extraction
      const uploadResult = await this.uploadVideo(videoFile);
      this.logger.info('[CloudinaryService] Video uploaded successfully:', uploadResult);

      // Generate audio-only version
      const audioUrl = cloudinary.url(uploadResult.publicId, {
        resource_type: 'video',
        format: 'm4a',
        audio_codec: 'aac',
        bit_rate: '128k',
        sample_rate: '44100'
      });

      this.logger.info('[CloudinaryService] Audio URL generated:', audioUrl);

      return {
        url: audioUrl,
        duration: uploadResult.duration
      };
    } catch (error) {
      this.logger.error('[CloudinaryService] Error processing video:', error);
      throw new VideoError(
        'Failed to process video with Cloudinary',
        'video/processing-failed'
      );
    }
  }

  /**
   * Upload video to Cloudinary
   */
  private async uploadVideo(file: File | Blob): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!uploadPreset) {
        reject(new Error('Missing Cloudinary upload preset'));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('resource_type', 'video');

      fetch(`https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            throw new Error(data.error.message);
          }
          resolve({
            publicId: data.public_id,
            url: data.secure_url,
            format: data.format,
            duration: data.duration
          });
        })
        .catch(reject);
    });
  }
} 