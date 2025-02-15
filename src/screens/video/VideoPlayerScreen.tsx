import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { EnhancedVideoPlayer } from '../../features/learning-path/components/EnhancedVideoPlayer';

interface Props {
  videoId: string;
  videoUrl: string;
  title: string;
  pathId: string;
}

export const VideoPlayerScreen: React.FC<Props> = ({ videoId, videoUrl, title, pathId }) => {
  return (
    <Layout showBackButton>
      <View style={styles.container}>
        <EnhancedVideoPlayer
          videoId={videoId}
          videoUrl={videoUrl}
          pathId={pathId}
          style={styles.player}
          shouldPlay={true}
        />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  player: {
    flex: 1,
  },
}); 