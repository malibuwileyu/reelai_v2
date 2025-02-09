# Firebase Security Rules Guidelines

> Detailed Firebase security rules standards for the ReelAI project. See [Security Guidelines](../security.md) for overview.

## Firestore Rules

### 1. Basic Rules Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return request.auth.token.role == role;
    }
    
    // Collection rules
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
  }
}
```

### 2. Video Access Rules
```javascript
match /videos/{videoId} {
  // Helper functions
  function isVideoOwner() {
    return resource.data.creatorId == request.auth.uid;
  }
  
  function isValidVideo() {
    let data = request.resource.data;
    return data.title.size() <= 100 &&
           data.description.size() <= 500 &&
           data.tags.size() <= 10;
  }
  
  // Access rules
  allow read: if true;  // Public videos
  allow create: if isAuthenticated() && isValidVideo();
  allow update: if isVideoOwner() && isValidVideo();
  allow delete: if isVideoOwner();
  
  // Nested collections
  match /comments/{commentId} {
    allow read: if true;
    allow create: if isAuthenticated();
    allow update, delete: if request.auth.uid == resource.data.userId;
  }
}
```

### 3. User Data Rules
```javascript
match /users/{userId} {
  // Helper functions
  function isValidProfile() {
    let data = request.resource.data;
    return data.username.size() >= 3 &&
           data.username.size() <= 30 &&
           data.bio.size() <= 200;
  }
  
  function hasVerifiedEmail() {
    return request.auth.token.email_verified;
  }
  
  // Profile rules
  match /profile/{type} {
    allow read: if true;
    allow write: if isOwner(userId) && 
                   isValidProfile() &&
                   hasVerifiedEmail();
  }
  
  // Private data rules
  match /private/{doc} {
    allow read, write: if isOwner(userId);
  }
}
```

## Storage Rules

### 1. Video Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isValidVideo() {
      return request.resource.size < 100 * 1024 * 1024 && // 100MB
             request.resource.contentType.matches('video/.*');
    }
    
    function isValidThumbnail() {
      return request.resource.size < 5 * 1024 * 1024 && // 5MB
             request.resource.contentType.matches('image/.*');
    }
    
    // Video upload rules
    match /videos/{videoId} {
      allow read: if true;
      allow create: if request.auth != null &&
                      isValidVideo();
      allow delete: if request.auth != null &&
                      exists(/databases/$(database)/documents/videos/$(videoId)) &&
                      get(/databases/$(database)/documents/videos/$(videoId)).data.creatorId == request.auth.uid;
    }
    
    // Thumbnail rules
    match /thumbnails/{thumbnailId} {
      allow read: if true;
      allow create: if request.auth != null &&
                      isValidThumbnail();
    }
  }
}
```

### 2. User Content Rules
```javascript
match /users/{userId}/{fileName} {
  // Helper functions
  function isValidProfileImage() {
    return request.resource.size < 2 * 1024 * 1024 && // 2MB
           request.resource.contentType.matches('image/.*');
  }
  
  function isValidUserContent() {
    return request.resource.size < 10 * 1024 * 1024; // 10MB
  }
  
  // Profile image rules
  match /profile/{imageId} {
    allow read: if true;
    allow create: if request.auth.uid == userId &&
                    isValidProfileImage();
    allow delete: if request.auth.uid == userId;
  }
  
  // User content rules
  match /content/{contentId} {
    allow read: if request.auth.uid == userId;
    allow create: if request.auth.uid == userId &&
                    isValidUserContent();
    allow delete: if request.auth.uid == userId;
  }
}
```

## Validation Rules

### 1. Data Validation
```javascript
// Helper functions for data validation
function isValidString(value, minLength, maxLength) {
  return value is string &&
         value.size() >= minLength &&
         value.size() <= maxLength;
}

function isValidTimestamp(value) {
  return value is timestamp &&
         value <= request.time;
}

function isValidArray(value, maxSize) {
  return value is list &&
         value.size() <= maxSize;
}

// Example usage
match /videos/{videoId} {
  function isValidVideoData() {
    let data = request.resource.data;
    return isValidString(data.title, 1, 100) &&
           isValidString(data.description, 0, 500) &&
           isValidArray(data.tags, 10) &&
           isValidTimestamp(data.createdAt);
  }
  
  allow create: if isAuthenticated() && isValidVideoData();
}
```

### 2. Role-Based Access
```javascript
// Role-based access control
function hasAnyRole(roles) {
  return request.auth.token.role in roles;
}

function isAdmin() {
  return hasAnyRole(['admin']);
}

function isModerator() {
  return hasAnyRole(['admin', 'moderator']);
}

// Example usage
match /reports/{reportId} {
  allow read: if isModerator();
  allow write: if isAdmin();
}
```

## Security Best Practices

### 1. Rate Limiting
```javascript
// Rate limiting helper functions
function isWithinRateLimit() {
  let recentAttempts = getRecentAttempts();
  return recentAttempts < 5;
}

function getRecentAttempts() {
  let attempts = get(/databases/$(database)/documents/ratelimits/$(request.auth.uid)).data.attempts;
  return attempts.filter(a => a.timestamp > request.time - duration.value(15, 'm')).size();
}

// Example usage
match /uploads/{uploadId} {
  allow create: if isAuthenticated() &&
                  isWithinRateLimit();
}
```

### 2. Data Sanitization
```javascript
// Data sanitization helpers
function isSanitized(value) {
  return !value.matches('.*[<>].*');
}

function sanitizeUserInput() {
  let data = request.resource.data;
  return data.keys().every(key => 
    isSanitized(data[key])
  );
}

// Example usage
match /comments/{commentId} {
  allow create: if isAuthenticated() &&
                  sanitizeUserInput();
}
``` 