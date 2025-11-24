import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo, Log } from '../lib/logRepo';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';

type Timeframe = 'week' | 'month' | 'year';

export default function HistoryScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

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

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
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
  }, []);

  const chartData = useMemo(() => {
    if (!selectedEvent) return { labels: [], datasets: [{ data: [0] }] };

    const eventLogs = logs.filter(log => log.event_name === selectedEvent);
    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return { labels: [], datasets: [{ data: [0] }] };

    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (timeframe === 'week') {
      // Last 7 days (Monday to Sunday)
      const today = new Date(now);
      const currentDay = today.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - daysFromMonday - (6 - i));
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
        
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        labels.push(dayNames[i]);
        data.push(Math.round(value * 10) / 10);
      }
    } else if (timeframe === 'month') {
      // Current month from day 1 to today
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[now.getMonth()];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
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
        
        // Show only 6 labels evenly distributed
        const interval = Math.floor(daysInMonth / 5);
        if (day === 1 || day % interval === 0 || day === daysInMonth) {
          labels.push(`${day} ${monthName}`);
        } else {
          labels.push('');
        }
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

  const screenWidth = Dimensions.get('window').width;
  
  // Dynamic bar width based on number of data points
  const barPercentage = useMemo(() => {
    const dataLength = chartData.datasets[0]?.data.length || 7;
    if (timeframe === 'week') return 0.7;
    if (timeframe === 'month') return 0.5;
    return 0.6; // year
  }, [timeframe, chartData]);
  
  const lineChartConfig = useMemo(() => ({
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, 1)`,
    strokeWidth: 2,
    fillShadowGradient: '#000',
    fillShadowGradientOpacity: 1,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 0,
    },
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
    propsForDots: {
      r: '0',
    },
    formatYLabel: (value: string) => value === '0' ? '' : value,
  }), []);

  const barChartConfig = useMemo(() => ({
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, 1)`,
    fillShadowGradientFrom: '#000000',
    fillShadowGradientFromOpacity: 1,
    fillShadowGradientTo: '#000000',
    fillShadowGradientToOpacity: 1,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 0,
    },
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
    barPercentage: barPercentage,
    formatYLabel: (value: string) => value === '0' ? '' : value,
    formatTopBarValue: (value: any) => {
      if (value === null || value === undefined || value === 0 || value === '0') {
        return '';
      }
      return value.toString();
    },
  }), [barPercentage]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Create an event first to see history.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      {/* Line Chart */}
      <View style={styles.chartCard}>

        <Text style={styles.chartTitle}>Line Chart</Text>
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={lineChartConfig}
          bezier
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLabels
          withHorizontalLabels
          fromZero
          withDots={false}
          withScrollableDot={false}
        />
      </View>

      {/* Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Bar Chart</Text>
        <BarChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={barChartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
          withInnerLines={false}
          fromZero
          showValuesOnTopOfBars
          flatColor
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
    paddingBottom: 16,
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
    paddingHorizontal: 16,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
});
