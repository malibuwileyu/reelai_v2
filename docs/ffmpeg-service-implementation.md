# FFMPEG Service Implementation Plan (React Server Approach)

## Overview
This document outlines the implementation plan for video processing using a dedicated React server with FFMPEG, integrated with our existing Firebase infrastructure.

## Architecture

### Components
```
Client (Expo App) → React Server → Firebase Storage
                     ↓
                    FFMPEG
                     ↓
                    WhisperAPI
                     ↓
                    Firebase DB
```

## Implementation Phases

### Phase 1: Basic Server Setup
1. Create Express server project:
   ```bash
   mkdir video-processing-server
   cd video-processing-server
   npm init -y
   npm install express cors dotenv typescript ts-node @types/node @types/express
   ```

2. Server structure:
   ```
   video-processing-server/
   ├── src/
   │   ├── index.ts           # Server entry point
   │   ├── routes/
   │   │   └── health.ts      # Health check endpoint
   │   ├── services/
   │   │   └── ffmpeg.ts      # FFMPEG service
   │   └── types/
   │       └── index.ts       # Type definitions
   ├── package.json
   └── tsconfig.json
   ```

3. Initial endpoints:
   ```typescript
   // Health check endpoint
   GET /health
   Response: { status: 'ok', timestamp: number }
   ```

### Phase 2: Client Integration
1. Add test screen to Expo app:
   ```
   src/screens/
   └── debug/
       └── ServerTestScreen.tsx
   ```

2. Test connection flow:
   - Button to ping server
   - Status display
   - Error handling

### Phase 3: FFMPEG Integration
1. FFMPEG setup:
   ```bash
   npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
   ```

2. Basic operations:
   - Video info extraction
   - Audio extraction
   - Format conversion

3. Processing pipeline:
   ```typescript
   interface ProcessingJob {
     id: string;
     status: 'pending' | 'processing' | 'completed' | 'failed';
     videoUrl: string;
     outputUrl?: string;
     error?: string;
   }
   ```

### Phase 4: Firebase Integration
1. Storage operations:
   - Download video from Firebase Storage
   - Process locally
   - Upload processed audio
   - Update metadata

2. Database operations:
   - Track processing status
   - Store job results
   - Handle errors

### Phase 5: WhisperAPI Integration
1. Audio processing:
   - Split into chunks if needed
   - Handle rate limits
   - Merge transcripts

2. Response handling:
   - Format transcripts
   - Store in Firebase
   - Update video metadata

## API Endpoints

### Health Check
```typescript
GET /health
Response: {
  status: 'ok' | 'error';
  timestamp: number;
  version: string;
}
```

### Process Video
```typescript
POST /process
Body: {
  videoId: string;
  videoUrl: string;
  options?: {
    format?: 'mp3' | 'm4a';
    quality?: 'low' | 'medium' | 'high';
  }
}
Response: {
  jobId: string;
  status: 'pending';
}
```

### Check Status
```typescript
GET /status/:jobId
Response: {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}
```

## Error Handling

### Error Types
```typescript
type ProcessingError =
  | 'DOWNLOAD_FAILED'
  | 'FFMPEG_ERROR'
  | 'UPLOAD_FAILED'
  | 'WHISPER_ERROR'
  | 'INVALID_INPUT';
```

### Error Responses
All errors include:
- Error code
- Message
- Timestamp
- Job ID (if applicable)

## Monitoring

### Metrics to Track
1. Processing times
2. Error rates
3. Queue length
4. Resource usage

### Logging
```typescript
interface ProcessingLog {
  timestamp: number;
  jobId: string;
  stage: 'download' | 'ffmpeg' | 'whisper' | 'upload';
  status: 'start' | 'complete' | 'error';
  duration?: number;
  error?: string;
}
```

## Development Steps

### 1. Initial Setup (Current Focus)
- [x] Create server project
- [ ] Add health endpoint
- [ ] Create test UI screen
- [ ] Test basic connectivity

### 2. FFMPEG Integration
- [ ] Install FFMPEG
- [ ] Create processing service
- [ ] Test basic operations
- [ ] Add job queue

### 3. Firebase Integration
- [ ] Add Firebase admin SDK
- [ ] Implement storage operations
- [ ] Add database updates
- [ ] Test end-to-end flow

### 4. WhisperAPI Integration
- [ ] Add OpenAI client
- [ ] Implement chunking
- [ ] Handle rate limits
- [ ] Store transcripts

### 5. Production Readiness
- [ ] Add monitoring
- [ ] Implement logging
- [ ] Add error recovery
- [ ] Deploy infrastructure

## Next Steps
1. Create basic server
2. Add health endpoint
3. Create test UI
4. Test connectivity 