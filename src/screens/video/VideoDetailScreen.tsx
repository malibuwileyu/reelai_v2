import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Platform } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { Video } from '../../models/Video';
import { VideoService } from '../../features/home/services/videoService';
import { useNavigation } from '../../providers/NavigationProvider';
import { showToast } from '../../utils/toast';
import { useAuthContext } from '../../providers/AuthProvider';
import { Timestamp, onSnapshot, doc } from 'firebase/firestore';
import { EnhancedVideoPlayer } from '../../features/learning-path/components/EnhancedVideoPlayer';
import { formatDuration } from '../../utils/formatDuration';
import { db } from '../../config/firebase';
import Constants from 'expo-constants';

// Server URL configuration (same as ServerTestScreen)
const isSimulator = Constants.appOwnership === 'expo' && !Constants.sessionId;

const SERVER_URL = Platform.select({
  ios: isSimulator ? 'http://localhost:3000' : 'http://192.168.1.70:3000',
  android: isSimulator ? 'http://10.0.2.2:3000' : 'http://192.168.1.70:3000',
  default: 'http://localhost:3000'
});

interface VideoTranscript {
  videoId: string;
  text: string;
  createdAt: Date;
}

interface FirestoreTranscript extends Omit<VideoTranscript, 'createdAt'> {
  createdAt: Timestamp;
}

interface Props {
  videoId: string;
}

// Helper function to format date from Firestore Timestamp or Date
const formatDate = (date: Timestamp | Date | string | number) => {
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  return new Date(date).toLocaleDateString();
};

export const VideoDetailScreen: React.FC<Props> = ({ videoId }) => {
  const { user } = useAuthContext();
  const { navigate } = useNavigation();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [transcript, setTranscript] = useState<VideoTranscript | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);

  // Function to request transcript from processing server
  const requestTranscript = async (videoUrl: string) => {
    try {
      console.log('Requesting transcript from processing server:', {
        videoId,
        videoUrl,
        userId: user?.uid
      });

      const response = await fetch(`${SERVER_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `${Date.now()}-${videoId}`
        },
        body: JSON.stringify({
          videoId,
          videoUrl,
          userId: user?.uid,
          message: 'Requesting video transcript'
        })
      });

      const data = await response.json();
      console.log('Processing server response:', data);

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      showToast('Transcript generation started', 'success');
    } catch (error) {
      console.error('Error requesting transcript:', error);
      showToast('Failed to request transcript', 'error');
    }
  };

  useEffect(() => {
    loadVideo();
    loadNotes();

    // Subscribe to transcript updates
    const unsubscribe = onSnapshot(
      doc(db, 'transcripts', videoId),
      async (doc) => {
        setTranscriptLoading(false);
        if (doc.exists()) {
          const data = doc.data() as FirestoreTranscript;
          setTranscript({
            ...data,
            createdAt: data.createdAt.toDate()
          });
        } else {
          setTranscript(null);
          // If video is loaded and has a URL but no transcript exists, request one
          if (video?.videoUrl) {
            await requestTranscript(video.videoUrl);
          }
        }
      },
      (error) => {
        console.error('Error listening to transcript:', error);
        setTranscriptLoading(false);
      }
    );

    return () => unsubscribe();
  }, [videoId, video?.videoUrl]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[VideoDetail] Loading video:', videoId);
      const videoData = await VideoService.getVideo(videoId);
      console.log('[VideoDetail] Video metadata:', videoData.metadata);
      console.log('[VideoDetail] Video data:', videoData);
      console.log('[VideoDetail] Video metadata duration:', videoData.metadata?.duration);
      setVideo(videoData);
    } catch (error) {
      console.error('[VideoDetail] Error loading video:', error);
      setError('Failed to load video');
      showToast('Failed to load video', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const videoNotes = await VideoService.getNotes(videoId);
      setNotes(videoNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    
    try {
      await VideoService.addNote(videoId, noteContent);
      setNoteContent('');
      loadNotes();
      showToast('Note saved successfully', 'success');
    } catch (error) {
      console.error('Error saving note:', error);
      showToast('Failed to save note', 'error');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await VideoService.deleteNote(videoId, noteId);
      loadNotes();
      showToast('Note deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note', 'error');
    }
  };

  if (loading) {
    return (
      <Layout children={
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      } />
    );
  }

  if (error || !video) {
    return (
      <Layout children={
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || 'Video not found'}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigate('videoLibrary')}
          >
            <Text style={styles.buttonText}>Back to Library</Text>
          </TouchableOpacity>
        </View>
      } />
    );
  }

  return (
    <Layout children={
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate('videoLibrary')}
          >
            <Text style={styles.backButtonText}>← Back to Library</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          {video.thumbnailUrl && !video.videoUrl && (
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          )}
          {video.videoUrl && (
            <EnhancedVideoPlayer
              videoId={videoId}
              videoUrl={video.videoUrl}
              duration={video.metadata?.duration}
              style={styles.video}
              shouldPlay={false}
            />
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{video.title}</Text>
          
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {video.views} views • {formatDuration(video.metadata?.duration || 0)} • {formatDate(video.createdAt)}
            </Text>
          </View>

          {video.description && (
            <Text style={styles.description}>{video.description}</Text>
          )}

          {/* Simplified Transcript Section */}
          <View style={styles.transcriptSection}>
            <Text style={styles.sectionTitle}>Transcript</Text>
            {transcriptLoading ? (
              <View style={styles.transcriptLoading}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.transcriptLoadingText}>Loading transcript...</Text>
              </View>
            ) : transcript ? (
              <View style={styles.transcriptContent}>
                <Text style={styles.transcriptText}>{transcript.text}</Text>
              </View>
            ) : (
              <Text style={styles.noTranscriptText}>
                Transcript is being generated...
              </Text>
            )}
          </View>

          {/* Notes Section */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="Add your notes here..."
              placeholderTextColor="#666"
              value={noteContent}
              onChangeText={setNoteContent}
            />
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveNote}
            >
              <Text style={styles.actionButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>

          {/* Display existing notes */}
          {notes.length > 0 && (
            <View style={styles.existingNotes}>
              {notes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <Text style={styles.noteContent}>{note.content}</Text>
                  <Text style={styles.noteTimestamp}>
                    {formatDate(note.createdAt)}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteNoteButton}
                    onPress={() => handleDeleteNote(note.id)}
                  >
                    <Text style={styles.deleteNoteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigate('share', { videoId })}
            >
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>

            {user?.uid === video.creatorId && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={async () => {
                  try {
                    await VideoService.deleteVideo(videoId);
                    showToast('Video deleted successfully', 'success');
                    navigate('videoLibrary');
                  } catch (error) {
                    showToast('Failed to delete video', 'error');
                  }
                }}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    } />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    marginBottom: 16,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsText: {
    color: '#666',
    fontSize: 14,
  },
  description: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  existingNotes: {
    marginTop: 16,
    gap: 12,
  },
  noteItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  noteContent: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  noteTimestamp: {
    color: '#666',
    fontSize: 12,
  },
  deleteNoteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  deleteNoteText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  transcriptSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  transcriptContent: {
    marginTop: 8,
  },
  transcriptText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  transcriptLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  transcriptLoadingText: {
    color: '#666',
    fontSize: 14,
  },
  noTranscriptText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 