# ReelAI Coding Guidelines

> This document provides an overview of coding standards for the ReelAI project. For detailed guidelines, refer to the specific documents in the `coding/` directory.

## Dependency Management

### Package Installation
Always use `--save` for runtime dependencies and `--save-dev` for development dependencies:
```bash
# Runtime dependencies
npm install --save package-name

# Development dependencies
npm install --save-dev package-name
```

This ensures that all dependencies are properly tracked in package.json and can be installed by other developers.

## Quick Reference

### Project Structure
- Feature-based architecture
- Core utilities and shared components
- See [coding/structure.md](./coding/structure.md) for details

### File Length Guidelines
- Soft limit: 250 lines per file
- Break larger files into modules
- Use composition over inheritance
- Create utility files for shared logic
- Extract complex logic into services

When a file exceeds 250 lines:
1. Split by feature/functionality
2. Create helper/utility files
3. Extract reusable components
4. Document file relationships

### Code Style
- TypeScript-first approach
- Consistent naming conventions
- Clean component organization
- See [coding/style.md](./coding/style.md) for details

### Component Patterns
- Functional components with hooks
- Clear separation of concerns
- Performance optimization
- See [coding/components.md](./coding/components.md) for details

### State Management
- Custom hooks for local state
- Firebase integration patterns
- See [coding/state.md](./coding/state.md) for details

## Key Principles

### 1. Code Organization
```typescript
// Feature-based structure
features/
  video/
    components/     // Feature-specific components
    hooks/         // Custom hooks
    services/      // Business logic
    types.ts       // Type definitions
```

### 2. Component Structure
```typescript
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onError
}) => {
  // 1. Hooks
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 2. Effects
  useEffect(() => {
    // Setup
  }, [videoUrl]);
  
  // 3. Handlers
  const handleError = useCallback((error: Error) => {
    onError?.(error);
  }, [onError]);
  
  // 4. Render
  return (
    <Video
      source={{ uri: videoUrl }}
      onError={handleError}
    />
  );
};
```

### 3. Type Safety
```typescript
// Always define prop types
interface VideoPlayerProps {
  videoUrl: string;
  onError?: (error: Error) => void;
}

// Use type-safe state
const [videos, setVideos] = useState<Video[]>([]);
```

### 4. Error Handling
```typescript
try {
  await uploadVideo(file);
} catch (error) {
  // Type-safe error handling
  if (error instanceof StorageError) {
    handleStorageError(error);
  } else {
    handleGenericError(error);
  }
}
```

## Best Practices

1. **Component Design**
   - Single responsibility
   - Props interface first
   - Memoization when needed

2. **State Management**
   - Local state when possible
   - Custom hooks for reuse
   - Clear update patterns

3. **Performance**
   - Lazy loading
   - Proper memoization
   - See [coding/performance.md](./coding/performance.md)

4. **Firebase Integration**
   - Type-safe services
   - Error handling
   - See [coding/firebase.md](./coding/firebase.md)

## Related Documents
- [Database Guidelines](./database.md)
- [Security Guidelines](./security.md)
- [Testing Guidelines](./testing.md) 