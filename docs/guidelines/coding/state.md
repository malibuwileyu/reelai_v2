# State Management Guidelines

> Detailed state management patterns for the ReelAI project. See [Coding Guidelines](../coding.md) for overview.

## Local State Management

### 1. useState Hooks
```typescript
// Simple state
const [isPlaying, setIsPlaying] = useState(false);

// Complex state with type
interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

const [state, setState] = useState<VideoState>({
  isPlaying: false,
  currentTime: 0,
  duration: 0
});

// Update complex state
setState(prev => ({
  ...prev,
  currentTime: prev.currentTime + 1
}));
```

### 2. useReducer for Complex State
```typescript
// Action types
type VideoAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK'; time: number };

// Reducer
function videoReducer(state: VideoState, action: VideoAction): VideoState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'SEEK':
      return { ...state, currentTime: action.time };
    default:
      return state;
  }
}

// Usage
const [state, dispatch] = useReducer(videoReducer, initialState);
```

## Custom Hooks

### 1. Feature Hooks
```typescript
function useVideo(videoId: string) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadVideo() {
      try {
        setLoading(true);
        const data = await videoService.getVideo(videoId);
        if (mounted) {
          setVideo(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadVideo();
    return () => { mounted = false; };
  }, [videoId]);

  return { video, loading, error };
}
```

### 2. Shared Hooks
```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

## Firebase Integration

### 1. Real-time Data
```typescript
function useRealtimeVideo(videoId: string) {
  const [video, setVideo] = useState<Video | null>(null);

  useEffect(() => {
    const unsubscribe = db
      .collection('videos')
      .doc(videoId)
      .onSnapshot(
        (doc) => setVideo(doc.data() as Video),
        (error) => console.error(error)
      );

    return () => unsubscribe();
  }, [videoId]);

  return video;
}
```

### 2. Data Updates
```typescript
function useVideoMutations(videoId: string) {
  const updateVideo = useCallback(async (
    data: Partial<Video>
  ) => {
    try {
      await db
        .collection('videos')
        .doc(videoId)
        .update(data);
    } catch (error) {
      throw new DatabaseError('Update failed', error);
    }
  }, [videoId]);

  return { updateVideo };
}
```

## Performance Optimization

### 1. Memoization
```typescript
// Memoize expensive calculations
const videoStats = useMemo(() => {
  return calculateVideoStats(video);
}, [video]);

// Memoize callbacks
const handleVideoUpdate = useCallback((
  data: Partial<Video>
) => {
  updateVideo(data);
}, [updateVideo]);
```

### 2. Context Optimization
```typescript
// Split context by concern
const VideoStateContext = createContext<VideoState | null>(null);
const VideoDispatchContext = createContext<Dispatch | null>(null);

// Provider
export const VideoProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(videoReducer, initialState);
  
  return (
    <VideoStateContext.Provider value={state}>
      <VideoDispatchContext.Provider value={dispatch}>
        {children}
      </VideoDispatchContext.Provider>
    </VideoStateContext.Provider>
  );
};

// Custom hooks for context
export function useVideoState() {
  const context = useContext(VideoStateContext);
  if (!context) {
    throw new Error('useVideoState must be used within VideoProvider');
  }
  return context;
}
```

## Error Handling

### 1. Error Boundaries
```typescript
class VideoErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logError(error);
  }

  render() {
    if (this.state.hasError) {
      return <VideoError onRetry={this.reset} />;
    }
    return this.props.children;
  }
}
```

### 2. Error States
```typescript
function useAsyncOperation<T>(
  operation: () => Promise<T>
): [T | null, boolean, Error | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return [data, loading, error];
}
``` 