import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Event, eventRepo } from '../lib/eventRepo';
import { logRepo } from '../lib/logRepo';

interface LogEventDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const LogEventDialog = ({ visible, onClose, onSave }: LogEventDialogProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [scaleValue, setScaleValue] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadEvents();
    }
  }, [visible]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventRepo.list();
      setEvents(allEvents);
      if (allEvents.length > 0) {
        setSelectedEvent(allEvents[0].event_name);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!selectedEvent) return;

    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return;

    const value = event.event_type === 'Count' ? 1 : scaleValue;
    
    setSaving(true);
    try {
      await logRepo.create({
        event_id: event.id,
        event_name: selectedEvent,
        value,
      });

      setScaleValue(1);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error logging event:', error);
      alert('Failed to log event');
    } finally {
      setSaving(false);
    }
  };

  const selectedEventData = events.find(e => e.event_name === selectedEvent);

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Log Event</Text>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (events.length === 0) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Log Event</Text>
            <Text style={styles.emptyText}>Create an event first to start logging.</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView>
            <Text style={styles.title}>Log Event</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Select Event</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventPicker}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventOption,
                      selectedEvent === event.event_name && styles.eventOptionActive
                    ]}
                    onPress={() => setSelectedEvent(event.event_name)}
                  >
                    <Text style={[
                      styles.eventOptionText,
                      selectedEvent === event.event_name && styles.eventOptionTextActive
                    ]}>
                      {event.event_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedEventData?.event_type === 'Scale' && (
              <View style={styles.field}>
                <Text style={styles.label}>
                  Value: {scaleValue} {selectedEventData.scale_label}
                </Text>
                <View style={styles.scaleButtons}>
                  {Array.from({ length: selectedEventData.scale_max || 5 }, (_, i) => i + 1).map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.scaleButton,
                        scaleValue === val && styles.scaleButtonActive
                      ]}
                      onPress={() => setScaleValue(val)}
                    >
                      <Text style={[
                        styles.scaleButtonText,
                        scaleValue === val && styles.scaleButtonTextActive
                      ]}>
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleLog} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Logging...' : 'Log'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
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
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
  },
  eventOptionActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  eventOptionText: {
    fontSize: 14,
    color: '#666',
  },
  eventOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scaleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  scaleButton: {
    width: 50,
    height: 50,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  scaleButtonText: {
    fontSize: 16,
    color: '#666',
  },
  scaleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  slider: {
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007bff',
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
    backgroundColor: '#007bff',
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
