import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo } from '../lib/logRepo';

export default function HistoryScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, { count: number; avg: number }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allEvents, allLogs] = await Promise.all([
        eventRepo.list(),
        logRepo.list()
      ]);
      setEvents(allEvents);

      // Calculate stats
      const eventStats: Record<string, { count: number; avg: number }> = {};
      
      for (const event of allEvents) {
        const eventLogs = allLogs.filter(log => log.event_name === event.event_name);
        const count = eventLogs.length;
        const avg = count > 0 
          ? eventLogs.reduce((sum, log) => sum + log.value, 0) / count 
          : 0;
        
        eventStats[event.event_name] = {
          count,
          avg: Math.round(avg * 10) / 10,
        };
      }
      
      setStats(eventStats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Create an event first to see history.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Summary</Text>
      {events.map((event) => (
        <View key={event.id} style={styles.statCard}>
          <Text style={styles.eventName}>{event.event_name}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Entries:</Text>
            <Text style={styles.statValue}>{stats[event.event_name]?.count || 0}</Text>
          </View>
          {String(event.event_type) === 'scale' && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average:</Text>
              <Text style={styles.statValue}>
                {stats[event.event_name]?.avg || 0} {event.scale_label}
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});
