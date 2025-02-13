# FFMPEG Service Implementation Plan

## Overview
This document outlines the implementation plan for the FFMPEG audio extraction service using Firebase Functions.

## Directory Structure
```
functions/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── config/
│   │   └── firebase.ts          # Firebase admin initialization
│   ├── services/
│   │   └── ffmpeg.service.ts    # FFMPEG service implementation
│   └── types/
│       └── index.ts             # Type definitions
├── package.json                 # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

## Implementation Steps

### 1. FFMPEG Service (`src/services/ffmpeg.service.ts`)
The service will handle audio extraction using FFMPEG:

```typescript
interface AudioExtractionOptions {
  format: 'mp3' | 'm4a';
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
}

class FFmpegService {
  async extractAudio(
    videoPath: string, 
    outputPath: string,
    options: AudioExtractionOptions
  ): Promise<string>
}
```

### 2. Firebase Function (`src/index.ts`)
The HTTP function will:
1. Accept video URL from request
2. Download video to temp storage
3. Process using FFMPEG
4. Upload audio to Firebase Storage
5. Return audio URL

```typescript
export const extractAudio = https.onCall(async (data, context) => {
  // Implementation
});
```

### 3. Security Rules
Update Storage rules to allow audio file access:
```
match /audio/{audioId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## Configuration

### Environment Variables
Required in `.env`:
```
FIREBASE_STORAGE_BUCKET="your-bucket-name"
TEMP_DIRECTORY="/tmp"
```

### Firebase Config
Update `firebase.json`:
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

## API Usage

### Function Call
```typescript
const result = await functions.httpsCallable('extractAudio')({
  videoUrl: 'https://storage.../video.mp4',
  options: {
    format: 'mp3',
    bitrate: '192k'
  }
});
```

### Response Format
```typescript
interface ExtractAudioResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
}
```

## Testing

### Unit Tests
Create tests for:
- FFMPEG service
- Input validation
- Error handling

### Integration Tests
Test:
- Full extraction flow
- Storage operations
- Error scenarios

## Deployment

### Steps
1. Build TypeScript:
   ```bash
   cd functions
   npm run build
   ```

2. Deploy function:
   ```bash
   firebase deploy --only functions:extractAudio
   ```

### Monitoring
Monitor using Firebase Console:
- Function execution
- Error rates
- Performance metrics

## Error Handling

### Error Types
```typescript
type FFmpegError = 
  | 'INVALID_INPUT'
  | 'PROCESSING_FAILED'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR';
```

### Error Responses
All errors will include:
- Error code
- Human-readable message
- Timestamp
- Request ID

## Performance Considerations

### Optimizations
1. Use appropriate memory allocation
2. Clean up temporary files
3. Stream processing where possible
4. Implement timeout handling

### Limitations
- Max video size: 100MB
- Max processing time: 5 minutes
- Supported formats: MP4, MOV
- Output formats: MP3, M4A

## Next Steps

1. Create TypeScript files in `functions/src`
2. Implement FFMPEG service
3. Add Firebase function
4. Write tests
5. Deploy and test
6. Monitor performance
7. Iterate based on feedback 