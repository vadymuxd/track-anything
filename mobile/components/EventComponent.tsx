import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Event } from '../lib/eventRepo';

interface EventComponentProps {
  event: Event;
  logCount: number;
  onEdit: () => void;
}

export const EventComponent = ({ event, logCount, onEdit }: EventComponentProps) => {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{event.event_name}</Text>
        <Text style={styles.eventMeta}>
          {logCount} entries • {String(event.event_type)}
          {String(event.event_type) === 'Scale' && ` (1-${event.scale_max} ${event.scale_label})`}
        </Text>
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.editButton}>
        <MaterialIcons name="edit" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  eventMeta: {
    fontSize: 14,
    color: '#ccc',
  },
  editButton: {
    padding: 8,
  },
});
