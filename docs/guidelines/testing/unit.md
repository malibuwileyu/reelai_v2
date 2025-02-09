# Unit Testing Guidelines

> Unit testing standards for the ReelAI project. See [Testing Guidelines](../testing.md) for overview.

## Test Setup

### 1. Jest Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.styles.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 2. Test Utils
```typescript
// test/utils/test-utils.tsx
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { AuthProvider } from '@/auth';

const AllTheProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (ui, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
```

## Test Patterns

### 1. Component Tests
```typescript
// components/__tests__/VideoPlayer.test.tsx
import { render, fireEvent, waitFor } from '@/test/utils';
import { VideoPlayer } from '../VideoPlayer';

describe('VideoPlayer', () => {
  const mockVideo = {
    id: '123',
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg'
  };
  
  it('renders correctly', () => {
    const { getByTestId } = render(
      <VideoPlayer video={mockVideo} />
    );
    
    expect(getByTestId('video-player')).toBeTruthy();
    expect(getByTestId('video-thumbnail')).toHaveProp(
      'source',
      { uri: mockVideo.thumbnail }
    );
  });
  
  it('handles play/pause', async () => {
    const onPlayChange = jest.fn();
    const { getByTestId } = render(
      <VideoPlayer
        video={mockVideo}
        onPlayChange={onPlayChange}
      />
    );
    
    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);
    
    await waitFor(() => {
      expect(onPlayChange).toHaveBeenCalledWith(true);
    });
  });
  
  it('handles seek', async () => {
    const onSeek = jest.fn();
    const { getByTestId } = render(
      <VideoPlayer
        video={mockVideo}
        onSeek={onSeek}
      />
    );
    
    const seekBar = getByTestId('seek-bar');
    fireEvent(seekBar, 'valueChange', 30);
    
    await waitFor(() => {
      expect(onSeek).toHaveBeenCalledWith(30);
    });
  });
});
```

### 2. Hook Tests
```typescript
// hooks/__tests__/useVideo.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useVideo } from '../useVideo';

describe('useVideo', () => {
  const mockVideo = {
    id: '123',
    url: 'https://example.com/video.mp4'
  };
  
  it('initializes with default state', () => {
    const { result } = renderHook(() => useVideo(mockVideo));
    
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.isBuffering).toBe(false);
  });
  
  it('handles play state changes', () => {
    const { result } = renderHook(() => useVideo(mockVideo));
    
    act(() => {
      result.current.play();
    });
    
    expect(result.current.isPlaying).toBe(true);
    
    act(() => {
      result.current.pause();
    });
    
    expect(result.current.isPlaying).toBe(false);
  });
  
  it('updates progress', () => {
    const { result } = renderHook(() => useVideo(mockVideo));
    
    act(() => {
      result.current.onProgress(0.5);
    });
    
    expect(result.current.progress).toBe(0.5);
  });
});
```

### 3. Service Tests
```typescript
// services/__tests__/videoService.test.ts
import { VideoService } from '../videoService';
import { mockFirestore } from '@/test/mocks';

describe('VideoService', () => {
  let videoService: VideoService;
  
  beforeEach(() => {
    videoService = new VideoService(mockFirestore);
  });
  
  it('fetches video by id', async () => {
    const mockVideo = {
      id: '123',
      url: 'https://example.com/video.mp4'
    };
    
    mockFirestore.collection('videos')
      .doc('123')
      .get.mockResolvedValue({
        data: () => mockVideo
      });
    
    const video = await videoService.getVideo('123');
    expect(video).toEqual(mockVideo);
  });
  
  it('uploads video', async () => {
    const mockFile = new File([], 'test.mp4');
    const mockUploadTask = {
      on: jest.fn(),
      snapshot: { ref: { getDownloadURL: () => 'url' } }
    };
    
    mockFirestore.storage()
      .ref()
      .child()
      .put.mockResolvedValue(mockUploadTask);
    
    const result = await videoService.uploadVideo(mockFile);
    expect(result.url).toBe('url');
  });
  
  it('handles upload errors', async () => {
    const mockFile = new File([], 'test.mp4');
    
    mockFirestore.storage()
      .ref()
      .child()
      .put.mockRejectedValue(new Error('Upload failed'));
    
    await expect(videoService.uploadVideo(mockFile))
      .rejects.toThrow('Upload failed');
  });
});
```

## Test Helpers

### 1. Mock Data
```typescript
// test/mocks/data.ts
export const mockVideos = [
  {
    id: '1',
    url: 'https://example.com/video1.mp4',
    thumbnail: 'https://example.com/thumb1.jpg',
    title: 'Test Video 1',
    duration: 120,
    views: 1000
  },
  {
    id: '2',
    url: 'https://example.com/video2.mp4',
    thumbnail: 'https://example.com/thumb2.jpg',
    title: 'Test Video 2',
    duration: 180,
    views: 2000
  }
];

export const mockUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg'
};
```

### 2. Mock Services
```typescript
// test/mocks/services.ts
export const mockVideoService = {
  getVideo: jest.fn(),
  uploadVideo: jest.fn(),
  deleteVideo: jest.fn(),
  listVideos: jest.fn()
};

export const mockAuthService = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
  onAuthStateChanged: jest.fn()
};

export const mockAnalyticsService = {
  trackEvent: jest.fn(),
  setUserProperties: jest.fn(),
  logScreenView: jest.fn()
};
```

### 3. Mock Navigation
```typescript
// test/mocks/navigation.ts
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn()
};

export const mockRoute = {
  params: {},
  key: 'mockRoute',
  name: 'MockScreen'
};
``` 