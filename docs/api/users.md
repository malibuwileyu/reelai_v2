# User API

## Get User Profile
Get user profile by ID.

```http
GET /users/{id}
```

### Response
```json
{
  "status": "success",
  "data": {
    "uid": "user123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": "https://storage.googleapis.com/avatars/user123.jpg",
    "bio": "Video creator and editor",
    "createdAt": "2024-03-20T12:00:00Z",
    "stats": {
      "videos": 10,
      "subscribers": 1000,
      "views": 50000
    },
    "social": {
      "twitter": "johndoe",
      "instagram": "johndoe",
      "website": "https://johndoe.com"
    }
  }
}
```

## Update User Profile
Update user profile details.

```http
PUT /users/{id}
```

### Request Body
```json
{
  "displayName": "John Smith",
  "bio": "Professional video creator",
  "social": {
    "twitter": "johnsmith",
    "instagram": "johnsmith",
    "website": "https://johnsmith.com"
  }
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "uid": "user123",
    "displayName": "John Smith",
    "bio": "Professional video creator",
    "social": {
      "twitter": "johnsmith",
      "instagram": "johnsmith",
      "website": "https://johnsmith.com"
    },
    "updatedAt": "2024-03-20T13:00:00Z"
  }
}
```

## Update Profile Picture
Update user's profile picture.

```http
PUT /users/{id}/photo
Content-Type: multipart/form-data
```

### Request Body
```
photo: <image_file>
```

### Response
```json
{
  "status": "success",
  "data": {
    "photoURL": "https://storage.googleapis.com/avatars/user123.jpg",
    "updatedAt": "2024-03-20T13:00:00Z"
  }
}
```

## Get User Videos
Get a paginated list of user's videos.

```http
GET /users/{id}/videos?page=1&limit=10&visibility=public
```

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `visibility`: Filter by visibility (public, private, unlisted)
- `sort`: Sort order (newest, popular)

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
        "visibility": "public"
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

## Get User Analytics
Get user's channel analytics.

```http
GET /users/{id}/analytics?timeRange=30d
```

### Query Parameters
- `timeRange`: Time range (7d, 30d, 90d, 365d)

### Response
```json
{
  "status": "success",
  "data": {
    "views": {
      "total": 50000,
      "change": 5000,
      "changePercentage": 10
    },
    "subscribers": {
      "total": 1000,
      "change": 100,
      "changePercentage": 10
    },
    "engagement": {
      "likes": 2000,
      "comments": 500,
      "shares": 300
    },
    "topVideos": [
      {
        "id": "video123",
        "title": "Video Title",
        "views": 1000,
        "engagement": 0.15
      }
    ],
    "viewsByDay": [
      {
        "date": "2024-03-20",
        "views": 500
      }
    ]
  }
}
```

## Error Responses

### User Not Found
```json
{
  "status": "error",
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

### Invalid Request
```json
{
  "status": "error",
  "error": {
    "code": "USER_INVALID_REQUEST",
    "message": "Invalid user data"
  }
}
```

### Permission Denied
```json
{
  "status": "error",
  "error": {
    "code": "USER_PERMISSION_DENIED",
    "message": "You don't have permission to perform this action"
  }
}
```

### Upload Failed
```json
{
  "status": "error",
  "error": {
    "code": "USER_UPLOAD_FAILED",
    "message": "Failed to upload profile picture"
  }
}
``` 