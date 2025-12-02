import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Note } from '../lib/noteRepo';

interface NoteComponentProps {
  note: Note;
  eventName: string;
  onEdit: () => void;
}

export const NoteComponent = ({ note, eventName, onEdit }: NoteComponentProps) => {
  return (
    <View style={styles.noteCard}>
      <View style={styles.noteInfo}>
        <Text style={styles.noteTitle}>{note.title}</Text>
        <Text style={styles.eventName}>{eventName}</Text>
        {note.description && (
          <Text style={styles.noteDescription}>{note.description}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.editButton}>
        <MaterialIcons name="edit" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  noteCard: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  eventName: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  noteDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    padding: 8,
  },
});
