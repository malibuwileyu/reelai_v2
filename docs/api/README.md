# ReelAI API Documentation

## Overview
ReelAI uses a combination of Firebase services and FastAPI endpoints for its backend functionality.

## Authentication API
See [auth.md](auth.md) for detailed authentication endpoints.

### Base URL
- Firebase Auth: `https://identitytoolkit.googleapis.com/v1`
- Custom API: `https://api.reel-ai.com/v1`

### Authentication
All API requests (except public endpoints) require a Firebase ID token:
```http
Authorization: Bearer <firebase_id_token>
```

## API Guidelines

### Request/Response Format
```json
// Success Response
{
  "status": "success",
  "data": {
    // Response data
  }
}

// Error Response
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per day per user

### Versioning
API versioning is handled through the URL:
```
/v1/videos
/v2/videos
```

## Available Endpoints

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/reset-password`

### Videos
- `POST /videos`
- `GET /videos/{id}`
- `PUT /videos/{id}`
- `DELETE /videos/{id}`

### Users
- `GET /users/{id}`
- `PUT /users/{id}`
- `GET /users/{id}/videos`

## Error Codes
- `AUTH_INVALID`: Invalid authentication
- `AUTH_EXPIRED`: Token expired
- `VIDEO_NOT_FOUND`: Video not found
- `VIDEO_INVALID`: Invalid video data
- `USER_NOT_FOUND`: User not found 