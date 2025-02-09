# Video API

## Create Video
Upload a new video.

```http
POST /videos
Content-Type: multipart/form-data
```

### Request Body
```
title: "My Video Title"
description: "Video description"
video: <video_file>
thumbnail: <thumbnail_image> (optional)
tags: ["tag1", "tag2"] (optional)
visibility: "public" | "private" | "unlisted" (default: private)
```

### Response
```json
{
  "status": "success",
  "data": {
    "id": "video123",
    "title": "My Video Title",
    "description": "Video description",
    "url": "https://storage.googleapis.com/videos/video123.mp4",
    "thumbnailUrl": "https://storage.googleapis.com/thumbnails/video123.jpg",
    "duration": 120,
    "views": 0,
    "likes": 0,
    "createdAt": "2024-03-20T12:00:00Z",
    "updatedAt": "2024-03-20T12:00:00Z",
    "status": "processing",
    "visibility": "private",
    "tags": ["tag1", "tag2"],
    "owner": {
      "uid": "user123",
      "displayName": "John Doe"
    }
  }
}
```

## Get Video
Get video details by ID.

```http
GET /videos/{id}
```

### Response
```json
{
  "status": "success",
  "data": {
    "id": "video123",
    "title": "My Video Title",
    "description": "Video description",
    "url": "https://storage.googleapis.com/videos/video123.mp4",
    "thumbnailUrl": "https://storage.googleapis.com/thumbnails/video123.jpg",
    "duration": 120,
    "views": 100,
    "likes": 10,
    "createdAt": "2024-03-20T12:00:00Z",
    "updatedAt": "2024-03-20T12:00:00Z",
    "status": "ready",
    "visibility": "public",
    "tags": ["tag1", "tag2"],
    "owner": {
      "uid": "user123",
      "displayName": "John Doe"
    }
  }
}
```

## Update Video
Update video details.

```http
PUT /videos/{id}
```

### Request Body
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "visibility": "public",
  "tags": ["new-tag1", "new-tag2"]
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "id": "video123",
    "title": "Updated Title",
    "description": "Updated description",
    "visibility": "public",
    "tags": ["new-tag1", "new-tag2"],
    "updatedAt": "2024-03-20T13:00:00Z"
  }
}
```

## Delete Video
Delete a video.

```http
DELETE /videos/{id}
```

### Response
```json
{
  "status": "success",
  "data": {
    "message": "Video deleted successfully"
  }
}
```

## List Videos
Get a paginated list of videos.

```http
GET /videos?page=1&limit=10&sort=newest&visibility=public
```

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `sort`: Sort order (newest, popular, trending)
- `visibility`: Filter by visibility (public, private, unlisted)
- `tags`: Filter by tags (comma-separated)
- `search`: Search term

### Response
```json
{
  "status": "success",
  "data": {
    "videos": [
      {
        "id": "video123",
        "title": "Video Title",
        "thumbnailUrl": "https://storage.googleapis.com/thumbnails/video123.jpg",
        "duration": 120,
        "views": 100,
        "createdAt": "2024-03-20T12:00:00Z",
        "owner": {
          "uid": "user123",
          "displayName": "John Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## Error Responses

### Video Not Found
```json
{
  "status": "error",
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "Video not found"
  }
}
```

### Invalid Request
```json
{
  "status": "error",
  "error": {
    "code": "VIDEO_INVALID_REQUEST",
    "message": "Invalid video data"
  }
}
```

### Upload Failed
```json
{
  "status": "error",
  "error": {
    "code": "VIDEO_UPLOAD_FAILED",
    "message": "Failed to upload video"
  }
}
```

### Permission Denied
```json
{
  "status": "error",
  "error": {
    "code": "VIDEO_PERMISSION_DENIED",
    "message": "You don't have permission to perform this action"
  }
} 