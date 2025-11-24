import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo } from '../lib/logRepo';

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const data = await eventRepo.list();
      setEvents(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await eventRepo.delete(id);
      loadEvents();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete event');
    }
  };

  const getEntryCount = async (eventName: string) => {
    const logs = await logRepo.listByEventName(eventName);
    return logs.length;
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{item.event_name}</Text>
        <Text style={styles.eventMeta}>
          {String(item.event_type)}
          {String(item.event_type) === 'Scale' && ` (1-${item.scale_max} ${item.scale_label})`}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleDelete(item.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {events.length === 0 ? (
        <Text style={styles.emptyText}>No events yet. Create your first event to get started.</Text>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  list: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#dc3545',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});
