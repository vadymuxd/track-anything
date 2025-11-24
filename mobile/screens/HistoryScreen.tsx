import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo, Log } from '../lib/logRepo';
import { LineChart, BarChart } from 'react-native-chart-kit';

type Timeframe = 'week' | 'month' | 'year';

export default function HistoryScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [loading, setLoading] = useState(true);

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
      setLogs(allLogs);
      
      if (allEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(allEvents[0].event_name);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!selectedEvent) return { labels: [], datasets: [{ data: [0] }] };

    const eventLogs = logs.filter(log => log.event_name === selectedEvent);
    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return { labels: [], datasets: [{ data: [0] }] };

    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (timeframe === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = eventLogs.filter(log => 
          log.created_at.split('T')[0] === dateStr
        );
        
        let value = 0;
        if (String(event.event_type) === 'Count') {
          value = dayLogs.length;
        } else {
          value = dayLogs.length > 0 
            ? dayLogs.reduce((sum, log) => sum + log.value, 0) / dayLogs.length 
            : 0;
        }
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels.push(dayNames[date.getDay()]);
        data.push(Math.round(value * 10) / 10);
      }
    } else if (timeframe === 'month') {
      // Last 30 days (show every 5th day)
      for (let i = 25; i >= 0; i -= 5) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = eventLogs.filter(log => 
          log.created_at.split('T')[0] === dateStr
        );
        
        let value = 0;
        if (String(event.event_type) === 'Count') {
          value = dayLogs.length;
        } else {
          value = dayLogs.length > 0 
            ? dayLogs.reduce((sum, log) => sum + log.value, 0) / dayLogs.length 
            : 0;
        }
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labels.push(`${monthNames[date.getMonth()]} ${date.getDate()}`);
        data.push(Math.round(value * 10) / 10);
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLogs = eventLogs.filter(log => 
          log.created_at.substring(0, 7) === monthStr
        );
        
        let value = 0;
        if (String(event.event_type) === 'Count') {
          value = monthLogs.length;
        } else {
          value = monthLogs.length > 0 
            ? monthLogs.reduce((sum, log) => sum + log.value, 0) / monthLogs.length 
            : 0;
        }
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labels.push(monthNames[date.getMonth()]);
        data.push(Math.round(value * 10) / 10);
      }
    }

    return {
      labels,
      datasets: [{ data: data.length > 0 ? data : [0] }]
    };
  }, [selectedEvent, timeframe, events, logs]);

  const yAxisLabel = useMemo(() => {
    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return '';
    if (String(event.event_type) === 'Count') return 'Count';
    return `Avg ${event.scale_label || 'Value'}`;
  }, [selectedEvent, events]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Create an event first to see history.</Text>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#000',
    },
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>History</Text>

      {/* Event Selector */}
      <View style={styles.selectorCard}>
        <Text style={styles.selectorLabel}>Select Event</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventSelector}>
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventOption,
                selectedEvent === event.event_name && styles.eventOptionActive
              ]}
              onPress={() => setSelectedEvent(event.event_name)}
            >
              <Text style={[
                styles.eventOptionText,
                selectedEvent === event.event_name && styles.eventOptionTextActive
              ]}>
                {event.event_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Timeframe Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, timeframe === 'week' && styles.tabActive]}
          onPress={() => setTimeframe('week')}
        >
          <Text style={[styles.tabText, timeframe === 'week' && styles.tabTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, timeframe === 'month' && styles.tabActive]}
          onPress={() => setTimeframe('month')}
        >
          <Text style={[styles.tabText, timeframe === 'month' && styles.tabTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, timeframe === 'year' && styles.tabActive]}
          onPress={() => setTimeframe('year')}
        >
          <Text style={[styles.tabText, timeframe === 'year' && styles.tabTextActive]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Line Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Line Chart</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
          withInnerLines
          withOuterLines
          withVerticalLabels
          withHorizontalLabels
          fromZero
        />
      </View>

      {/* Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Bar Chart</Text>
        <BarChart
          data={chartData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
          withInnerLines
          fromZero
          showValuesOnTopOfBars
        />
      </View>
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyCard: {
    backgroundColor: '#f8f9fa',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  selectorCard: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  eventSelector: {
    marginBottom: 8,
  },
  eventOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
  },
  eventOptionActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  eventOptionText: {
    fontSize: 14,
    color: '#666',
  },
  eventOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
});
