import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo } from '../lib/logRepo';
import { EventDialog } from '../components/EventDialog';
import { useFocusEffect } from '@react-navigation/native';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';
import { MaterialIcons } from '@expo/vector-icons';

export default function EventsScreen({ route, navigation }: any) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});

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

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{item.event_name}</Text>
        <Text style={styles.eventMeta}>
          {logCounts[item.id] || 0} entries • {String(item.event_type)}
          {String(item.event_type) === 'Scale' && ` (1-${item.scale_max} ${item.scale_label})`}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleEdit(item)}
        style={styles.editButton}
      >
        <MaterialIcons name="edit" size={20} color="#fff" />
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
              // TODO: Will be implemented later
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.emptyText}>Coming soon...</Text>
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
    </View>
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
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 20,
  },
});
