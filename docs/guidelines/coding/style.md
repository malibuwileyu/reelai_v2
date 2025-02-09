# Code Style Guidelines

> Detailed code style guidelines for the ReelAI project. See [Coding Guidelines](../coding.md) for overview.

## Naming Conventions

### Files and Directories
```typescript
// Components: PascalCase.tsx
VideoPlayer.tsx
FeedScreen.tsx

// Utilities: camelCase.ts
videoUtils.ts
formatTime.ts

// Types: PascalCase.types.ts
VideoPlayer.types.ts
```

### Variables and Functions
```typescript
// Variables: camelCase, descriptive
const videoPlayer = useRef<Video>(null);
const isPlaying = useState(false);

// Functions: camelCase, verb prefixes
const handlePress = () => { ... }
const loadVideo = async () => { ... }
const updateMetadata = () => { ... }
```

### Types and Interfaces
```typescript
// Types: PascalCase, suffix with type
type VideoStatus = 'playing' | 'paused' | 'loading';
type VideoPlayerProps = {
  videoUrl: string;
  onError?: (error: Error) => void;
};

// Interfaces: PascalCase, no I prefix
interface VideoMetadata {
  title: string;
  duration: number;
  thumbnail?: string;
}
```

## Component Style

### Functional Components
```typescript
// Use named exports
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onError
}) => {
  return (
    <View>
      <Video source={{ uri: videoUrl }} />
    </View>
  );
};
```

### Props Destructuring
```typescript
// DO: Destructure props
const VideoCard = ({ title, thumbnail }: VideoCardProps) => {
  return <View>{title}</View>;
};

// DON'T: Use props object
const VideoCard = (props: VideoCardProps) => {
  return <View>{props.title}</View>;
};
```

### Style Organization
```typescript
// Styles at bottom of file
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

## TypeScript Usage

### Type Assertions
```typescript
// DO: Use type assertions sparingly
const video = data as Video;

// DON'T: Use type assertions to bypass type checking
const video = data as any;
```

### Generic Components
```typescript
// Use generics for reusable components
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export const List = <T extends unknown>({
  items,
  renderItem
}: ListProps<T>) => {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => renderItem(item)}
    />
  );
};
```

### Type Guards
```typescript
// Use type guards for runtime checks
function isVideoError(error: unknown): error is VideoError {
  return error instanceof Error &&
    'videoId' in error;
}

// Usage
if (isVideoError(error)) {
  console.log(error.videoId);
}
```

## Comments and Documentation

### Component Documentation
```typescript
/**
 * VideoPlayer component for handling video playback.
 *
 * @param videoUrl - URL of the video to play
 * @param onError - Optional error handler
 */
export const VideoPlayer = // ...
```

### Function Documentation
```typescript
/**
 * Processes a video file for upload.
 *
 * @param file - The video file to process
 * @param options - Processing options
 * @returns Processed video metadata
 * @throws {VideoProcessingError} If processing fails
 */
async function processVideo(
  file: File,
  options: ProcessingOptions
): Promise<VideoMetadata> {
  // Implementation
}
```

### Code Comments
```typescript
// DO: Explain complex logic
// Calculate video segments based on keyframes
const segments = calculateSegments(keyframes);

// DON'T: State the obvious
// Set the title
setTitle(newTitle);
```

## Import/Export Style

### Import Order
```typescript
// 1. React and React Native
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 2. Third-party libraries
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

// 3. Project imports
import { Button } from '@shared/components';
import { useVideo } from '@features/video';

// 4. Local imports
import { styles } from './styles';
import { VideoPlayerProps } from './types';
```

### Export Style
```typescript
// DO: Named exports for components
export const VideoPlayer = // ...

// DO: Default exports for screens
export default VideoScreen;

// DON'T: Mix default and named exports
export const VideoPlayer = // ...
export default VideoPlayer;
``` 