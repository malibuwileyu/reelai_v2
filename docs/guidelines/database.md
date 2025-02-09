# ReelAI Database Guidelines

> This document provides an overview of database standards for the ReelAI project. For detailed guidelines, refer to the specific documents in the `database/` directory.

## Quick Reference

### Data Structure
- Collection/document organization
- Relationship patterns
- See [database/structure.md](./database/structure.md)

### Data Modeling
- Document design principles
- References vs. embedding
- See [database/modeling.md](./database/modeling.md)

### Query Patterns
- Common query patterns
- Performance optimization
- See [database/queries.md](./database/queries.md)

## Key Collections

### Users Collection
```javascript
users/{userId}/
  ├── profile      // Public user data
  ├── preferences  // User settings
  └── stats        // User statistics
```

### Videos Collection
```javascript
videos/{videoId}/
  ├── metadata     // Video information
  ├── processing   // Processing status
  └── analytics    // View counts, etc.
```

### Interactions Collection
```javascript
interactions/
  ├── likes/{likeId}
  ├── comments/{commentId}
  └── shares/{shareId}
```

## Best Practices

### 1. Document Structure
```javascript
// Video document example
{
  "id": "video123",
  "creatorId": "user456",
  "title": "My Video",
  "metadata": {
    "duration": 180,
    "resolution": "1080p"
  },
  "stats": {
    "views": 1000,
    "likes": 100
  },
  "createdAt": timestamp
}
```

### 2. Query Optimization
```javascript
// Efficient queries
db.collection('videos')
  .where('creatorId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(10);

// Required indexes in [database/queries.md](./database/queries.md)
```

### 3. Data Validation
```javascript
// Firestore rules example
match /videos/{videoId} {
  allow read: if true;
  allow write: if isAuthenticated()
    && isValidVideo(request.resource.data);
}
```

## Key Principles

1. **Data Organization**
   - Shallow structures
   - Smart denormalization
   - Clear relationships

2. **Performance**
   - Efficient queries
   - Smart indexing
   - See [database/queries.md](./database/queries.md)

3. **Maintenance**
   - Backup strategy
   - Monitoring
   - See [database/maintenance.md](./database/maintenance.md)

## Related Documents
- [Security Guidelines](./security.md)
- [Coding Guidelines](./coding.md) 