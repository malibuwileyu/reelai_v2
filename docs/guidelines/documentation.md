# ReelAI Documentation Guidelines

> This document provides an overview of documentation standards for the ReelAI project. For detailed guidelines, refer to the specific documents in the `docs/` directory.

## Quick Reference

### Documentation Types
- Code Documentation - See [docs/code.md](./docs/code.md)
- API Documentation - See [docs/api.md](./docs/api.md)
- Maintenance - See [docs/maintenance.md](./docs/maintenance.md)

## Key Principles

### 1. Code Documentation
```typescript
/**
 * VideoPlayer component for handling video playback.
 * 
 * Features:
 * - Autoplay support
 * - Custom controls
 * - Error handling
 * 
 * @param videoUrl - URL of the video to play
 * @param onError - Optional error handler
 * 
 * @example
 * ```tsx
 * <VideoPlayer
 *   videoUrl="https://example.com/video.mp4"
 *   onError={handleError}
 * />
 * ```
 */
export const VideoPlayer = // ...
```

### 2. API Documentation
```typescript
/**
 * Upload and process a new video.
 * 
 * @route POST /api/videos
 * @body {File} file - The video file to upload
 * @body {Object} metadata - Video metadata
 * @body {string} metadata.title - Video title
 * @body {string} metadata.description - Video description
 * 
 * @returns {Object} response
 * @returns {string} response.videoId - The ID of the uploaded video
 * @returns {string} response.status - Processing status
 * 
 * @throws {400} - If file or metadata is invalid
 * @throws {413} - If file size exceeds limit
 */
async function uploadVideo(file: File, metadata: VideoMetadata) {
  // Implementation
}
```

### 3. Type Documentation
```typescript
/**
 * Configuration for video upload.
 */
interface VideoUploadConfig {
  /** Maximum file size in bytes */
  maxSize: number;
  
  /** Allowed video formats */
  allowedFormats: string[];
  
  /** Processing quality (low, medium, high) */
  quality: VideoQuality;
}
```

## Documentation Structure

### Project Documentation
```
docs/
├── api/           # API documentation
├── setup/         # Setup guides
└── architecture/  # Architecture docs
```

### Code Documentation
- File headers
- Function/method docs
- Type definitions
- Examples

### API Documentation
- Endpoints
- Request/response formats
- Error handling
- Examples

## Best Practices

### 1. Writing Style
- Be clear and concise
- Use active voice
- Include examples
- Explain "why" not just "what"

### 2. Code Examples
- Show common use cases
- Include error handling
- Use type information
- Follow style guidelines

### 3. Maintenance
- Regular reviews
- Version control
- Remove outdated content
- Keep setup guides current

## Related Documents
- [Coding Guidelines](./coding.md)
- [Testing Guidelines](./testing.md) 