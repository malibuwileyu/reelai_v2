import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { Video } from '../../models/Video';
import { VideoService } from '../../features/home/services/videoService';
import { useNavigation } from '../../providers/NavigationProvider';
import { showToast } from '../../utils/toast';
import { useAuthContext } from '../../providers/AuthProvider';
import { Timestamp } from 'firebase/firestore';
import { VideoPlayer } from '../../components/video/VideoPlayer';

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

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[VideoDetail] Loading video:', videoId);
      const videoData = await VideoService.getVideo(videoId);
      console.log('[VideoDetail] Video data:', videoData);
      setVideo(videoData);
    } catch (error) {
      console.error('[VideoDetail] Error loading video:', error);
      setError('Failed to load video');
      showToast('Failed to load video', 'error');
    } finally {
      setLoading(false);
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
            <VideoPlayer
              videoId={videoId}
              videoUrl={video.videoUrl}
              style={styles.video}
              shouldPlay={false}
            />
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{video.title}</Text>
          
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {video.views} views • {formatDate(video.createdAt)}
            </Text>
          </View>

          {video.description && (
            <Text style={styles.description}>{video.description}</Text>
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
}); 