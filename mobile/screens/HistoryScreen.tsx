import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo, Log } from '../lib/logRepo';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';
import { MaterialIcons } from '@expo/vector-icons';
import { chartPrefs, ChartType } from '../lib/chartPrefs';
import { CustomBarChart } from '../components/charts/CustomBarChart';
import { CustomLineChart } from '../components/charts/CustomLineChart';

type Timeframe = 'week' | 'month' | 'year';
type ChartType = 'line' | 'bar';

export default function HistoryScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [loading, setLoading] = useState(true);
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({});
  const navigation = useNavigation();

  const loadData = async () => {
    try {
      const [allEvents, allLogs] = await Promise.all([
        eventRepo.list(),
        logRepo.list()
      ]);
      setEvents(allEvents);
      setLogs(allLogs);
      
      // Initialize chart types for all events (use event.id as key)
      const initialChartTypes: Record<string, ChartType> = {};
      allEvents.forEach(event => {
        if (!(event.id in chartTypes)) {
          initialChartTypes[event.id] = 'line';
        }
      });
      // Load persisted prefs and merge (prefs override defaults)
      const prefs = await chartPrefs.getAll();
      setChartTypes(prev => ({ ...prev, ...initialChartTypes, ...prefs }));
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

  const toggleChartType = (eventId: string) => {
    const next = (chartTypes[eventId] === 'line' ? 'bar' : 'line') as ChartType;
    setChartTypes(prev => ({ ...prev, [eventId]: next }));
    // persist
    chartPrefs.set(eventId, next).catch(() => {});
  };

  const getChartDataForEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    const eventLogs = logs.filter(log => {
      if ((log as any).event_id) return (log as any).event_id === eventId;
      return log.event_name === event?.event_name;
    });
    if (!event) return { labels: [], datasets: [{ data: [0] }] };

    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (timeframe === 'week') {
      // Last 7 days (Monday to Sunday)
      const today = new Date(now);
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - daysFromMonday + i);
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
        
        labels.push(dayNames[i]);
        data.push(Math.round(value * 10) / 10);
      }
    } else if (timeframe === 'month') {
      // Last 2 full months, grouped by weeks
      const endDate = new Date(now.getFullYear(), now.getMonth(), 1); // start of current month
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1); // start of month two months ago

      // find first Monday on/after startDate
      const startDay = startDate.getDay();
      const daysToAdd = startDay === 0 ? 1 : (startDay === 1 ? 0 : 8 - startDay);
      let cursor = new Date(startDate);
      cursor.setDate(cursor.getDate() + daysToAdd);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      while (cursor < endDate) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekLogs = eventLogs.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= weekStart && logDate <= weekEnd;
        });

        let value = 0;
        if (String(event.event_type) === 'Count') {
          value = weekLogs.length;
        } else {
          value = weekLogs.length > 0 
            ? weekLogs.reduce((sum, log) => sum + log.value, 0) / weekLogs.length 
            : 0;
        }

        if (weekEnd >= startDate && weekStart < endDate) {
          const monthName = monthNames[weekStart.getMonth()];
          const day = weekStart.getDate();
          labels.push(`${monthName} ${day}`);
          data.push(Math.round(value * 10) / 10);
        }

        cursor.setDate(cursor.getDate() + 7);
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
  };

  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 32; // Standard 16px padding on each side
  
  // Dynamic bar percentage based on timeframe
  const barPercentage = useMemo(() => {
    if (timeframe === 'week') return 1.05;
    if (timeframe === 'month') return 0.5;
    return 0.6; // year
  }, [timeframe]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

      {/* Charts for all events */}
      {events.map((event) => {
        const chartData = getChartDataForEvent(event.id);
        const isBarChart = chartTypes[event.id] === 'bar';
        
        return (
          <View key={event.id} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>{event.event_name}</Text>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => toggleChartType(event.id)}
              >
                <MaterialIcons 
                  name={isBarChart ? "show-chart" : "bar-chart"} 
                  size={20} 
                  color="#333" 
                />
              </TouchableOpacity>
            </View>
            
            {isBarChart ? (
              <CustomBarChart 
                data={chartData} 
                width={chartWidth}
                barPercentage={barPercentage}
              />
            ) : (
              <CustomLineChart 
                data={chartData} 
                width={chartWidth}
              />
            )}
          </View>
        );
      })}
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
});
