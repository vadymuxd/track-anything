import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Event, eventRepo } from '../lib/eventRepo';
import { logRepo } from '../lib/logRepo';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';

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

      // Emit event to notify all screens to refresh
      dataEmitter.emit(DATA_UPDATED_EVENT);

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
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.fullscreen}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
          </Animated.View>
          <Animated.View style={[styles.dialogContainer, { transform: [{ translateY: dialogTranslateY }] }]}>
            <View style={styles.dialog}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Log Event</Text>
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
              <Text style={styles.title}>Log Event</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.emptyText}>Create an event first to start logging.</Text>
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
              <Text style={styles.title}>Log Event</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

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
              <TouchableOpacity style={styles.saveButton} onPress={handleLog} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#000',
    borderColor: '#000',
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
});
