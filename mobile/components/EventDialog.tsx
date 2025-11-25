import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Event, eventRepo } from '../lib/eventRepo';

interface EventDialogProps {
  visible: boolean;
  onClose: () => void;
  event?: Event | null;
  onSave: () => void;
  onDelete?: () => void;
}

export const EventDialog = ({ visible, onClose, event, onSave, onDelete }: EventDialogProps) => {
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<'Count' | 'Scale'>('Count');
  const [scaleLabel, setScaleLabel] = useState('');
  const [scaleMax, setScaleMax] = useState('5');
  const [saving, setSaving] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dialogTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.fullscreen}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}> 
          <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[styles.dialogContainer, { transform: [{ translateY: dialogTranslateY }] }]}>
          <View style={styles.dialog}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{event ? 'Edit Event' : 'Create Event'}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, eventType === 'Count' && styles.typeOptionActive]}
                  onPress={() => setEventType('Count')}
                >
                  <Text style={[styles.typeOptionText, eventType === 'Count' && styles.typeOptionTextActive]}>
                    Count
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOption, eventType === 'Scale' && styles.typeOptionActive]}
                  onPress={() => setEventType('Scale')}
                >
                  <Text style={[styles.typeOptionText, eventType === 'Scale' && styles.typeOptionTextActive]}>
                    Scale
                  </Text>
                </TouchableOpacity>
              </ScrollView>
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
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            
            {event && onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => { onClose(); onDelete(); }}>
                <Text style={styles.deleteButtonText}>Remove event</Text>
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
  typeSelector: {
    marginTop: 4,
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  typeOptionActive: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
  },
  typeOptionText: {
    fontSize: 14,
    color: '#999',
  },
  typeOptionTextActive: {
    color: '#000',
    fontWeight: '600',
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
