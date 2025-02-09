import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useAuthContext } from '../../providers/AuthProvider';
import { useNavigation } from '../../providers/NavigationProvider';

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

interface CommentsScreenProps {
  videoId: string;
}

export const CommentsScreen: React.FC<CommentsScreenProps> = ({ videoId }) => {
  const { user } = useAuthContext();
  const { navigate } = useNavigation();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  const handleAddComment = useCallback(() => {
    if (!user || !newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: user.uid,
      username: user.displayName || 'Anonymous',
      text: newComment.trim(),
      timestamp: new Date(),
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  }, [user, newComment]);

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.commentText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleDateString()}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please log in to view comments</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigate('login')}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          multiline
        />
        <TouchableOpacity 
          style={styles.button}
          onPress={handleAddComment}
        >
          <Text style={styles.buttonText}>Post</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.commentsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    maxHeight: 100,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  commentsList: {
    gap: 16,
  },
  commentContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
  },
  commentText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 