import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Animated, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Event, eventRepo } from '../lib/eventRepo';
import { noteRepo, Note } from '../lib/noteRepo';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';

interface NoteDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  note?: Note | null;
  onDelete?: () => void;
  preselectedEventId?: string;
}

export const NoteDialog = ({ visible, onClose, onSave, note, onDelete, preselectedEventId }: NoteDialogProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dialogTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      loadEvents();

      overlayOpacity.setValue(0);
      dialogTranslateY.setValue(300);

      // Animate dialog slide-up and overlay fade-in together
      Animated.parallel([
        Animated.timing(dialogTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(dialogTranslateY, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventRepo.list();
      setEvents(allEvents);
      if (note) {
        // If editing a note, set the values from the note
        setSelectedEvent(note.event_id || '');
        setTitle(note.title);
        setDescription(note.description || '');
        setStartDate(new Date(note.start_date)); // Convert string to Date
      } else if (preselectedEventId) {
        // If a preselected event is provided, use it
        setSelectedEvent(preselectedEventId);
        setTitle('');
        setDescription('');
        setStartDate(new Date()); // Default to today
      } else if (allEvents.length > 0) {
        setSelectedEvent(allEvents[0].id);
        setTitle('');
        setDescription('');
        setStartDate(new Date()); // Default to today
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedEvent || !title.trim()) {
      alert('Please select an event and enter a title');
      return;
    }

    setSaving(true);
    try {
      if (note) {
        // Update existing note
        await noteRepo.update(note.id, {
          event_id: selectedEvent,
          title: title.trim(),
          description: description.trim() || null,
          start_date: startDate.toISOString(), // Convert Date to ISO string
        });
      } else {
        // Create new note
        await noteRepo.create({
          event_id: selectedEvent,
          title: title.trim(),
          description: description.trim() || null,
          start_date: startDate.toISOString(), // Convert Date to ISO string
        });
      }

      // Emit event to notify all screens to refresh
      dataEmitter.emit(DATA_UPDATED_EVENT);

      setTitle('');
      setDescription('');
      setStartDate(new Date());
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.fullscreen}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
          </Animated.View>
          <Animated.View style={[styles.dialogContainer, { transform: [{ translateY: dialogTranslateY }] }]}>
            <View style={styles.dialog}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{note ? 'Edit Note' : 'New Note'}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  if (events.length === 0) {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.fullscreen}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
          </Animated.View>
          <Animated.View style={[styles.dialogContainer, { transform: [{ translateY: dialogTranslateY }] }]}>
            <View style={styles.dialog}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>New Note</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.emptyText}>Create an event first to add notes.</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.fullscreen}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[styles.dialogContainer, { transform: [{ translateY: dialogTranslateY }] }]}>
          <View style={styles.dialog}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{note ? 'Edit Note' : 'New Note'}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Related Event</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventPicker}>
                  {events.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.eventOption,
                        selectedEvent === event.id && styles.eventOptionActive
                      ]}
                      onPress={() => setSelectedEvent(event.id)}
                    >
                      <Text style={[
                        styles.eventOptionText,
                        selectedEvent === event.id && styles.eventOptionTextActive
                      ]}>
                        {event.event_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Note Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter note title"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>

              {note && onDelete && (
                <TouchableOpacity style={styles.deleteButton} onPress={() => { onClose(); onDelete(); }}>
                  <Text style={styles.deleteButtonText}>Delete Note</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    flex: 1,
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dialog: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000',
    marginLeft: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  eventPicker: {
    marginTop: 4,
  },
  eventOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  eventOptionActive: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  eventOptionText: {
    fontSize: 14,
    color: '#999',
  },
  eventOptionTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
  },
  buttons: {
    marginTop: 20,
  },
  saveButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    padding: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
});
