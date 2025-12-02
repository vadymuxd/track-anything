import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Note } from '../lib/noteRepo';

interface NoteHintProps {
  note: Note;
  x: number;
  y: number;
  onClose: () => void;
}

export const NoteHint: React.FC<NoteHintProps> = ({ note, x, y, onClose }) => {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      <View
        style={[
          styles.card,
          {
            left: x - 55, // center horizontally assuming ~110 width
            top: y - 60,  // place above the circle
          },
        ]}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <MaterialIcons name="close" size={18} color="#333" />
        </TouchableOpacity>
        {note.title ? <Text style={styles.title}>{note.title}</Text> : null}
        {note.description ? <Text style={styles.description}>{note.description}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  card: {
    position: 'absolute',
    minWidth: 110,
    maxWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginRight: 28,
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: '#666',
  },
});

export default NoteHint;
