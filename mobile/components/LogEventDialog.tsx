import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Animated, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Event, eventRepo } from '../lib/eventRepo';
import { logRepo, Log } from '../lib/logRepo';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';

interface LogEventDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  log?: Log | null;
  onDelete?: () => void;
  onCreateEventPress?: () => void;
}

export const LogEventDialog = ({ visible, onClose, onSave, log, onDelete, onCreateEventPress }: LogEventDialogProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [scaleValue, setScaleValue] = useState<number>(1);
  const [metricValueText, setMetricValueText] = useState<string>('');
  const [logDate, setLogDate] = useState<Date>(new Date());
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
      if (log) {
        // If editing a log, set the event and value from the log
        setSelectedEvent(log.event_id || '');
        setScaleValue(log.value);
        setMetricValueText(String(log.value));
        const logDateStr = (log as any).log_date as string | undefined;
        if (logDateStr) {
          const [y, m, d] = logDateStr.split('-').map(Number);
          setLogDate(new Date(y, (m || 1) - 1, d || 1));
        } else {
          setLogDate(new Date(log.created_at));
        }
      } else if (allEvents.length > 0) {
        setSelectedEvent(allEvents[0].id);
        setScaleValue(1);
        setMetricValueText('');
        setLogDate(new Date());
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!selectedEvent) return;

    const event = events.find(e => e.id === selectedEvent);
    if (!event) return;

    const eventType = String(event.event_type);
    let value: number;
    if (eventType === 'Count') {
      value = 1;
    } else if (eventType === 'Scale') {
      value = scaleValue;
    } else if (eventType === 'Metric') {
      const trimmed = metricValueText.trim();
      // Accept both '.' and ',' as decimal separators.
      const normalized = trimmed.replace(',', '.');
      const parsed = normalized === '' ? Number.NaN : Number(normalized);
      if (!Number.isFinite(parsed)) {
        alert('Please enter a valid number');
        return;
      }
      value = parsed;
    } else {
      // Fallback: treat unknown types as numeric
      value = scaleValue;
    }
    
    setSaving(true);
    try {
      const toDateOnly = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      if (log) {
        // Update existing log
        await logRepo.update(log.id, {
          event_id: event.id,
          event_name: event.event_name,
          value,
          log_date: toDateOnly(logDate),
        });
      } else {
        // Create new log
        await logRepo.create({
          event_id: event.id,
          event_name: event.event_name,
          value,
          log_date: toDateOnly(logDate),
        });
      }

      // Emit event to notify all screens to refresh
      dataEmitter.emit(DATA_UPDATED_EVENT);

      setScaleValue(1);
      setMetricValueText('');
      setLogDate(new Date());
      onSave();
      onClose();
    } catch (error) {
      console.error('Error logging event:', error);
      alert('Failed to log event');
    } finally {
      setSaving(false);
    }
  };

  const selectedEventData = events.find(e => e.id === selectedEvent);

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
            <Text style={styles.emptyText}>
              Create an event that you want to track. After at least one event is created you can start logging it.
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                onClose();
                onCreateEventPress?.();
              }}
            >
              <Text style={styles.closeButtonText}>Create New Event</Text>
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
              <Text style={styles.title}>{log ? 'Edit Log' : 'Log Event'}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {logDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={logDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setLogDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Select Event</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventPicker}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventOption,
                      selectedEvent === event.id && styles.eventOptionActive
                    ]}
                    onPress={() => setSelectedEvent(event.id)}
                    disabled={!!log}
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

            {selectedEventData?.event_type === 'Metric' && (
              <View style={styles.field}>
                <Text style={styles.label}>
                  Value{selectedEventData.scale_label ? ` (${selectedEventData.scale_label})` : ''}
                </Text>
                <TextInput
                  style={styles.input}
                  value={metricValueText}
                  onChangeText={setMetricValueText}
                  keyboardType="decimal-pad"
                  placeholder="e.g., 72.5"
                />
              </View>
            )}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleLog} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            
            {log && onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => { onClose(); onDelete(); }}>
                <Text style={styles.deleteButtonText}>Remove Log</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
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
