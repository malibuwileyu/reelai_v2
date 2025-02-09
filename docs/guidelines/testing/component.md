# Component Testing Guidelines

> Detailed component testing standards for the ReelAI project. See [Testing Guidelines](../testing.md) for overview.

## Test Setup

### 1. Basic Component Test
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  const defaultProps = {
    videoUrl: 'https://example.com/video.mp4',
    onError: jest.fn()
  };

  it('renders correctly', () => {
    const { getByTestId } = render(
      <VideoPlayer {...defaultProps} />
    );
    
    expect(getByTestId('video-player')).toBeTruthy();
  });
  
  it('handles play/pause', () => {
    const { getByTestId } = render(
      <VideoPlayer {...defaultProps} />
    );
    
    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);
    
    expect(getByTestId('video-status')).toHaveTextContent('playing');
  });
});
```

### 2. Snapshot Testing
```typescript
import renderer from 'react-test-renderer';

describe('VideoPlayer Snapshots', () => {
  it('matches default snapshot', () => {
    const tree = renderer
      .create(<VideoPlayer {...defaultProps} />)
      .toJSON();
    
    expect(tree).toMatchSnapshot();
  });
  
  it('matches error state snapshot', () => {
    const tree = renderer
      .create(
        <VideoPlayer 
          {...defaultProps}
          error="Failed to load video"
        />
      )
      .toJSON();
    
    expect(tree).toMatchSnapshot();
  });
});
```

## Testing Patterns

### 1. User Interactions
```typescript
describe('VideoPlayer Interactions', () => {
  it('handles seek interaction', async () => {
    const { getByTestId } = render(
      <VideoPlayer {...defaultProps} />
    );
    
    const seekBar = getByTestId('seek-bar');
    await fireEvent(seekBar, 'valueChange', 50);
    
    expect(getByTestId('time-display'))
      .toHaveTextContent('00:50');
  });
  
  it('handles volume control', async () => {
    const { getByTestId } = render(
      <VideoPlayer {...defaultProps} />
    );
    
    const volumeSlider = getByTestId('volume-slider');
    await fireEvent(volumeSlider, 'valueChange', 0.5);
    
    expect(getByTestId('volume-value'))
      .toHaveTextContent('50%');
  });
});
```

### 2. Async Operations
```typescript
describe('VideoPlayer Loading', () => {
  it('shows loading state', async () => {
    const { getByTestId, findByTestId } = render(
      <VideoPlayer {...defaultProps} />
    );
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
    
    const videoElement = await findByTestId('video-element');
    expect(videoElement).toBeTruthy();
    expect(queryByTestId('loading-spinner')).toBeNull();
  });
  
  it('handles load error', async () => {
    const onError = jest.fn();
    const { findByTestId } = render(
      <VideoPlayer
        videoUrl="invalid-url"
        onError={onError}
      />
    );
    
    const errorMessage = await findByTestId('error-message');
    expect(errorMessage).toBeTruthy();
    expect(onError).toHaveBeenCalled();
  });
});
```

## Component Mocking

### 1. Mock Components
```typescript
// Mock video component
jest.mock('@expo/av', () => ({
  Video: ({ onLoad, onError, ...props }) => (
    <View 
      testID="mock-video"
      {...props}
      onLoad={() => onLoad({ duration: 100 })}
    />
  )
}));

describe('VideoPlayer with Mocks', () => {
  it('handles video load', () => {
    const { getByTestId } = render(
      <VideoPlayer {...defaultProps} />
    );
    
    expect(getByTestId('duration'))
      .toHaveTextContent('01:40');
  });
});
```

### 2. Mock Context
```typescript
const mockVideoContext = {
  isPlaying: false,
  currentTime: 0,
  duration: 100,
  play: jest.fn(),
  pause: jest.fn()
};

const wrapper = ({ children }) => (
  <VideoContext.Provider value={mockVideoContext}>
    {children}
  </VideoContext.Provider>
);

describe('VideoControls with Context', () => {
  it('uses context values', () => {
    const { getByTestId } = render(
      <VideoControls />,
      { wrapper }
    );
    
    const playButton = getByTestId('play-button');
    fireEvent.press(playButton);
    
    expect(mockVideoContext.play).toHaveBeenCalled();
  });
});
```

## Test Utilities

### 1. Custom Renders
```typescript
// test-utils.tsx
import { RenderOptions } from '@testing-library/react-native';

const AllTheProviders = ({ children }) => (
  <SafeAreaProvider>
    <ThemeProvider theme={defaultTheme}>
      <VideoProvider>
        {children}
      </VideoProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
```

### 2. Common Assertions
```typescript
// test-matchers.ts
expect.extend({
  toBeValidVideo(received) {
    const isValid = received &&
      received.duration > 0 &&
      received.url.startsWith('https://');
    
    return {
      message: () => `expected ${received} to be valid video`,
      pass: isValid
    };
  },
  
  toHaveVideoState(received, state) {
    const hasState = received.props['data-state'] === state;
    
    return {
      message: () => 
        `expected ${received} to have video state ${state}`,
      pass: hasState
    };
  }
});

// Usage
it('validates video object', () => {
  const video = getVideoObject();
  expect(video).toBeValidVideo();
  expect(getByTestId('player')).toHaveVideoState('playing');
});
``` 