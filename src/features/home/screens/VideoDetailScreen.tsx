import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Layout } from '../../../components/shared/Layout';
import { Video } from '../../../models/Video';
import { VideoService } from '../services/videoService';
import { Comments } from '../components/Comments';

interface VideoDetailScreenProps {
  videoId: string;
}

export const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({ videoId }) => {
  // 1. Hooks
  const [video, setVideo] = React.useState<Video | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // 2. Effects
  React.useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        const videoData = await VideoService.getVideo(videoId);
        setVideo(videoData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  // 3. Handlers
  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  // 4. Render helpers
  const renderContent = () => {
    if (loading) {
      return <Text style={styles.message}>Loading...</Text>;
    }

    if (error) {
      return <Text style={styles.error}>{error.message}</Text>;
    }

    if (!video) {
      return <Text style={styles.message}>Video not found</Text>;
    }

    return (
      <ScrollView style={styles.content}>
        {/* TODO: Add video player component */}
        <View style={styles.videoPlaceholder}>
          <Text style={styles.placeholderText}>Video Player</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.title}>{video.title}</Text>
          <Text style={styles.description}>{video.description}</Text>
          
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>Views: {video.views}</Text>
            <Text style={styles.metadataText}>Likes: {video.likes}</Text>
          </View>
        </View>

        <Comments videoId={videoId} />
      </ScrollView>
    );
  };

  return (
    <Layout children={
      <View style={styles.container}>
        {renderContent()}
      </View>
    } />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  details: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metadataText: {
    color: '#999',
    fontSize: 14,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 