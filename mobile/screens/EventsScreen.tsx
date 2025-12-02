import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo } from '../lib/logRepo';
import { noteRepo, Note } from '../lib/noteRepo';
import { EventDialog } from '../components/EventDialog';
import { NoteDialog } from '../components/NoteDialog';
import { EventComponent } from '../components/EventComponent';
import { NoteComponent } from '../components/NoteComponent';
import { useFocusEffect } from '@react-navigation/native';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';
import { MaterialIcons } from '@expo/vector-icons';
import { colorPrefs, DEFAULT_COLORS } from '../lib/colorPrefs';

export default function EventsScreen({ route, navigation }: any) {
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});
  const [chartColors, setChartColors] = useState<Record<string, string>>({});

  const loadEvents = async () => {
    try {
      const data = await eventRepo.list();
      setEvents(data);
      
      // Load log counts
      const counts: Record<string, number> = {};
      for (const event of data) {
        const logsForEvent = await logRepo.listByEvent(event.id);
        counts[event.id] = logsForEvent.length;
      }
      setLogCounts(counts);

      // Load notes
      const allNotes = await noteRepo.list();
      setNotes(allNotes);

      // Load color preferences
      const colorPreferences = await colorPrefs.getAll();
      const initialColors: Record<string, string> = {};
      data.forEach(event => {
        initialColors[event.id] = colorPreferences[event.id] || DEFAULT_COLORS[0];
      });
      setChartColors(initialColors);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEvents();
    }, [])
  );

  // Listen for data updates from anywhere in the app
  useEffect(() => {
    const handleDataUpdate = () => {
      loadEvents();
    };

    dataEmitter.on(DATA_UPDATED_EVENT, handleDataUpdate);

    return () => {
      dataEmitter.off(DATA_UPDATED_EVENT, handleDataUpdate);
    };
  }, []);

  useEffect(() => {
    if (route?.params?.openDialog) {
      setEditingEvent(null);
      setIsDialogOpen(true);
      // Reset the param
      navigation.setParams({ openDialog: false });
    }
  }, [route?.params?.openDialog]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventRepo.delete(id);
              loadEvents();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    loadEvents();
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleNoteSave = () => {
    loadEvents();
    setEditingNote(null);
    setIsNoteDialogOpen(false);
  };

  const handleNoteEdit = (note: Note) => {
    setEditingNote(note);
    setIsNoteDialogOpen(true);
  };

  const handleNoteDelete = async (id: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await noteRepo.delete(id);
              loadEvents();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const getEventName = (eventId: string): string => {
    const event = events.find(e => e.id === eventId);
    return event?.event_name || 'Unknown Event';
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <EventComponent 
      event={item}
      logCount={logCounts[item.id] || 0}
      onEdit={() => handleEdit(item)}
      color={chartColors[item.id] || DEFAULT_COLORS[0]}
    />
  );

  const renderNote = ({ item }: { item: Note }) => (
    <NoteComponent 
      note={item}
      eventName={getEventName(item.event_id)}
      onEdit={() => handleNoteEdit(item)}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Tracking Events Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tracking Events</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingEvent(null);
              setIsDialogOpen(true);
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : events.length === 0 ? (
          <Text style={styles.emptyText}>No events yet. Create your first event to get started.</Text>
        ) : (
          <View>
            {events.map((item) => (
              <View key={item.id}>
                {renderEvent({ item })}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Impact Notes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Impact Notes</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingNote(null);
              setIsNoteDialogOpen(true);
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {notes.length === 0 ? (
          <Text style={styles.emptyText}>No notes yet. Add your first milestone note.</Text>
        ) : (
          <View>
            {notes.map((item) => (
              <View key={item.id}>
                {renderNote({ item })}
              </View>
            ))}
          </View>
        )}
      </View>

      <EventDialog
        visible={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={handleSave}
        onDelete={editingEvent ? () => handleDelete(editingEvent.id) : undefined}
      />

      <NoteDialog
        visible={isNoteDialogOpen}
        onClose={() => {
          setIsNoteDialogOpen(false);
          setEditingNote(null);
        }}
        note={editingNote}
        onSave={handleNoteSave}
        onDelete={editingNote ? () => handleNoteDelete(editingNote.id) : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
    lineHeight: 24,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },
});
