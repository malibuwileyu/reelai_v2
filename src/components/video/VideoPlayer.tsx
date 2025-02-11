import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useProgress } from '../../hooks/useProgress';
import { useAuthContext } from '../../providers/AuthProvider';
import { StreakService } from '../../services/streakService';
import { formatDuration } from '../../utils/formatDuration';

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  duration?: number;
  style?: any;
  shouldPlay?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  duration,
  style,
  shouldPlay = false,
  onPlaybackStatusUpdate,
}) => {
  const videoRef = useRef<ExpoVideo>(null);
  const { progress, updateProgress, markAsCompleted } = useProgress(videoId);
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSetInitialPosition, setHasSetInitialPosition] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(duration);
  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateTimeRef = useRef<number>(0);

  // Set initial position once when video is loaded
  useEffect(() => {
    let mounted = true;
    
    const setInitialPosition = async () => {
      try {
        if (!videoRef.current || !progress?.lastPosition || hasSetInitialPosition) return;
        
        await videoRef.current.setPositionAsync(progress.lastPosition);
        if (mounted) setHasSetInitialPosition(true);
      } catch (error) {
        console.error('Error setting initial position:', error);
      }
    };

    setInitialPosition();
    return () => {
      mounted = false;
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, [progress?.lastPosition, hasSetInitialPosition]);

  // Handle playback status updates
  const handlePlaybackStatusUpdate = useCallback(async (status: AVPlaybackStatus) => {
    if (!status.isLoaded || !user) return;

    try {
      setIsLoading(false);

      // Update duration if not set
      if (!videoDuration && status.durationMillis) {
        setVideoDuration(status.durationMillis / 1000);
      }

      const currentPosition = status.positionMillis;
      const currentTime = Date.now();

      // Only update progress every 5 seconds to avoid too many writes
      // and ensure we're not updating too frequently
      if (currentPosition % 5000 < 1000 && 
          currentTime - lastUpdateTimeRef.current >= 5000) {
        
        lastUpdateTimeRef.current = currentTime;
        const watchedSeconds = Math.floor(currentPosition / 1000);
        
        // Debounce progress updates
        if (progressUpdateTimeoutRef.current) {
          clearTimeout(progressUpdateTimeoutRef.current);
        }
        
        progressUpdateTimeoutRef.current = setTimeout(async () => {
          try {
            await updateProgress(watchedSeconds, currentPosition);
            
            // Update streak when user watches video
            await StreakService.updateStreak(user.uid);
          } catch (error) {
            console.error('Error updating progress:', error);
          }
        }, 1000);
      }

      // Mark as completed if we're at the end
      if (status.didJustFinish) {
        await markAsCompleted();
      }

      // Call parent's onPlaybackStatusUpdate if provided
      onPlaybackStatusUpdate?.(status);
    } catch (error) {
      console.error('Error handling playback status:', error);
    }
  }, [videoId, updateProgress, markAsCompleted, onPlaybackStatusUpdate, user, videoDuration]);

  return (
    <View style={[styles.container, style]}>
      <ExpoVideo
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={shouldPlay && !isLoading}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        progressUpdateIntervalMillis={1000}
      />
      {videoDuration && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            {formatDuration(videoDuration)}
          </Text>
        </View>
      )}
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
  durationContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
}); 