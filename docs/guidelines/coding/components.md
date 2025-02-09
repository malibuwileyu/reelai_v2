# Component Patterns Guidelines

> Detailed component patterns for the ReelAI project. See [Coding Guidelines](../coding.md) for overview.

## Component Organization

### Basic Structure
```typescript
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';

interface VideoPlayerProps {
  videoUrl: string;
  onError?: (error: Error) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onError
}) => {
  // 1. Hooks
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 2. Callbacks
  const handleError = useCallback((error: Error) => {
    onError?.(error);
  }, [onError]);
  
  // 3. Render
  return (
    <View>
      <Video
        source={{ uri: videoUrl }}
        onError={handleError}
      />
    </View>
  );
};
```

### Component Types

#### 1. Screen Components
```typescript
export const VideoScreen: React.FC = () => {
  // 1. Navigation/Route params
  const { videoId } = useRoute<VideoRouteProps>();
  const navigation = useNavigation();
  
  // 2. State and data
  const { video, loading } = useVideo(videoId);
  
  // 3. Handlers
  const handleBack = () => navigation.goBack();
  
  // 4. Render methods
  const renderHeader = () => (
    <Header title={video?.title} onBack={handleBack} />
  );
  
  // 5. Main render
  return (
    <SafeAreaView>
      {renderHeader()}
      {loading ? <Loading /> : <VideoPlayer {...video} />}
    </SafeAreaView>
  );
};
```

#### 2. Feature Components
```typescript
export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete
}) => {
  // 1. State
  const [progress, setProgress] = useState(0);
  
  // 2. Upload logic
  const handleUpload = async (file: File) => {
    try {
      await uploadVideo(file, setProgress);
      onUploadComplete?.();
    } catch (error) {
      handleError(error);
    }
  };
  
  // 3. Render
  return (
    <View>
      <UploadButton onSelect={handleUpload} />
      <ProgressBar value={progress} />
    </View>
  );
};
```

#### 3. Shared Components
```typescript
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary'
}) => {
  const buttonStyle = styles[variant];
  
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```

## Component Patterns

### 1. Container/Presenter Pattern
```typescript
// Container
const VideoPlayerContainer: React.FC<VideoPlayerProps> = ({
  videoId
}) => {
  const { video, loading, error } = useVideo(videoId);
  
  if (loading) return <Loading />;
  if (error) return <Error error={error} />;
  if (!video) return null;
  
  return <VideoPlayerPresenter video={video} />;
};

// Presenter
const VideoPlayerPresenter: React.FC<VideoPresenterProps> = ({
  video
}) => (
  <View>
    <Video source={{ uri: video.url }} />
    <VideoControls duration={video.duration} />
  </View>
);
```

### 2. Compound Components
```typescript
const Video = {
  Root: VideoRoot,
  Controls: VideoControls,
  Timeline: VideoTimeline,
  Title: VideoTitle
};

// Usage
<Video.Root>
  <Video.Title />
  <Video.Controls />
  <Video.Timeline />
</Video.Root>
```

### 3. Render Props
```typescript
interface VideoProviderProps {
  children: (state: VideoState) => React.ReactNode;
}

const VideoProvider: React.FC<VideoProviderProps> = ({
  children
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  return children({
    isPlaying,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false)
  });
};

// Usage
<VideoProvider>
  {({ isPlaying, play, pause }) => (
    <VideoControls
      isPlaying={isPlaying}
      onPlay={play}
      onPause={pause}
    />
  )}
</VideoProvider>
```

## Performance Patterns

### 1. Memoization
```typescript
// Memoize expensive components
export const VideoCard = memo(
  ({ video }: VideoCardProps) => (
    <View>
      <Thumbnail url={video.thumbnail} />
      <Title>{video.title}</Title>
    </View>
  ),
  (prev, next) => prev.video.id === next.video.id
);

// Memoize callbacks
const handlePress = useCallback(() => {
  onPress(video.id);
}, [video.id, onPress]);
```

### 2. List Optimization
```typescript
// Optimize FlatList rendering
<FlatList
  data={videos}
  renderItem={renderVideo}
  getItemLayout={getItemLayout}
  keyExtractor={keyExtractor}
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}
  windowSize={5}
  initialNumToRender={10}
/>
```

### 3. Lazy Loading
```typescript
// Lazy load components
const VideoEditor = lazy(() => import('./VideoEditor'));

// Usage
<Suspense fallback={<Loading />}>
 