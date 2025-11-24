import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo, Log } from '../lib/logRepo';
import { EventDialog } from '../components/EventDialog';
import { useFocusEffect } from '@react-navigation/native';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';

export default function EventsScreen({ route, navigation }: any) {
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const [data, allLogs] = await Promise.all([
        eventRepo.list(),
        logRepo.list()
      ]);
      setEvents(data);
      setLogs(allLogs);
      
      // Load log counts
      const counts: Record<string, number> = {};
      for (const event of data) {
        const logs = await logRepo.listByEventName(event.event_name);
        counts[event.event_name] = logs.length;
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
    setMenuVisible(null);
  };

  const handleSave = () => {
    loadEvents();
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const formatValue = (log: Log) => {
    const event = events.find(e => e.event_name === log.event_name);
    if (!event) return log.value.toString();
    
    const eventType = String(event.event_type);
    if (eventType === 'Count') {
      return '1';
    }
    return `${log.value}${event.scale_label ? ' ' + event.scale_label : ''}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{item.event_name}</Text>
        <Text style={styles.eventMeta}>
          {logCounts[item.event_name] || 0} entries • {String(item.event_type)}
          {String(item.event_type) === 'Scale' && ` (1-${item.scale_max} ${item.scale_label})`}
        </Text>
      </View>
      <View>
        <TouchableOpacity 
          onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
        {menuVisible === item.id && (
          <View style={styles.menu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleEdit(item)}
            >
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderLog = ({ item }: { item: Log }) => {
    console.log('Rendering log:', item);
    return (
      <View style={styles.logItem}>
        <View style={styles.logContent}>
          <Text style={styles.logText}>{item.event_name}, {formatValue(item)}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {events.length === 0 ? (
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
            
            {/* Separator */}
            <View style={styles.separator} />
            
            {/* Log Section Header */}
            <Text style={styles.logHeader}>Log</Text>
          </>
        }
        data={logs}
        renderItem={renderLog}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs yet. Start tracking to see your history.</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.logSeparator} />}
      />

      <EventDialog
        visible={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: '#000',
    fontWeight: '300',
  },
  list: {
    paddingBottom: 12,
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
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  menuItemTextDanger: {
    color: '#dc3545',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
  separator: {
    height: 0,
    marginVertical: 24,
  },
  logHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  logContent: {
    flex: 1,
    marginRight: 12,
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
    flexShrink: 0,
  },
  logText: {
    fontSize: 16,
    color: '#000',
  },
  logSeparator: {
    height: 1,
    backgroundColor: '#e9ecef',
  },
});
