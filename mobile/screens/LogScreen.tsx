import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { logRepo, Log } from '../lib/logRepo';
import { eventRepo, Event } from '../lib/eventRepo';

export default function LogScreen() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allLogs, allEvents] = await Promise.all([
        logRepo.list(),
        eventRepo.list()
      ]);
      setLogs(allLogs);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (log: Log) => {
    const event = events.find(e => e.event_name === log.event_name);
    if (!event) return log.value.toString();
    
    // Handle both string 'Count' and legacy values
    const eventType = String(event.event_type);
    if (eventType === 'Count' || eventType === 'boolean' || eventType === 'true') {
      return 'Logged';
    }
    return `${log.value} ${event.scale_label || ''}`;
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

  const renderLog = ({ item }: { item: Log }) => (
    <View style={styles.logItem}>
      <View style={styles.logContent}>
        <Text style={styles.eventName}>{item.event_name}</Text>
        <Text style={styles.value}>{formatValue(item)}</Text>
      </View>
      <Text style={styles.date}>{formatDate(item.created_at)}</Text>
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
      {logs.length === 0 ? (
        <Text style={styles.emptyText}>No logs yet. Start tracking to see your history.</Text>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  logContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});
