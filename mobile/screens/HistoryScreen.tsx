import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { eventRepo, Event } from '../lib/eventRepo';
import { logRepo, Log } from '../lib/logRepo';
import { noteRepo, Note } from '../lib/noteRepo';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { dataEmitter, DATA_UPDATED_EVENT } from '../lib/eventEmitter';
import { MaterialIcons } from '@expo/vector-icons';
import { chartPrefs, ChartType as ChartPrefType } from '../lib/chartPrefs';
import { CustomBarChart } from '../components/charts/CustomBarChart';
import { CustomLineChart } from '../components/charts/CustomLineChart';
import { NoteDialog } from '../components/NoteDialog';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { TimePeriodNavigator } from '../components/TimePeriodNavigator';
import { colorPrefs, DEFAULT_COLORS } from '../lib/colorPrefs';
import { NoteHint } from '../components/NoteHint';

type Timeframe = 'week' | 'month' | 'year';

export default function HistoryScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [periodOffsets, setPeriodOffsets] = useState<Record<string, number>>({}); // Track offset per event
  const [loading, setLoading] = useState(true);
  const [chartTypes, setChartTypes] = useState<Record<string, ChartPrefType>>({});
  const [chartColors, setChartColors] = useState<Record<string, string>>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [hintNote, setHintNote] = useState<Note | null>(null);
  const [hintPosition, setHintPosition] = useState<{ x: number; y: number } | null>(null);
  const navigation = useNavigation();

  const loadData = async () => {
    try {
      const [allEvents, allLogs, allNotes] = await Promise.all([
        eventRepo.list(),
        logRepo.list(),
        noteRepo.list()
      ]);
      setEvents(allEvents);
      setLogs(allLogs);
      setNotes(allNotes);
      
      // Initialize chart types for all events (use event.id as key)
      const initialChartTypes: Record<string, ChartPrefType> = {};
      allEvents.forEach(event => {
        if (!(event.id in chartTypes)) {
          initialChartTypes[event.id] = 'line';
        }
      });
      // Load persisted prefs and merge (prefs override defaults)
      const prefs = await chartPrefs.getAll();
      setChartTypes(prev => ({ ...prev, ...initialChartTypes, ...prefs }));
      
      // Load persisted colors
      const colorPreferences = await colorPrefs.getAll();
      const initialColors: Record<string, string> = {};
      allEvents.forEach(event => {
        initialColors[event.id] = colorPreferences[event.id] || DEFAULT_COLORS[0];
      });
      setChartColors(initialColors);
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
    const next = (chartTypes[eventId] === 'line' ? 'bar' : 'line') as ChartPrefType;
    setChartTypes(prev => ({ ...prev, [eventId]: next }));
    // persist
    chartPrefs.set(eventId, next).catch(() => {});
  };

  // Reset period offsets when timeframe changes
  useEffect(() => {
    setPeriodOffsets({});
  }, [timeframe]);

  const getYDomainForEvent = (event: Event, data: number[]) => {
    const eventType = String(event.event_type);

    if (eventType === 'Scale' && event.scale_max && event.scale_max > 0) {
      return { yMin: 0, yMax: event.scale_max };
    }

    const finite = data.filter((v) => Number.isFinite(v));
    if (!finite.length) {
      return { yMin: 0, yMax: 1 };
    }

    const autoMin = Math.min(0, ...finite);
    const autoMax = Math.max(...finite);

    if (autoMax === autoMin) {
      return { yMin: autoMin, yMax: autoMin + 1 };
    }

    return { yMin: autoMin, yMax: autoMax };
  };

  const getChartDataForEvent = (
    eventId: string,
    offset: number = 0,
    options?: { interpolateGaps?: boolean }
  ): {
    labels: string[];
    datasets: [{ data: number[] }];
    dateRanges: { start: Date; end: Date }[];
    domainValues: number[];
  } => {
    const event = events.find(e => e.id === eventId);
    const eventLogs = logs.filter(log => {
      if ((log as any).event_id) return (log as any).event_id === eventId;
      return log.event_name === event?.event_name;
    });
    if (!event) return { labels: [], datasets: [{ data: [0] }], dateRanges: [], domainValues: [0] };

    const toDateOnly = (iso: string) => iso.substring(0, 10);
    const getLogDateStr = (log: Log) => ((log as any).log_date as string | undefined) || toDateOnly(log.created_at);
    const parseDateOnly = (ymd: string) => {
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    };

    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];
    const dateRanges: { start: Date; end: Date }[] = [];

    const eventType = String(event.event_type);
    const isCount = eventType === 'Count';
    const isScale = eventType === 'Scale';
    const shouldRound = isScale;
    const shouldInterpolate = Boolean(options?.interpolateGaps) && !isCount;

    const formatDateOnly = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const parseYmdToDayIndex = (ymd: string) => {
      const [y, m, d] = ymd.split('-').map(Number);
      return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000);
    };

    const parseYmToMonthIndex = (ym: string) => {
      const [y, m] = ym.split('-').map(Number);
      return (y || 0) * 12 + ((m || 1) - 1);
    };

    const getWeekStartMondayKey = (ymd: string) => {
      const [y, m, d] = ymd.split('-').map(Number);
      const utc = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
      // JS: 0=Sun..6=Sat. We want Monday as start.
      const day = utc.getUTCDay();
      const delta = day === 0 ? -6 : 1 - day;
      utc.setUTCDate(utc.getUTCDate() + delta);
      const yyyy = utc.getUTCFullYear();
      const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(utc.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const getBucketKeyForLogDate = (ymd: string) => {
      if (timeframe === 'week') return ymd;
      if (timeframe === 'month') return getWeekStartMondayKey(ymd);
      // year
      return ymd.substring(0, 7);
    };

    const bucketKeyIndex = (key: string) => {
      if (timeframe === 'year') return parseYmToMonthIndex(key);
      return parseYmdToDayIndex(key);
    };

    // Build full-history bucket values for this event (not limited to current view)
    const agg = new Map<string, { count: number; sum: number }>();
    for (const log of eventLogs) {
      const ymd = getLogDateStr(log);
      const key = getBucketKeyForLogDate(ymd);
      const cur = agg.get(key) || { count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += log.value;
      agg.set(key, cur);
    }

    const valueByKey = new Map<string, number>();
    for (const [key, a] of agg.entries()) {
      valueByKey.set(key, isCount ? a.count : a.sum / a.count);
    }

    // Y-domain should be based on the full history for this timeframe bucketization,
    // not just the currently visible window.
    const domainValues = Array.from(valueByKey.values());

    const knownKeys = Array.from(valueByKey.keys()).sort();
    const firstKnownKey = knownKeys[0];
    const lastKnownKey = knownKeys[knownKeys.length - 1];

    const lowerBound = (arr: string[], x: string) => {
      let lo = 0;
      let hi = arr.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] < x) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };

    const getInterpolatedValueForKey = (key: string): number => {
      const direct = valueByKey.get(key);
      if (direct !== undefined) return direct;

      // For bars (or non-interpolated) we want missing values as 0.
      if (!shouldInterpolate) return 0;

      // If we have no known points, there's no line.
      if (!knownKeys.length) return Number.NaN;

      // Outside global first/last: no line.
      if (key < firstKnownKey || key > lastKnownKey) return Number.NaN;

      const idx = lowerBound(knownKeys, key);
      const prevKey = idx > 0 ? knownKeys[idx - 1] : undefined;
      const nextKey = idx < knownKeys.length ? knownKeys[idx] : undefined;

      if (!prevKey || !nextKey) return Number.NaN;

      const prevVal = valueByKey.get(prevKey);
      const nextVal = valueByKey.get(nextKey);
      if (prevVal === undefined || nextVal === undefined) return Number.NaN;

      const prevI = bucketKeyIndex(prevKey);
      const nextI = bucketKeyIndex(nextKey);
      const curI = bucketKeyIndex(key);
      const span = nextI - prevI;
      if (span <= 0) return Number.NaN;

      const t = (curI - prevI) / span;
      return prevVal + (nextVal - prevVal) * t;
    };

    if (timeframe === 'week') {
      // Last 7 days (Monday to Sunday) with offset
      const today = new Date(now);
      today.setDate(today.getDate() + offset * 7); // Apply offset
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - daysFromMonday + i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const dateStr = formatDateOnly(date);
        const key = dateStr;
        const v = getInterpolatedValueForKey(key);
        
        labels.push(dayNames[i]);
        data.push(v);
        dateRanges.push({ start: startOfDay, end: endOfDay });
      }
    } else if (timeframe === 'month') {
      // Last 2 full months, grouped by weeks with offset
      const endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1); // End of 2nd month
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1); // Start of 1st month

      // find first Monday on/after startDate
      const startDay = startDate.getDay();
      const daysToAdd = startDay === 0 ? 1 : (startDay === 1 ? 0 : 8 - startDay);
      let cursor = new Date(startDate);
      cursor.setDate(cursor.getDate() + daysToAdd);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      while (cursor < endDate) {
        const weekStart = new Date(cursor);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const key = formatDateOnly(weekStart);
        const v = getInterpolatedValueForKey(key);

        if (weekEnd >= startDate && weekStart < endDate) {
          const monthName = monthNames[weekStart.getMonth()];
          const day = weekStart.getDate();
          labels.push(`${monthName} ${day}`);
          data.push(v);
          dateRanges.push({ start: new Date(weekStart), end: new Date(weekEnd) });
        }

        cursor.setDate(cursor.getDate() + 7);
      }
    } else {
      // Last 12 months with offset
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i + offset * 12); // Apply offset in years
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
        const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(startOfNextMonth.getTime() - 1);

        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const v = getInterpolatedValueForKey(monthStr);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labels.push(monthNames[date.getMonth()]);
        data.push(v);
        dateRanges.push({ start: startOfMonth, end: endOfMonth });
      }
    }

    const finalData = shouldRound
      ? data.map(v => (Number.isFinite(v) ? Math.round(v * 10) / 10 : v))
      : data;

    const finalDomainValues = shouldRound
      ? domainValues.map(v => (Number.isFinite(v) ? Math.round(v * 10) / 10 : v))
      : domainValues;

    return {
      labels,
      datasets: [{ data: finalData.length > 0 ? finalData : [0] }],
      dateRanges,
      domainValues: finalDomainValues.length > 0 ? finalDomainValues : [0]
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

  const handleNotePress = (note: Note, position: { x: number; y: number }) => {
    setHintNote(note);
    setHintPosition(position);
  };

  const handleNoteDialogClose = () => {
    setIsNoteDialogOpen(false);
    setSelectedNote(null);
    setHintNote(null);
    setHintPosition(null);
  };

  const handleNoteSave = () => {
    loadData();
    handleNoteDialogClose();
  };

  const handleNoteDelete = async (id: string) => {
    try {
      await noteRepo.delete(id);
      loadData();
      handleNoteDialogClose();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        const periodOffset = periodOffsets[event.id] || 0;
        const isBarChart = chartTypes[event.id] === 'bar';
        const chartColor = chartColors[event.id] || DEFAULT_COLORS[0];
        const { labels, datasets, dateRanges, domainValues } = getChartDataForEvent(event.id, periodOffset, {
          interpolateGaps: !isBarChart && String(event.event_type) !== 'Count',
        });
        const chartData = { labels, datasets };
        const yDomain = getYDomainForEvent(event, domainValues);

        return (
          <View key={event.id} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>{event.event_name}</Text>
              <View style={styles.chartControls}>
                <TimePeriodNavigator
                  timeframe={timeframe}
                  offset={periodOffset}
                  onOffsetChange={(newOffset) => 
                    setPeriodOffsets(prev => ({ ...prev, [event.id]: newOffset }))
                  }
                />
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
            </View>

            <View>
              {isBarChart ? (
                <CustomBarChart 
                  data={chartData} 
                  width={chartWidth}
                  barPercentage={barPercentage}
                  color={chartColor}
                  yMin={yDomain.yMin}
                  yMax={yDomain.yMax}
                />
              ) : (
                <CustomLineChart 
                  data={chartData} 
                  width={chartWidth}
                  color={chartColor}
                  yMin={yDomain.yMin}
                  yMax={yDomain.yMax}
                  notes={notes}
                  eventId={event.id}
                  onNotePress={handleNotePress}
                  dateRanges={dateRanges}
                />
              )}
              {/* Show NoteHint if this event's note is selected */}
              {hintNote && hintNote.event_id === event.id && hintPosition && (
                <NoteHint
                  note={hintNote}
                  x={hintPosition.x}
                  y={hintPosition.y}
                  onClose={() => {
                    setHintNote(null);
                    setHintPosition(null);
                  }}
                />
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>

    <NoteDialog
      visible={isNoteDialogOpen}
      onClose={handleNoteDialogClose}
      note={selectedNote}
      onSave={handleNoteSave}
      onDelete={selectedNote ? () => handleNoteDelete(selectedNote.id) : undefined}
    />
    </GestureHandlerRootView>
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
    flex: 1,
  },
  chartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
});
