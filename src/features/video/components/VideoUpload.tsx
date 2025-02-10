import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoUpload } from '../hooks/useVideoUpload';
import { VideoUploadOptions } from '../types';

interface VideoUploadProps {
  onUploadComplete?: (videoId: string) => void;
  onUploadError?: (error: Error) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadComplete,
  onUploadError,
}) => {
  const {
    uploadVideo,
    cancelUpload,
    progress,
    error,
    isUploading,
    videoId,
  } = useVideoUpload();

  const [title, setTitle] = useState('');

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'video/mp4',
          name: result.assets[0].name,
        };

        const options: VideoUploadOptions = {
          title: title || 'Untitled Video',
          isPublic: true,
        };

        await uploadVideo(file as unknown as File, options);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      onUploadError?.(error as Error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelUpload();
    } catch (error) {
      console.error('Error canceling upload:', error);
      onUploadError?.(error as Error);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleFilePick}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isUploading ? (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.progressText}>
            {progress ? `${Math.round(progress.progress)}%` : 'Starting upload...'}
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handleFilePick}>
          <Text style={styles.buttonText}>Select Video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 