import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { logRepo, Log } from '../lib/logRepo';
import { eventRepo, Event } from '../lib/eventRepo';
import { useFocusEffect } from '@react-navigation/native';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';
import { LogEventDialog } from '../components/LogEventDialog';
import { MonthNavigator } from '../components/MonthNavigator';

export default function LogsScreen() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const loadData = async () => {
    try {
      // Calculate date range for the selected month
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      const [monthLogs, allEvents] = await Promise.all([
        logRepo.listByDateRange(startDateStr, endDateStr),
        eventRepo.list()
      ]);
      setLogs(monthLogs);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [monthOffset])
  );

  // Listen for data updates from anywhere in the app
  useEffect(() => {
    const handleDataUpdate = () => {
      loadData();
    };

    dataEmitter.on(DATA_UPDATED_EVENT, handleDataUpdate);

    return () => {
      dataEmitter.off(DATA_UPDATED_EVENT, handleDataUpdate);
    };
  }, [monthOffset]);

  const formatValue = (log: Log) => {
    const event = events.find(e => (log as any).event_id ? e.id === (log as any).event_id : e.event_name === log.event_name);
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

  const handleLogPress = (log: Log) => {
    setSelectedLog(log);
    setDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedLog) return;
    
    try {
      await logRepo.delete(selectedLog.id);
      dataEmitter.emit(DATA_UPDATED_EVENT);
      setDialogVisible(false);
      setSelectedLog(null);
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Failed to delete log');
    }
  };

  const renderLog = ({ item }: { item: Log }) => (
    <TouchableOpacity style={styles.logItem} onPress={() => handleLogPress(item)}>
      <View style={styles.logContent}>
        <Text style={styles.eventName}>{(events.find(e => (item as any).event_id ? e.id === (item as any).event_id : e.event_name === item.event_name) || { event_name: item.event_name }).event_name}</Text>
        <Text style={styles.value}>{formatValue(item)}</Text>
      </View>
      <Text style={styles.date}>{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
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
      <View style={styles.navigatorContainer}>
        <MonthNavigator
          offset={monthOffset}
          onOffsetChange={setMonthOffset}
        />
      </View>
      
      <View style={styles.listContainer}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs for this month.</Text>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderLog}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
      
      <LogEventDialog
        visible={dialogVisible}
        onClose={() => {
          setDialogVisible(false);
          setSelectedLog(null);
        }}
        onSave={() => {
          setDialogVisible(false);
          setSelectedLog(null);
          loadData();
        }}
        log={selectedLog}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navigatorContainer: {
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
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
