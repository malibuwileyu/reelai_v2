# Performance Guidelines

> Detailed performance optimization patterns for the ReelAI project. See [Coding Guidelines](../coding.md) for overview.

## Component Optimization

### 1. Memoization
```typescript
// Memoize expensive components
export const VideoCard = memo(
  ({ video, onPress }: VideoCardProps) => (
    <TouchableOpacity onPress={onPress}>
      <Thumbnail source={{ uri: video.thumbnailUrl }} />
      <Text>{video.title}</Text>
    </TouchableOpacity>
  ),
  (prev, next) => (
    prev.video.id === next.video.id &&
    prev.onPress === next.onPress
  )
);

// Memoize expensive calculations
const videoStats = useMemo(() => {
  return calculateVideoStats(video);
}, [video]);

// Memoize callbacks
const handlePress = useCallback(() => {
  onPress(video.id);
}, [video.id, onPress]);
```

### 2. Lazy Loading
```typescript
// Lazy load components
const VideoEditor = lazy(() => import('./VideoEditor'));

// Use Suspense boundary
function VideoScreen() {
  return (
    <Suspense fallback={<Loading />}>
      <VideoEditor />
    </Suspense>
  );
}

// Prefetch on hover/focus
function VideoList() {
  const prefetchEditor = () => {
    const modulePromise = import('./VideoEditor');
  };
  
  return (
    <Button
      onHover={prefetchEditor}
      onFocus={prefetchEditor}
    />
  );
}
```

## List Performance

### 1. FlatList Optimization
```typescript
// Optimize FlatList configuration
<FlatList
  data={videos}
  renderItem={renderVideo}
  getItemLayout={getItemLayout}
  keyExtractor={keyExtractor}
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}
  windowSize={5}
  initialNumToRender={10}
  onEndReachedThreshold={0.5}
  updateCellsBatchingPeriod={50}
/>

// Implement getItemLayout
const getItemLayout = (
  _: any,
  index: number
) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

// Stable key extractor
const keyExtractor = (item: Video) => item.id;
```

### 2. Item Optimization
```typescript
// Optimize list items
const VideoItem = memo(({ video }: VideoItemProps) => {
  // Avoid inline styles
  const styles = useStyles();
  
  // Avoid inline functions
  const handlePress = useCallback(() => {
    onVideoPress(video.id);
  }, [video.id]);
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
    >
      <FastImage
        style={styles.thumbnail}
        source={{ uri: video.thumbnailUrl }}
      />
    </TouchableOpacity>
  );
});
```

## Image Optimization

### 1. FastImage Usage
```typescript
// Use FastImage for better performance
import FastImage from 'react-native-fast-image';

const Thumbnail = ({ uri }: { uri: string }) => (
  <FastImage
    style={styles.image}
    source={{
      uri,
      priority: FastImage.priority.normal,
    }}
    resizeMode={FastImage.resizeMode.cover}
  />
);
```

### 2. Image Preloading
```typescript
// Preload images
FastImage.preload([
  {
    uri: video.thumbnailUrl,
    priority: FastImage.priority.high,
  },
  {
    uri: video.posterUrl,
    priority: FastImage.priority.normal,
  },
]);
```

## State Management

### 1. Context Optimization
```typescript
// Split context by concern
const VideoStateContext = createContext<VideoState | null>(null);
const VideoDispatchContext = createContext<Dispatch | null>(null);

// Optimize provider
const VideoProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(videoReducer, initialState);
  
  const memoizedState = useMemo(() => state, [state]);
  const memoizedDispatch = useCallback(dispatch, []);
  
  return (
    <VideoStateContext.Provider value={memoizedState}>
      <VideoDispatchContext.Provider value={memoizedDispatch}>
        {children}
      </VideoDispatchContext.Provider>
    </VideoStateContext.Provider>
  );
};
```

### 2. State Updates
```typescript
// Batch state updates
function VideoControls() {
  const updateVideoState = () => {
    ReactNative.unstable_batchedUpdates(() => {
      setPlaying(true);
      setProgress(0);
      setBuffering(false);
    });
  };
}
```

## Network Optimization

### 1. Request Management
```typescript
// Cancel stale requests
function useVideo(videoId: string) {
  useEffect(() => {
    const abortController = new AbortController();
    
    fetchVideo(videoId, abortController.signal)
      .then(setVideo)
      .catch(handleError);
    
    return () => abortController.abort();
  }, [videoId]);
}
```

### 2. Data Caching
```typescript
// Cache responses
const videoCache = new Map<string, Video>();

async function fetchVideo(id: string): Promise<Video> {
  if (videoCache.has(id)) {
    return videoCache.get(id)!;
  }
  
  const video = await api.getVideo(id);
  videoCache.set(id, video);
  return video;
}
```

## Memory Management

### 1. Resource Cleanup
```typescript
// Clean up resources
function VideoPlayer() {
  useEffect(() => {
    const player = new VideoPlayerController();
    
    return () => {
      player.release();
      player.cleanup();
    };
  }, []);
}
```

### 2. Large List Memory
```typescript
// Handle large lists
function VideoList() {
  // Remove items when scrolled far away
  const onScroll = useCallback((event: ScrollEvent) => {
    const offset = event.nativeEvent.contentOffset.y;
    if (offset > THRESHOLD) {
      removeOffscreenItems();
    }
  }, []);
  
  return (
    <FlatList
      onScroll={onScroll}
      removeClippedSubviews={true}
    />
  );
}
``` 