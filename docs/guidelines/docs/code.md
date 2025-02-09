# Code Documentation Guidelines

> Detailed code documentation standards for the ReelAI project. See [Documentation Guidelines](../documentation.md) for overview.

## Component Documentation

### 1. Component Headers
```typescript
/**
 * VideoPlayer component for handling video playback in the feed.
 * 
 * Features:
 * - Autoplay support with configurable settings
 * - Custom controls with progress tracking
 * - Error handling with retry capabilities
 * - Analytics integration for view tracking
 * 
 * @component
 * @example
 * ```tsx
 * <VideoPlayer
 *   videoUrl="https://example.com/video.mp4"
 *   autoplay={true}
 *   onError={handleError}
 * />
 * ```
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = // ...
```

### 2. Props Documentation
```typescript
/**
 * Props for the VideoPlayer component.
 */
interface VideoPlayerProps {
  /** URL of the video to play */
  videoUrl: string;
  
  /** Whether to autoplay the video on mount */
  autoplay?: boolean;
  
  /** Callback fired when video fails to load or play */
  onError?: (error: VideoError) => void;
  
  /** Custom styles for the video container */
  style?: StyleProp<ViewStyle>;
}
```

## Hook Documentation

### 1. Custom Hook Headers
```typescript
/**
 * Hook for managing video playback state and controls.
 * 
 * Features:
 * - Playback state management
 * - Progress tracking
 * - Error handling
 * 
 * @param videoId - ID of the video to manage
 * @returns Video state and control methods
 * 
 * @example
 * ```tsx
 * const { 
 *   isPlaying,
 *   progress,
 *   play,
 *   pause 
 * } = useVideo('video-123');
 * ```
 */
export function useVideo(videoId: string): VideoHookResult {
  // Implementation
}
```

### 2. Return Type Documentation
```typescript
/**
 * Result type for the useVideo hook.
 */
interface VideoHookResult {
  /** Whether the video is currently playing */
  isPlaying: boolean;
  
  /** Current playback progress (0-1) */
  progress: number;
  
  /** Start video playback */
  play: () => void;
  
  /** Pause video playback */
  pause: () => void;
}
```

## Service Documentation

### 1. Service Methods
```typescript
/**
 * Upload a video file to storage.
 * 
 * Process:
 * 1. Validates file size and format
 * 2. Uploads to Firebase Storage
 * 3. Creates Firestore document
 * 4. Triggers processing pipeline
 * 
 * @param file - Video file to upload
 * @param metadata - Video metadata
 * @returns Uploaded video ID and status
 * @throws {VideoUploadError} If upload fails
 * 
 * @example
 * ```typescript
 * const { videoId } = await uploadVideo(file, {
 *   title: 'My Video',
 *   description: 'Video description'
 * });
 * ```
 */
async function uploadVideo(
  file: File,
  metadata: VideoMetadata
): Promise<UploadResult> {
  // Implementation
}
```

### 2. Type Documentation
```typescript
/**
 * Configuration for video processing.
 * 
 * @remarks
 * These settings affect video quality and processing time.
 * Higher quality settings will increase processing time.
 */
interface ProcessingConfig {
  /** Maximum output resolution (e.g., '1080p') */
  maxResolution: string;
  
  /** Target video bitrate in kbps */
  bitrate: number;
  
  /** Whether to generate thumbnails */
  generateThumbnails: boolean;
}
```

## File Organization

### 1. File Headers
```typescript
/**
 * @file VideoService.ts
 * @description Video upload and processing service.
 * 
 * This service handles:
 * - Video upload to Firebase Storage
 * - Metadata management in Firestore
 * - Processing pipeline integration
 * - Error handling and retry logic
 * 
 * @module services/video
 */

import { storage } from '@core/firebase';
// ... other imports
```

### 2. Module Exports
```typescript
/**
 * @file index.ts
 * @description Public API for the video feature.
 * 
 * Exports:
 * - VideoPlayer component
 * - useVideo hook
 * - Video service methods
 * - Type definitions
 */

export * from './components/VideoPlayer';
export * from './hooks/useVideo';
export * from './services/videoService';
export * from './types';
```

## Best Practices

### 1. Comment Style
```typescript
// DO: Explain complex logic
// Calculate video segments based on keyframe positions
const segments = calculateSegments(keyframes);

// DON'T: State the obvious
// Set the title
setTitle(newTitle);
```

### 2. Type Comments
```typescript
// DO: Document type constraints
/** Duration in seconds (must be > 0) */
duration: number;

// DON'T: Repeat type information
/** String */ // Redundant
title: string;
```

### 3. Example Usage
```typescript
/**
 * @example
 * // Basic usage
 * <VideoPlayer videoUrl="..." />
 * 
 * // With all options
 * <VideoPlayer
 *   videoUrl="..."
 *   autoplay={true}
 *   controls={true}
 *   onError={handleError}
 * />
 */
``` 