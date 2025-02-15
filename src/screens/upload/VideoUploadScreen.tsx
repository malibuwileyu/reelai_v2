import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useVideoUpload } from '../../features/video/hooks/useVideoUpload';
import { showToast } from '../../utils/toast';
import { useNavigation } from '../../providers/NavigationProvider';
import { VideoMetadata } from '../../types/video';
import { useAuth } from '../../hooks/useAuth';

interface FormData {
  title: string;
  description: string;
  isPublic: boolean;
  category: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  isPublic: true,
  category: 'education',
};

export const VideoUploadScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const { uploadVideo, progress, error, isUploading, videoId } = useVideoUpload();

  const handlePickVideo = useCallback(async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast('Permission to access media library is required', 'error');
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 300, // 5 minutes
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      showToast('Error picking video', 'error');
      console.error('Video pick error:', error);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!videoUri || !user) {
      showToast('Please select a video first', 'error');
      return;
    }

    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    try {
      // Get the video file from URI
      const response = await fetch(videoUri);
      const blob = await response.blob();
      const file = new File([blob], 'video.mp4', { type: 'video/mp4' });

      const metadata: VideoMetadata = {
        id: '', // Will be set by the server
        title: formData.title.trim(),
        description: formData.description.trim(),
        creatorId: user.uid,
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: blob.size,
        mimeType: 'video/mp4',
        duration: 0, // Will be set by the server
        category: formData.category,
        isPublic: formData.isPublic,
        language: 'en', // Default to English
        views: 0,
        likes: 0,
      };

      const result = await uploadVideo(file, metadata);
      showToast('Video upload started successfully', 'success');
      
      // Navigate to video detail screen
      if (result?.videoId) {
        navigate('videoDetail', { videoId: result.videoId });
      }
      
      setFormData(initialFormData);
      setVideoUri(null);
    } catch (error) {
      showToast('Error uploading video', 'error');
      console.error('Upload error:', error);
    }
  }, [videoUri, formData, uploadVideo, navigate, user]);

  const updateFormField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout children={
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Upload Video</Text>

        {/* Video Preview */}
        {videoUri ? (
          <View style={styles.previewContainer}>
            <Video
              source={{ uri: videoUri }}
              style={styles.preview}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handlePickVideo}
            disabled={isUploading}
          >
            <Text style={styles.uploadButtonText}>Select Video</Text>
          </TouchableOpacity>
        )}

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#666"
            value={formData.title}
            onChangeText={value => updateFormField('title', value)}
            editable={!isUploading}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            placeholderTextColor="#666"
            value={formData.description}
            onChangeText={value => updateFormField('description', value)}
            multiline
            numberOfLines={4}
            editable={!isUploading}
          />

          {/* Category Selector */}
          <View style={styles.categoryContainer}>
            {['education', 'tutorial', 'lecture', 'other'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  formData.category === category && styles.categoryButtonActive
                ]}
                onPress={() => updateFormField('category', category)}
                disabled={isUploading}
              >
                <Text style={[
                  styles.categoryButtonText,
                  formData.category === category && styles.categoryButtonTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Privacy Toggle */}
          <TouchableOpacity
            style={styles.privacyToggle}
            onPress={() => updateFormField('isPublic', !formData.isPublic)}
            disabled={isUploading}
          >
            <Text style={styles.privacyText}>
              {formData.isPublic ? '🌎 Public' : '🔒 Private'}
            </Text>
          </TouchableOpacity>

          {/* Upload Progress */}
          {progress && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress.progress}%` }]} />
              <Text style={styles.progressText}>{Math.round(progress.progress)}%</Text>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <Text style={styles.errorText}>{error.message}</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!videoUri || isUploading) && styles.submitButtonDisabled]}
            onPress={handleUpload}
            disabled={!videoUri || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Upload Video</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    } />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  previewContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  preview: {
    flex: 1,
  },
  uploadButton: {
    height: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  privacyToggle: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  privacyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    height: 40,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 40,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#1a1a1a',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});