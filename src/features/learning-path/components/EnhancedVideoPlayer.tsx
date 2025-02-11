import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Modal, TextInput } from 'react-native';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../../../hooks/useProgress';
import { useAuthContext } from '../../../providers/AuthProvider';
import { formatDuration } from '../../../utils/formatDuration';
import { VideoBookmark, VideoNote, VideoTranscript, VideoChapter } from '../types';
import { getDocs, query, where, collection, addDoc } from 'firebase/firestore';
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
  isBookmarkModalVisible: boolean;
  isNoteModalVisible: boolean;
  isTranscriptVisible: boolean;
  isChaptersVisible: boolean;
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
    isBookmarkModalVisible: false,
    isNoteModalVisible: false,
    isTranscriptVisible: false,
    isChaptersVisible: false,
  });

  // Hooks
  const { progress, updateProgress, markAsCompleted } = useProgress(videoId);
  const { user } = useAuthContext();
  const [isPipActive, setIsPipActive] = useState(false);
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [activeChapter, setActiveChapter] = useState<VideoChapter | null>(null);

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

  // Load bookmarks and notes
  useEffect(() => {
    const loadEnhancements = async () => {
      if (!user) return;
      try {
        // Load bookmarks and notes from Firestore
        const bookmarksSnap = await getDocs(query(
          collection(db, 'videoBookmarks'),
          where('userId', '==', user.uid),
          where('videoId', '==', videoId)
        ));
        setBookmarks(bookmarksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VideoBookmark));

        const notesSnap = await getDocs(query(
          collection(db, 'videoNotes'),
          where('userId', '==', user.uid),
          where('videoId', '==', videoId)
        ));
        setNotes(notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VideoNote));
      } catch (error) {
        console.error('Error loading enhancements:', error);
      }
    };

    loadEnhancements();
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

  // Handlers
  const handlePlay = async () => {
    try {
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
  const handleAddBookmark = async () => {
    if (!user) return;
    try {
      const bookmark: Omit<VideoBookmark, 'id'> = {
        userId: user.uid,
        videoId,
        timestamp: controls.currentTime * 1000,
        label: `Bookmark at ${formatDuration(controls.currentTime)}`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'videoBookmarks'), bookmark);
      setBookmarks(prev => [...prev, { id: docRef.id, ...bookmark }]);
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  const handleAddNote = async (content: string) => {
    if (!user) return;
    try {
      const note: Omit<VideoNote, 'id'> = {
        userId: user.uid,
        videoId,
        timestamp: controls.currentTime * 1000,
        content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'videoNotes'), note);
      setNotes(prev => [...prev, { id: docRef.id, ...note }]);
    } catch (error) {
      console.error('Error adding note:', error);
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

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={showControls}
        {...panResponder.panHandlers}
      >
        <ExpoVideo
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={shouldPlay}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          progressUpdateIntervalMillis={1000}
        />

        <Animated.View
          style={[
            styles.controls,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={controls.isControlsVisible ? 'auto' : 'none'}
        >
          {/* Top controls */}
          <View style={styles.topControls}>
            <TouchableOpacity onPress={togglePictureInPicture}>
              <Ionicons
                name={isPipActive ? 'expand' : 'contract'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* Center controls */}
          <View style={styles.centerControls}>
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

            {/* Time display */}
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>
                {formatDuration(controls.currentTime)}
              </Text>
              <Text style={styles.timeText}> / </Text>
              <Text style={styles.timeText}>
                {formatDuration(controls.duration)}
              </Text>
            </View>

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
        </Animated.View>
      </TouchableOpacity>

      {/* Learning enhancement controls */}
      <View style={styles.enhancementControls}>
        <TouchableOpacity onPress={handleAddBookmark}>
          <Ionicons name="bookmark" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setControls(prev => ({ ...prev, isNoteModalVisible: true }))}>
          <Ionicons name="create" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setControls(prev => ({ ...prev, isTranscriptVisible: !prev.isTranscriptVisible }))}>
          <Ionicons name="document-text" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setControls(prev => ({ ...prev, isChaptersVisible: !prev.isChaptersVisible }))}>
          <Ionicons name="list" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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

      {/* Note modal */}
      <Modal
        visible={controls.isNoteModalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="Enter your note..."
              onSubmitEditing={(e) => {
                handleAddNote(e.nativeEvent.text);
                setControls(prev => ({ ...prev, isNoteModalVisible: false }));
              }}
            />
            <TouchableOpacity
              onPress={() => setControls(prev => ({ ...prev, isNoteModalVisible: false }))}
            >
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'column',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  speedText: {
    color: '#fff',
    fontSize: 12,
  },
  enhancementControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 8,
  },
  transcriptPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
  },
  transcriptSegment: {
    flexDirection: 'row',
    marginBottom: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '80%',
  },
  noteInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  modalClose: {
    color: '#007AFF',
    textAlign: 'center',
  },
}); 