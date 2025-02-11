import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Modal, ActivityIndicator, Image, StatusBar, SafeAreaView } from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../../../hooks/useProgress';
import { useAuthContext } from '../../../providers/AuthProvider';
import { formatDuration } from '../../../utils/formatDuration';
import { VideoBookmark, VideoTranscript, VideoChapter } from '../types';
import { getDocs, query, where, collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Timestamp } from 'firebase/firestore';
import { ScrollView } from 'react-native';

interface EnhancedVideoPlayerProps {
  videoId: string;
  videoUrl: string;
  duration?: number;
  style?: any;
  shouldPlay?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onError?: (error: Error) => void;
  transcript?: VideoTranscript;
  chapters?: VideoChapter[];
}

interface ControlsState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  playbackSpeed: number;
  volume: number;
  isControlsVisible: boolean;
  isTranscriptVisible: boolean;
  isChaptersVisible: boolean;
  isFullscreen: boolean;
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  videoId,
  videoUrl,
  duration,
  style,
  shouldPlay = false,
  onPlaybackStatusUpdate,
  onError,
  transcript,
  chapters,
}) => {
  // Refs
  const videoRef = useRef<ExpoVideo>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateTimeRef = useRef<number>(0);

  // State
  const [controls, setControls] = useState<ControlsState>({
    isPlaying: false,
    currentTime: 0,
    duration: duration || 0,
    isBuffering: true,
    playbackSpeed: 1.0,
    volume: 1.0,
    isControlsVisible: true,
    isTranscriptVisible: false,
    isChaptersVisible: false,
    isFullscreen: false,
  });

  // Hooks
  const { progress, updateProgress, markAsCompleted } = useProgress(videoId);
  const { user } = useAuthContext();
  const [isPipActive, setIsPipActive] = useState(false);
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [activeChapter, setActiveChapter] = useState<VideoChapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Pan handler for seeking
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const seekTime = Math.max(0, Math.min(controls.duration, controls.currentTime + gestureState.dx / 2));
      handleSeek(seekTime);
    },
  });

  // Effects
  useEffect(() => {
    if (shouldPlay && !controls.isPlaying) {
      handlePlay();
    }
  }, [shouldPlay]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Load bookmarks
  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for bookmarks
    const bookmarksQuery = query(
      collection(db, 'videoBookmarks'),
      where('userId', '==', user.uid),
      where('videoId', '==', videoId)
    );

    const unsubscribeBookmarks = onSnapshot(bookmarksQuery, 
      (snapshot) => {
        const bookmarkData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }) as VideoBookmark);
        console.log('Bookmarks updated:', bookmarkData.length, 'bookmarks');
        setBookmarks(bookmarkData);
      },
      (error) => {
        console.error('Error in bookmark listener:', error);
      }
    );

    return () => {
      console.log('Cleaning up bookmark listener');
      unsubscribeBookmarks();
    };
  }, [user, videoId]);

  // Update active chapter based on current time
  useEffect(() => {
    if (!chapters?.length) return;
    
    const currentChapter = chapters.find((chapter, index) => {
      const nextChapter = chapters[index + 1];
      const time = controls.currentTime * 1000;
      return time >= chapter.timestamp && 
        (!nextChapter || time < nextChapter.timestamp);
    });
    
    setActiveChapter(currentChapter || null);
  }, [controls.currentTime, chapters]);

  // Load thumbnail
  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        // Extract video ID from URL
        const urlParts = videoUrl.split('/');
        const videoIdIndex = urlParts.findIndex(part => part === 'videos') + 2;
        if (videoIdIndex < 2) return;
        
        const videoPath = urlParts[videoIdIndex];
        const thumbnailPath = `thumbnails/${videoPath}/thumbnail.jpg`;
        const thumbnailUrl = videoUrl.replace('videos', 'thumbnails')
          .replace('video.mp4', 'thumbnail.jpg');
        setThumbnailUrl(thumbnailUrl);
      } catch (error) {
        console.error('Error loading thumbnail:', error);
      }
    };
    loadThumbnail();
  }, [videoUrl]);

  // Handlers
  const handlePlay = async () => {
    try {
      setShowThumbnail(false);
      await videoRef.current?.playAsync();
      setControls(prev => ({ ...prev, isPlaying: true }));
      hideControlsWithDelay();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handlePause = async () => {
    try {
      await videoRef.current?.pauseAsync();
      setControls(prev => ({ ...prev, isPlaying: false }));
      showControls();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handleSeek = async (time: number) => {
    try {
      await videoRef.current?.setPositionAsync(time * 1000);
      setControls(prev => ({ ...prev, currentTime: time }));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    try {
      await videoRef.current?.setRateAsync(speed, true);
      setControls(prev => ({ ...prev, playbackSpeed: speed }));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      await videoRef.current?.setVolumeAsync(volume);
      setControls(prev => ({ ...prev, volume }));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const togglePictureInPicture = () => {
    try {
      // For now, we'll just toggle a fullscreen-like state
      // TODO: Implement actual PiP when expo-av supports it
      setIsPipActive(!isPipActive);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const showControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setControls(prev => ({ ...prev, isControlsVisible: true }));
  };

  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setControls(prev => ({ ...prev, isControlsVisible: false }));
  };

  const hideControlsWithDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(hideControls, 3000);
  };

  const handlePlaybackStatusUpdate = useCallback(
    async (status: AVPlaybackStatus) => {
      if (!status.isLoaded || !user) return;

      try {
        setControls(prev => ({
          ...prev,
          isBuffering: status.isBuffering,
          currentTime: status.positionMillis / 1000,
          duration: status.durationMillis ? status.durationMillis / 1000 : prev.duration,
        }));

        const currentPosition = status.positionMillis;
        const currentTime = Date.now();

        // Update progress every 5 seconds
        if (currentPosition % 5000 < 1000 && currentTime - lastUpdateTimeRef.current >= 5000) {
          lastUpdateTimeRef.current = currentTime;
          const watchedSeconds = Math.floor(currentPosition / 1000);

          if (currentPosition % 5000 < 1000 && currentTime - lastUpdateTimeRef.current >= 5000) {
            lastUpdateTimeRef.current = currentTime;
            const watchedSeconds = Math.floor(currentPosition / 1000);

            if (progressUpdateTimeoutRef.current) {
              clearTimeout(progressUpdateTimeoutRef.current);
            }

            progressUpdateTimeoutRef.current = setTimeout(async () => {
              try {
                await updateProgress(watchedSeconds, currentPosition);
              } catch (error) {
                console.error('Error updating progress:', error);
              }
            }, 1000);
          }
        }

        // Mark as completed if finished
        if (status.didJustFinish) {
          await markAsCompleted();
        }

        onPlaybackStatusUpdate?.(status);
      } catch (error) {
        console.error('Error handling playback status:', error);
      }
    },
    [user, updateProgress, markAsCompleted, onPlaybackStatusUpdate]
  );

  // Enhancement handlers
  const toggleBookmark = async () => {
    if (!user) return;
    try {
      // Check if there's already a bookmark at current time
      const existingBookmark = bookmarks.find(bookmark => {
        const bookmarkTime = bookmark.timestamp / 1000;
        return Math.abs(bookmarkTime - controls.currentTime) < 1;
      });

      if (existingBookmark) {
        // Remove existing bookmark
        const bookmarkRef = doc(db, 'videoBookmarks', existingBookmark.id);
        await deleteDoc(bookmarkRef);
        console.log('Bookmark removed:', existingBookmark.id);
      } else {
        // Add new bookmark
        const bookmark: Omit<VideoBookmark, 'id'> = {
          userId: user.uid,
          videoId,
          timestamp: controls.currentTime * 1000,
          label: `Bookmark at ${formatDuration(controls.currentTime)}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, 'videoBookmarks'), bookmark);
        console.log('Bookmark added:', docRef.id);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleJumpToTimestamp = async (timestamp: number) => {
    try {
      await videoRef.current?.setPositionAsync(timestamp);
      setControls(prev => ({ ...prev, currentTime: timestamp / 1000 }));
    } catch (error) {
      console.error('Error jumping to timestamp:', error);
    }
  };

  const handleVideoLoad = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setLoadError(new Error('Failed to load video'));
      setIsLoading(true);  // Keep loading state true if load failed
      return;
    }
    
    // Only set loading to false if video is successfully loaded
    if (status.isLoaded) {
      setIsLoading(false);
      setLoadError(null);
      setShowThumbnail(false);  // Hide thumbnail once video is loaded
    }
  };

  const toggleFullscreen = async () => {
    try {
      // Store current playback state
      const wasPlaying = controls.isPlaying;
      const status = await videoRef.current?.getStatusAsync();
      const currentPosition = status?.isLoaded ? status.positionMillis : 0;

      // Always pause before transitioning
      await videoRef.current?.pauseAsync();
      setControls(prev => ({ ...prev, isPlaying: false }));

      // Toggle fullscreen state
      setControls(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));

      // Small delay to ensure the new container is ready
      setTimeout(async () => {
        // Seek to the correct position in the new player
        if (currentPosition > 0) {
          await videoRef.current?.setPositionAsync(currentPosition);
        }

        // Only resume playing if we're exiting fullscreen and video was playing
        if (!controls.isFullscreen && wasPlaying) {
          await videoRef.current?.playAsync();
          setControls(prev => ({ ...prev, isPlaying: true }));
        }
      }, 100);
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      onError?.(error as Error);
    }
  };

  const isCurrentTimeBookmarked = () => {
    return bookmarks.some(bookmark => {
      // Check if any bookmark is within 1 second of current time
      const bookmarkTime = bookmark.timestamp / 1000;
      return Math.abs(bookmarkTime - controls.currentTime) < 1;
    });
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={showControls}
          {...panResponder.panHandlers}
          style={[
            styles.videoWrapper,
            controls.isFullscreen && styles.videoWrapperFullscreen
          ]}
        >
          {showThumbnail && thumbnailUrl ? (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={handlePlay}
                style={styles.playButtonOverlay}
              >
                <View style={styles.playButton}>
                  <Ionicons name="play" size={40} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          ) : !controls.isFullscreen && (
            <ExpoVideo
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={shouldPlay}
              onPlaybackStatusUpdate={(status) => {
                handleVideoLoad(status);
                handlePlaybackStatusUpdate(status);
              }}
              progressUpdateIntervalMillis={1000}
              useNativeControls={false}
            />
          )}

          {/* Controls overlay */}
          {!showThumbnail && !controls.isFullscreen && (
            <Animated.View style={[styles.controlsOverlay, { opacity: fadeAnim }]}>
              {/* Center controls */}
              <View style={styles.miniplayerCenterControls}>
                <TouchableOpacity
                  onPress={controls.isPlaying ? handlePause : handlePlay}
                  style={styles.playButton}
                >
                  <Ionicons
                    name={controls.isPlaying ? 'pause' : 'play'}
                    size={40}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                {/* Progress bar */}
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(controls.currentTime / controls.duration) * 100}%`,
                      },
                    ]}
                  />
                </View>

                {/* Time display and controls */}
                <View style={styles.controlsRow}>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeText}>
                      {formatDuration(controls.currentTime)}
                    </Text>
                    <Text style={styles.timeText}> / </Text>
                    <Text style={styles.timeText}>
                      {formatDuration(controls.duration)}
                    </Text>
                  </View>

                  <View style={styles.rightControls}>
                    {/* Playback speed */}
                    <TouchableOpacity
                      onPress={() => {
                        const speeds = [0.5, 1.0, 1.5, 2.0];
                        const currentIndex = speeds.indexOf(controls.playbackSpeed);
                        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
                        handleSpeedChange(nextSpeed);
                      }}
                      style={styles.speedButton}
                    >
                      <Text style={styles.speedText}>{controls.playbackSpeed}x</Text>
                    </TouchableOpacity>

                    {/* Enhancement controls */}
                    <TouchableOpacity 
                      onPress={toggleBookmark} 
                      style={[
                        styles.controlButton,
                        isCurrentTimeBookmarked() && styles.activeControlButton
                      ]}
                    >
                      <Ionicons 
                        name="bookmark" 
                        size={24} 
                        color={isCurrentTimeBookmarked() ? "#007AFF" : "#fff"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setControls(prev => ({ ...prev, isTranscriptVisible: !prev.isTranscriptVisible }))}
                      style={styles.controlButton}
                    >
                      <Ionicons name="document-text" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setControls(prev => ({ ...prev, isChaptersVisible: !prev.isChaptersVisible }))}
                      style={styles.controlButton}
                    >
                      <Ionicons name="list" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Fullscreen button */}
                    <TouchableOpacity 
                      onPress={toggleFullscreen}
                      style={styles.controlButton}
                    >
                      <Ionicons
                        name={controls.isFullscreen ? 'contract' : 'expand'}
                        size={24}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          
          {loadError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load video</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Advanced enhancement controls - only shown in fullscreen mode */}
        {controls.isFullscreen && (
          <View style={styles.fullscreenEnhancementControls}>
            <TouchableOpacity 
              style={[
                styles.enhancementButton,
                isCurrentTimeBookmarked() && styles.enhancementButtonActive
              ]}
              onPress={toggleBookmark}
            >
              <Ionicons 
                name="bookmark" 
                size={24} 
                color={isCurrentTimeBookmarked() ? "#007AFF" : "#fff"} 
              />
              <Text style={[
                styles.enhancementButtonText,
                isCurrentTimeBookmarked() && styles.enhancementButtonTextActive
              ]}>Bookmark</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transcript panel */}
        {controls.isTranscriptVisible && transcript && (
          <Animated.View style={styles.transcriptPanel}>
            <ScrollView>
              {transcript.segments.map((segment: { startTime: number; endTime: number; text: string; speakerId?: string }, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.transcriptSegment}
                  onPress={() => handleJumpToTimestamp(segment.startTime)}
                >
                  <Text style={styles.transcriptTime}>
                    {formatDuration(segment.startTime / 1000)}
                  </Text>
                  <Text style={styles.transcriptText}>{segment.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Chapters panel */}
        {controls.isChaptersVisible && chapters && (
          <Animated.View style={styles.chaptersPanel}>
            <ScrollView>
              {chapters.map((chapter, index) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={[
                    styles.chapterItem,
                    activeChapter?.id === chapter.id && styles.activeChapter
                  ]}
                  onPress={() => handleJumpToTimestamp(chapter.timestamp)}
                >
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterDuration}>
                    {formatDuration(chapter.duration / 1000)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Fullscreen Modal */}
      {controls.isFullscreen && (
        <Modal
          visible={controls.isFullscreen}
          animationType="fade"
          onRequestClose={toggleFullscreen}
          supportedOrientations={['landscape', 'portrait']}
          presentationStyle="overFullScreen"
          transparent={true}
        >
          <View style={styles.fullscreenContainer}>
            <SafeAreaView style={styles.fullscreenSafeArea}>
              {/* Add TouchableOpacity wrapper for the entire fullscreen content */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (controls.isControlsVisible) {
                    hideControls();
                  } else {
                    showControls();
                    hideControlsWithDelay();
                  }
                }}
                style={styles.fullscreenTouchable}
              >
                {/* Top Enhancement Controls */}
                {controls.isControlsVisible && (
                  <View style={styles.fullscreenTopBar}>
                    <TouchableOpacity 
                      onPress={toggleFullscreen}
                      style={styles.fullscreenBackButton}
                    >
                      <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.topEnhancementControls}>
                      <TouchableOpacity 
                        onPress={toggleBookmark} 
                        style={[
                          styles.controlButton,
                          isCurrentTimeBookmarked() && styles.activeControlButton
                        ]}
                      >
                        <Ionicons 
                          name="bookmark" 
                          size={24} 
                          color={isCurrentTimeBookmarked() ? "#007AFF" : "#FFFFFF"} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setControls(prev => ({ ...prev, isTranscriptVisible: !prev.isTranscriptVisible }))}
                        style={styles.controlButton}
                      >
                        <Ionicons name="document-text" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setControls(prev => ({ ...prev, isChaptersVisible: !prev.isChaptersVisible }))}
                        style={styles.controlButton}
                      >
                        <Ionicons name="list" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Video container */}
                <View style={styles.fullscreenVideoContainer}>
                  <ExpoVideo
                    ref={videoRef}
                    source={{ uri: videoUrl }}
                    style={styles.fullscreenVideo}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={shouldPlay}
                    onPlaybackStatusUpdate={(status) => {
                      handleVideoLoad(status);
                      handlePlaybackStatusUpdate(status);
                    }}
                    progressUpdateIntervalMillis={1000}
                    useNativeControls={false}
                  />
                </View>

                {/* Bottom Controls */}
                {controls.isControlsVisible && (
                  <View style={styles.fullscreenBottomControls}>
                    {/* Center play/pause button */}
                    <View style={styles.fullscreenCenterControls}>
                      <TouchableOpacity
                        onPress={controls.isPlaying ? handlePause : handlePlay}
                        style={styles.playButton}
                      >
                        <Ionicons
                          name={controls.isPlaying ? 'pause' : 'play'}
                          size={40}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(controls.currentTime / controls.duration) * 100}%`,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.controlsRow}>
                      <View style={styles.timeDisplay}>
                        <Text style={styles.timeText}>
                          {formatDuration(controls.currentTime)}
                        </Text>
                        <Text style={styles.timeText}> / </Text>
                        <Text style={styles.timeText}>
                          {formatDuration(controls.duration)}
                        </Text>
                      </View>

                      <View style={styles.rightControls}>
                        {/* Playback speed */}
                        <TouchableOpacity
                          onPress={() => {
                            const speeds = [0.5, 1.0, 1.5, 2.0];
                            const currentIndex = speeds.indexOf(controls.playbackSpeed);
                            const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
                            handleSpeedChange(nextSpeed);
                          }}
                          style={styles.speedButton}
                        >
                          <Text style={styles.speedText}>{controls.playbackSpeed}x</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
  },
  miniplayerCenterControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 1002,
  },
  fullscreenCenterControls: {
    position: 'absolute',
    bottom: 350,
    left: '53%',
    transform: [{ translateX: -30 }],
    zIndex: 1002,
  },
  bottomControls: {
    width: '100%',
    padding: 16,
    paddingBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  speedText: {
    color: '#fff',
    fontSize: 14,
  },
  controlButton: {
    padding: 8,
    opacity: 0.8,
  },
  transcriptPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
  },
  transcriptSegment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
  },
  transcriptTime: {
    color: '#fff',
    marginRight: 8,
    opacity: 0.7,
  },
  transcriptText: {
    color: '#fff',
    flex: 1,
  },
  chaptersPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
  },
  chapterItem: {
    padding: 8,
    borderRadius: 4,
  },
  activeChapter: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chapterTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chapterDuration: {
    color: '#fff',
    opacity: 0.7,
    fontSize: 12,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  thumbnailContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenSafeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fullscreenTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
    zIndex: 1001,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  topEnhancementControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 8,
  },
  fullscreenBackButton: {
    padding: 8,
    marginLeft: 8,
  },
  fullscreenVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenBottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    zIndex: 1001,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  activeControlButton: {
    opacity: 1,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  enhancementButton: {
    alignItems: 'center',
    opacity: 0.8,
    paddingHorizontal: 4,
  },
  enhancementButtonActive: {
    opacity: 1,
  },
  enhancementButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  enhancementButtonTextActive: {
    color: '#007AFF',
  },
  videoWrapperFullscreen: {
    opacity: 0,
  },
  fullscreenTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullscreenEnhancementControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -80 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 8,
    gap: 16,
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
}); 