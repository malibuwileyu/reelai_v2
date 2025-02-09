# Authentication API

## Register User
Creates a new user account.

```http
POST /auth/register
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "uid": "user123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "idToken": "firebase_id_token",
    "refreshToken": "firebase_refresh_token"
  }
}
```

## Login
Authenticates an existing user.

```http
POST /auth/login
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "status": "success", 
  "data": {
    "uid": "user123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "idToken": "firebase_id_token",
    "refreshToken": "firebase_refresh_token"
  }
}
```

## Reset Password
Sends a password reset email.

```http
POST /auth/reset-password
```

### Request Body
```json
{
  "email": "user@example.com"
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "message": "Password reset email sent"
  }
}
```

## Refresh Token
Gets a new ID token using a refresh token.

```http
POST /auth/refresh
```

### Request Body
```json
{
  "refreshToken": "firebase_refresh_token"
}
```

### Response
```json
{
  "status": "success",
  "data": {
    "idToken": "new_firebase_id_token",
    "refreshToken": "new_firebase_refresh_token"
  }
}
```

## Error Responses

### Invalid Credentials
```json
{
  "status": "error",
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Email Already Exists
```json
{
  "status": "error", 
  "error": {
    "code": "AUTH_EMAIL_EXISTS",
    "message": "Email already registered"
  }
}
```

### Invalid Token
```json
{
  "status": "error",
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
``` 