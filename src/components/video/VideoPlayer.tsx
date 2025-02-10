import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useProgress } from '../../hooks/useProgress';
import { useAuthContext } from '../../providers/AuthProvider';
import { StreakService } from '../../services/streakService';

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  style?: any;
  shouldPlay?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  style,
  shouldPlay = false,
  onPlaybackStatusUpdate,
}) => {
  const videoRef = useRef<ExpoVideo>(null);
  const { progress, updateProgress, markAsCompleted } = useProgress(videoId);
  const { user } = useAuthContext();

  // Handle playback status updates
  const handlePlaybackStatusUpdate = useCallback(async (status: AVPlaybackStatus) => {
    if (!status.isLoaded || !user) return;

    // Update progress
    const watchedSeconds = status.positionMillis / 1000;
    const lastPosition = status.positionMillis;
    
    // Only update progress every 5 seconds to avoid too many writes
    if (watchedSeconds % 5 < 1) {
      await updateProgress(watchedSeconds, lastPosition);
      
      // Update streak when user watches video
      try {
        await StreakService.updateStreak(user.uid);
      } catch (error) {
        console.error('Error updating streak:', error);
      }
    }

    // Mark as completed if we're at the end
    if (status.didJustFinish) {
      await markAsCompleted();
    }

    // Call parent's onPlaybackStatusUpdate if provided
    onPlaybackStatusUpdate?.(status);
  }, [videoId, updateProgress, markAsCompleted, onPlaybackStatusUpdate, user]);

  // Load last position on mount
  useEffect(() => {
    const loadLastPosition = async () => {
      if (!videoRef.current || !progress?.lastPosition) return;
      
      await videoRef.current.setPositionAsync(progress.lastPosition);
    };

    loadLastPosition();
  }, [progress?.lastPosition]);

  return (
    <View style={[styles.container, style]}>
      <ExpoVideo
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={shouldPlay}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        progressUpdateIntervalMillis={1000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
}); 