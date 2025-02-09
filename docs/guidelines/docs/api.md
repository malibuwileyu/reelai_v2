# API Documentation Guidelines

> Detailed API documentation standards for the ReelAI project. See [Documentation Guidelines](../documentation.md) for overview.

## API Endpoint Documentation

### 1. Endpoint Headers
```typescript
/**
 * @api {post} /videos Upload a new video
 * @apiName UploadVideo
 * @apiGroup Videos
 * @apiVersion 1.0.0
 * 
 * @apiDescription
 * Uploads a new video file to the platform.
 * Handles video processing and metadata creation.
 */
```

### 2. Request Documentation
```typescript
/**
 * @apiParam {File} videoFile The video file to upload
 * @apiParam {Object} metadata Video metadata
 * @apiParam {String} metadata.title Video title (max 100 chars)
 * @apiParam {String} [metadata.description] Video description
 * @apiParam {String[]} [metadata.tags] Video tags
 * 
 * @apiParamExample {json} Request Example:
 * {
 *   "metadata": {
 *     "title": "My First Video",
 *     "description": "An awesome video",
 *     "tags": ["tutorial", "react-native"]
 *   }
 * }
 */
```

### 3. Response Documentation
```typescript
/**
 * @apiSuccess {String} videoId Unique video identifier
 * @apiSuccess {String} status Upload status
 * @apiSuccess {String} url Video URL once processed
 * 
 * @apiSuccessExample {json} Success Response:
 * HTTP/1.1 200 OK
 * {
 *   "videoId": "v-123abc",
 *   "status": "processing",
 *   "url": "https://storage.example.com/videos/v-123abc"
 * }
 * 
 * @apiError (400) InvalidInput Invalid input parameters
 * @apiError (413) FileTooLarge Video file exceeds size limit
 * @apiError (415) UnsupportedFormat Unsupported video format
 * 
 * @apiErrorExample {json} Error Response:
 * HTTP/1.1 400 Bad Request
 * {
 *   "error": "InvalidInput",
 *   "message": "Title is required",
 *   "details": {
 *     "field": "metadata.title",
 *     "constraint": "required"
 *   }
 * }
 */
```

## Firebase API Documentation

### 1. Collection Schema
```typescript
/**
 * @firestore
 * Collection: videos
 * 
 * Schema:
 * {
 *   id: string;           // Document ID (video ID)
 *   title: string;        // Video title
 *   description?: string; // Optional description
 *   userId: string;       // Creator's user ID
 *   status: 'processing' | 'ready' | 'failed';
 *   createdAt: timestamp;
 *   updatedAt: timestamp;
 *   metadata: {
 *     duration: number;   // Video duration in seconds
 *     format: string;     // Video format (e.g., 'mp4')
 *     resolution: string; // Video resolution (e.g., '1080p')
 *   }
 * }
 */
```

### 2. Security Rules
```typescript
/**
 * @rules
 * Service: Cloud Storage
 * 
 * Rules:
 * ```
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     // Allow read access to processed videos
 *     match /videos/{videoId} {
 *       allow read: if true;
 *       allow write: if request.auth != null
 *                   && request.resource.size < 100 * 1024 * 1024;
 *     }
 *   }
 * }
 * ```
 */
```

## GraphQL API Documentation

### 1. Type Definitions
```typescript
/**
 * @graphql
 * Schema: Video Types
 * 
 * ```graphql
 * type Video {
 *   id: ID!
 *   title: String!
 *   description: String
 *   url: String!
 *   thumbnail: String
 *   creator: User!
 *   createdAt: DateTime!
 *   stats: VideoStats!
 * }
 * 
 * type VideoStats {
 *   views: Int!
 *   likes: Int!
 *   shares: Int!
 * }
 * ```
 */
```

### 2. Query Documentation
```typescript
/**
 * @graphql
 * Query: Get Video Details
 * 
 * ```graphql
 * query GetVideo($id: ID!) {
 *   video(id: $id) {
 *     id
 *     title
 *     url
 *     creator {
 *       id
 *       username
 *     }
 *     stats {
 *       views
 *       likes
 *     }
 *   }
 * }
 * ```
 * 
 * @example
 * Variables:
 * {
 *   "id": "video-123"
 * }
 */
```

## API Client Documentation

### 1. Client Methods
```typescript
/**
 * Video API client for making requests to the video service.
 */
class VideoApiClient {
  /**
   * Upload a new video file.
   * 
   * @param file - Video file to upload
   * @param options - Upload options
   * @returns Upload result with video ID
   * @throws {ApiError} If the upload fails
   * 
   * @example
   * ```typescript
   * const client = new VideoApiClient();
   * const result = await client.uploadVideo(file, {
   *   title: 'My Video',
   *   description: 'Video description'
   * });
   * ```
   */
  async uploadVideo(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    // Implementation
  }
}
```

### 2. Error Handling
```typescript
/**
 * @apiError NetworkError Network connection failed
 * @apiError AuthError Authentication failed
 * @apiError ValidationError Invalid input data
 * 
 * Error Handling:
 * ```typescript
 * try {
 *   await client.uploadVideo(file, options);
 * } catch (error) {
 *   if (error instanceof NetworkError) {
 *     // Handle network error
 *   } else if (error instanceof ValidationError) {
 *     // Handle validation error
 *   }
 * }
 * ```
 */
``` 