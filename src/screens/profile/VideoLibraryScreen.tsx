import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { useAuthContext } from '../../providers/AuthProvider';
import { Video } from '../../models/Video';
import { VideoService } from '../../features/home/services/videoService';
import { useNavigation } from '../../providers/NavigationProvider';
import { showToast } from '../../utils/toast';
import { VideoCard } from '../../components/video/VideoCard';
import { StreakDisplay } from '../../components/streak/StreakDisplay';
import { ProgressService } from '../../services/progressService';
import { StreakService } from '../../services/streakService';
import { useStreak } from '../../hooks/useStreak';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { VideoBookmark } from '../../types/video';

type TabType = 'myVideos' | 'savedVideos';

export const VideoLibraryScreen: React.FC = () => {
  const { user } = useAuthContext();
  const { navigate } = useNavigation();
  const { refresh: refreshStreak, updateOptimisticStreak } = useStreak();
  const [activeTab, setActiveTab] = useState<TabType>('myVideos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [savedVideos, setSavedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatingWatch, setSimulatingWatch] = useState(false);
  const [updatingStreak, setUpdatingStreak] = useState(false);

  useEffect(() => {
    if (activeTab === 'myVideos') {
      loadVideos();
    } else {
      loadSavedVideos();
    }
  }, [user, activeTab]);

  const loadVideos = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('[VideoLibrary] Loading videos for user:', user.uid);
      
      const userVideos = await VideoService.getVideosByUser(user.uid);
      console.log('[VideoLibrary] Successfully loaded videos:', userVideos.length);
      console.log('[VideoLibrary] Video thumbnails:', userVideos.map(video => ({
        id: video.id,
        thumbnailUrl: video.thumbnailUrl
      })));
      
      setVideos(userVideos);
    } catch (error) {
      console.error('[VideoLibrary] Error loading videos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      showToast('Failed to load videos: ' + errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedVideos = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all bookmarks for the user
      const bookmarksQuery = query(
        collection(db, 'videoBookmarks'),
        where('userId', '==', user.uid)
      );
      const bookmarkDocs = await getDocs(bookmarksQuery);
      const bookmarks = bookmarkDocs.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as VideoBookmark[];
      
      // Get video details for each bookmark
      const videoIds = [...new Set(bookmarks.map(b => b.videoId))];
      const videos = await Promise.all(
        videoIds.map(id => VideoService.getVideo(id))
      );
      
      setSavedVideos(videos.filter(v => v !== null));
    } catch (error) {
      console.error('[VideoLibrary] Error loading saved videos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      showToast('Failed to load saved videos: ' + errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadVideos();
  };

  const handleSimulateWatch = async (video: Video) => {
    if (!user) {
      showToast('Please log in to track progress', 'error');
      return;
    }

    try {
      // Simulate watching 80% of the video
      const watchedSeconds = Math.floor(video.metadata.duration * 0.8);
      
      // Update progress
      await ProgressService.updateProgress(
        user.uid,
        video.id,
        watchedSeconds,
        watchedSeconds
      );

      // Update streak
      await StreakService.updateStreak(user.uid);
      
      // Refresh streak info
      await refreshStreak();
      
      showToast('Watch progress updated', 'success');
    } catch (error) {
      console.error('Error simulating watch:', error);
      showToast('Failed to update watch progress', 'error');
    }
  };

  const handleUpdateStreak = async () => {
    if (!user || updatingStreak) return;
    
    try {
      setUpdatingStreak(true);
      console.log('[VideoLibrary] Updating streak for user:', user.uid);
      
      // Update optimistic streak immediately
      updateOptimisticStreak();
      
      // Update streak in the background
      await StreakService.forceUpdateStreak(user.uid);
      console.log('[VideoLibrary] Streak updated, refreshing display...');
      
      await refreshStreak();
      console.log('[VideoLibrary] Streak display refreshed');
      
      showToast('Successfully updated streak! 🔥', 'success');
    } catch (error) {
      console.error('[VideoLibrary] Error updating streak:', error);
      showToast('Failed to update streak', 'error');
    } finally {
      setUpdatingStreak(false);
    }
  };

  const renderVideo = ({ item }: { item: Video }) => (
    <View style={styles.videoContainer}>
      <VideoCard
        video={item}
        onPress={() => navigate('videoDetail', { videoId: item.id })}
      />
      <TouchableOpacity
        style={[
          styles.simulateButton,
          simulatingWatch && styles.simulateButtonDisabled
        ]}
        onPress={() => handleSimulateWatch(item)}
        disabled={simulatingWatch}
      >
        <Text style={styles.simulateButtonText}>
          {simulatingWatch ? 'Simulating...' : '🎬 Simulate Watch'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'myVideos' && styles.activeTab]}
        onPress={() => setActiveTab('myVideos')}
      >
        <Text style={[styles.tabText, activeTab === 'myVideos' && styles.activeTabText]}>
          My Videos
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'savedVideos' && styles.activeTab]}
        onPress={() => setActiveTab('savedVideos')}
      >
        <Text style={[styles.tabText, activeTab === 'savedVideos' && styles.activeTabText]}>
          Saved Videos
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            Loading {activeTab === 'myVideos' ? 'videos' : 'saved videos'}...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => activeTab === 'myVideos' ? loadVideos() : loadSavedVideos()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const currentVideos = activeTab === 'myVideos' ? videos : savedVideos;

    if (currentVideos.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {activeTab === 'myVideos' 
              ? 'No videos uploaded yet' 
              : 'No saved videos yet'
            }
          </Text>
          {activeTab === 'myVideos' && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => navigate('videoUpload')}
            >
              <Text style={styles.uploadButtonText}>Upload a Video</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={currentVideos}
        renderItem={renderVideo}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.videoList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <Layout children={
      <View style={styles.container}>
        {renderTabs()}
        <StreakDisplay style={styles.streakDisplay} />
        
        {activeTab === 'myVideos' && (
          <TouchableOpacity
            style={[
              styles.testButton,
              updatingStreak && styles.testButtonDisabled
            ]}
            onPress={handleUpdateStreak}
            disabled={updatingStreak}
          >
            <Text style={styles.testButtonText}>
              {updatingStreak ? 'Updating...' : '🔥 Test Streak Update'}
            </Text>
          </TouchableOpacity>
        )}

        {renderContent()}
      </View>
    } />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  streakDisplay: {
    marginBottom: 20,
  },
  videoList: {
    gap: 16,
  },
  videoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  videoStats: {
    color: '#666',
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoContainer: {
    marginBottom: 16,
  },
  simulateButton: {
    backgroundColor: '#2ecc71',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  simulateButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  simulateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2a2a2a',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
}); 