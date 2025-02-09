import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '../../providers/NavigationProvider';

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
}

interface StudyNotesScreenProps {
  subjectId: string;
}

export const StudyNotesScreen: React.FC<StudyNotesScreenProps> = ({ subjectId }) => {
  const { navigate } = useNavigation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isEditing, setIsEditing] = useState(false);

  const handleAddNote = useCallback(() => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      timestamp: new Date(),
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: '', content: '' });
    setIsEditing(false);
  }, [newNote]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  }, []);

  if (isEditing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>New Note</Text>
        <View style={styles.editorContainer}>
          <TextInput
            style={styles.titleInput}
            value={newNote.title}
            onChangeText={title => setNewNote(prev => ({ ...prev, title }))}
            placeholder="Note Title"
          />
          <TextInput
            style={styles.contentInput}
            value={newNote.content}
            onChangeText={content => setNewNote(prev => ({ ...prev, content }))}
            placeholder="Start typing your note..."
            multiline
            textAlignVertical="top"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setNewNote({ title: '', content: '' });
              }}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handleAddNote}
            >
              <Text style={styles.buttonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Notes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.addButtonText}>+ New Note</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.notesList}>
        {notes.map(note => (
          <View key={note.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <TouchableOpacity
                onPress={() => handleDeleteNote(note.id)}
              >
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.noteContent}>{note.content}</Text>
            <Text style={styles.timestamp}>
              {note.timestamp.toLocaleDateString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  notesList: {
    flex: 1,
  },
  noteCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: 16,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    fontSize: 16,
  },
  editorContainer: {
    flex: 1,
    gap: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    minHeight: 200,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#007AFF',
  },
}); 