# ReelAI Testing Guidelines

> This document provides an overview of testing standards for the ReelAI project. For detailed guidelines, refer to the specific documents in the `testing/` directory.

## Quick Reference

### Framework Setup
```json
{
  "dependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.0.0",
    "jest": "^29.0.0",
    "jest-expo": "^50.0.0"
  }
}
```

### Testing Types
- Component Tests - See [testing/component.md](./testing/component.md)
- Integration Tests - See [testing/integration.md](./testing/integration.md)
- API Tests - See [testing/api.md](./testing/api.md)

## Key Principles

### 1. Component Testing
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('VideoPlayer', () => {
  it('handles playback', async () => {
    const { getByTestId } = render(
      <VideoPlayer videoId="test-id" />
    );
    
    await fireEvent.press(getByTestId('play-button'));
    expect(getByTestId('video')).toHaveState('playing');
  });
});
```

### 2. Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react-hooks';

describe('useVideo', () => {
  it('loads video data', async () => {
    const { result } = renderHook(() => 
      useVideo('test-id')
    );
    
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.video).toBeTruthy();
  });
});
```

### 3. Integration Testing
```typescript
describe('Video Upload Flow', () => {
  it('completes upload process', async () => {
    const { getByTestId } = render(<App />);
    
    // Navigate to upload
    fireEvent.press(getByTestId('upload-tab'));
    
    // Select video
    await fireEvent.press(getByTestId('select-video'));
    
    // Verify success
    expect(await findByText('Upload Complete')).toBeTruthy();
  });
});
```

## Coverage Requirements

### Minimum Coverage
- Components: 80%
- Hooks: 90%
- Services: 85%
- See [testing/coverage.md](./testing/coverage.md)

### Critical Paths
1. Authentication Flow
   - Sign in/out
   - Profile management
   
2. Video Operations
   - Upload
   - Processing
   - Playback

3. Social Features
   - Comments
   - Likes
   - Shares

## Best Practices

### 1. Test Organization
```
__tests__/
├── components/
│   └── VideoPlayer.test.tsx
├── hooks/
│   └── useVideo.test.ts
└── integration/
    └── VideoUpload.test.tsx
```

### 2. Naming Conventions
```
Components: ComponentName.test.tsx
Hooks: useName.test.ts
Integration: FeatureFlow.test.tsx
```

### 3. Test Data
```typescript
// Mock data examples
const mockVideo = {
  id: 'test-id',
  title: 'Test Video',
  url: 'https://example.com/video.mp4'
};

const mockUser = {
  id: 'user-id',
  name: 'Test User'
};
```

## Related Documents
- [Coding Guidelines](./coding.md)
- [Documentation Guidelines](./documentation.md) 