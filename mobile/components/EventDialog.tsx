import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Event, eventRepo } from '../lib/eventRepo';

interface EventDialogProps {
  visible: boolean;
  onClose: () => void;
  event?: Event | null;
  onSave: () => void;
}

export const EventDialog = ({ visible, onClose, event, onSave }: EventDialogProps) => {
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<'Count' | 'Scale'>('Count');
  const [scaleLabel, setScaleLabel] = useState('');
  const [scaleMax, setScaleMax] = useState('5');
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (event) {
      setEventName(event.event_name);
      setEventType(event.event_type as 'Count' | 'Scale');
      setScaleLabel(event.scale_label || '');
      setScaleMax(event.scale_max?.toString() || '5');
    } else {
      setEventName('');
      setEventType('Count');
      setScaleLabel('');
      setScaleMax('5');
    }
  }, [event, visible]);

  const handleSave = async () => {
    if (!eventName.trim()) {
      alert('Event name is required');
      return;
    }

    setSaving(true);
    try {
      if (event) {
        await eventRepo.update(event.id, {
          event_name: eventName,
          event_type: eventType,
          scale_label: eventType === 'Scale' ? scaleLabel : null,
          scale_max: eventType === 'Scale' ? parseInt(scaleMax) : null,
        });
      } else {
        await eventRepo.create({
          event_name: eventName,
          event_type: eventType,
          scale_label: eventType === 'Scale' ? scaleLabel : null,
          scale_max: eventType === 'Scale' ? parseInt(scaleMax) : null,
        });
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(error.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <View style={styles.dialogContainer}>
        <View style={styles.dialog}>
          <ScrollView>
            <Text style={styles.title}>{event ? 'Edit Event' : 'Create Event'}</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Event Name</Text>
              <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g., Morning workout"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Event Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, eventType === 'Count' && styles.typeButtonActive]}
                  onPress={() => setEventType('Count')}
                >
                  <Text style={[styles.typeButtonText, eventType === 'Count' && styles.typeButtonTextActive]}>
                    Count
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, eventType === 'Scale' && styles.typeButtonActive]}
                  onPress={() => setEventType('Scale')}
                >
                  <Text style={[styles.typeButtonText, eventType === 'Scale' && styles.typeButtonTextActive]}>
                    Scale
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {eventType === 'Scale' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Scale Label</Text>
                  <TextInput
                    style={styles.input}
                    value={scaleLabel}
                    onChangeText={setScaleLabel}
                    placeholder="e.g., cups, km, hours"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Scale Max (2-10)</Text>
                  <TextInput
                    style={styles.input}
                    value={scaleMax}
                    onChangeText={setScaleMax}
                    keyboardType="number-pad"
                    placeholder="5"
                  />
                </View>
              </>
            )}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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
    backgroundColor: '#000',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
