import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Event } from '../lib/eventRepo';

interface EventComponentProps {
  event: Event;
  logCount: number;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  color?: string;
}

export const EventComponent = ({ 
  event, 
  logCount, 
  onEdit, 
  onMoveUp, 
  onMoveDown, 
  canMoveUp, 
  canMoveDown, 
  color = '#000' 
}: EventComponentProps) => {
  return (
    <TouchableOpacity 
      style={[styles.eventCard, { backgroundColor: color }]}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{event.event_name}</Text>
        <Text style={styles.eventMeta}>
          {logCount} entries • {String(event.event_type)}
          {String(event.event_type) === 'Scale' && ` (1-${event.scale_max} ${event.scale_label})`}
        </Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onMoveUp();
          }} 
          style={[styles.controlButton, !canMoveUp && styles.controlButtonDisabled]}
          disabled={!canMoveUp}
        >
          <MaterialIcons name="keyboard-arrow-up" size={24} color="rgba(255, 255, 255, 0.5)" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onMoveDown();
          }} 
          style={[styles.controlButton, !canMoveDown && styles.controlButtonDisabled]}
          disabled={!canMoveDown}
        >
          <MaterialIcons name="keyboard-arrow-down" size={24} color="rgba(255, 255, 255, 0.5)" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
    color: 'rgba(255, 255, 255, 0.5)',
  },
  controls: {
    flexDirection: 'column',
    gap: 4,
  },
  controlButton: {
    padding: 4,
  },
  controlButtonDisabled: {
    opacity: 0.2,
  },
});
