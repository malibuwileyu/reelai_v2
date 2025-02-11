import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, SafeAreaView } from 'react-native';
import { useNavigation } from '../../providers/NavigationProvider';

interface ShareScreenProps {
  videoId: string;
}

export const ShareScreen: React.FC<ShareScreenProps> = ({ videoId }) => {
  const { navigate } = useNavigation();

  const handleShare = useCallback(async (platform: string) => {
    try {
      const url = `https://reelai.app/video/${videoId}`;
      const title = 'Check out this video on ReelAI!';
      const message = `${title}\n${url}`;

      await Share.share({
        message,
        title,
        url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [videoId]);

  const ShareButton = ({ platform, icon }: { platform: string; icon: string }) => (
    <TouchableOpacity
      style={styles.shareButton}
      onPress={() => handleShare(platform)}
    >
      <Text style={styles.shareIcon}>{icon}</Text>
      <Text style={styles.shareText}>{platform}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigate('videoDetail', { videoId })}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Share this video</Text>
        <View style={styles.shareGrid}>
          <ShareButton platform="Copy Link" icon="🔗" />
          <ShareButton platform="WhatsApp" icon="💬" />
          <ShareButton platform="Twitter" icon="🐦" />
          <ShareButton platform="Facebook" icon="👥" />
          <ShareButton platform="Email" icon="📧" />
          <ShareButton platform="More" icon="•••" />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: '#fff',
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    padding: 16,
  },
  shareButton: {
    width: 100,
    height: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareIcon: {
    fontSize: 32,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#fff',
  },
}); 