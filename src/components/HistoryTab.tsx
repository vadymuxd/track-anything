import { useState, useEffect, useMemo } from 'react';
import { Event, eventRepo } from '@/lib/eventRepo';
import { Log, logRepo } from '@/lib/logRepo';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, subMonths, subWeeks, startOfWeek, startOfMonth, startOfYear, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { chartPrefs, ChartType } from '@/lib/chartPrefs';
import { CustomBarChart } from '@/components/charts/CustomBarChart';
import { CustomLineChart } from '@/components/charts/CustomLineChart';

type Timeframe = 'week' | 'month' | 'year';

export const HistoryTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [loading, setLoading] = useState(true);
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({});

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
      if (allEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(allEvents[0].id);
      }
      // load saved chart prefs
      try {
        const prefs = chartPrefs.getAll();
        setChartTypes(prev => ({ ...prev, ...prefs }));
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!selectedEventId) return [];

    const event = events.find(e => e.id === selectedEventId);
    const eventLogs = logs.filter(log => {
      // Prefer event_id match when available, fall back to event_name for older/local logs
      if ((log as any).event_id) return (log as any).event_id === selectedEventId;
      return log.event_name === event?.event_name;
    });
    if (!event) return [];

    const now = new Date();
    let dataPoints: { date: string; value: number }[] = [];

    if (timeframe === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayLogs = eventLogs.filter(log => 
          format(new Date(log.created_at), 'yyyy-MM-dd') === dateStr
        );
        
        let value = 0;
        if (event.event_type === 'Count') {
          value = dayLogs.length;
        } else {
          value = dayLogs.length > 0 
            ? dayLogs.reduce((sum, log) => sum + log.value, 0) / dayLogs.length 
            : 0;
        }
        
        dataPoints.push({
          date: format(date, 'EEE'),
          value: Math.round(value * 10) / 10,
        });
      }
    } else if (timeframe === 'month') {
      // Last 2 full months, grouped by weeks
      const endDate = startOfMonth(now); // start of current month
      const startDate = subMonths(endDate, 2); // start of month two months ago

      // find first Monday on/after startDate
      let cursor = startOfWeek(startDate, { weekStartsOn: 1 });
      if (cursor < startDate) {
        cursor = subDays(cursor, -7); // move to next Monday
      }

      const weekStarts: Date[] = [];
      while (cursor < endDate) {
        weekStarts.push(cursor);
        cursor = subWeeks(cursor, -1); // move forward one week
      }

      for (const weekStart of weekStarts) {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        const weekLogs = eventLogs.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= weekStart && logDate <= weekEnd;
        });
        
        let value = 0;
        if (event.event_type === 'Count') {
          value = weekLogs.length;
        } else {
          value = weekLogs.length > 0 
            ? weekLogs.reduce((sum, log) => sum + log.value, 0) / weekLogs.length 
            : 0;
        }
        
        if (weekEnd >= startDate && weekStart < endDate) {
          dataPoints.push({
            date: format(weekStart, 'MMM d'),
            value: Math.round(value * 10) / 10,
          });
        }
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStr = format(date, 'yyyy-MM');
        const monthLogs = eventLogs.filter(log => 
          format(new Date(log.created_at), 'yyyy-MM') === monthStr
        );
        
        let value = 0;
        if (event.event_type === 'Count') {
          value = monthLogs.length;
        } else {
          value = monthLogs.length > 0 
            ? monthLogs.reduce((sum, log) => sum + log.value, 0) / monthLogs.length 
            : 0;
        }
        
        dataPoints.push({
          date: format(date, 'MMM'),
          value: Math.round(value * 10) / 10,
        });
      }
    }

    return dataPoints;
  }, [selectedEventId, timeframe, events, logs]);

  const yAxisLabel = useMemo(() => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return '';
    if (event.event_type === 'Count') return 'Count';
    return `Avg ${event.scale_label || 'Value'}`;
  }, [selectedEventId, events]);


  const toggleChartType = (eventId: string) => {
    const nextType: ChartType = chartTypes[eventId] === 'bar' ? 'line' : 'bar';
    setChartTypes(prev => ({ ...prev, [eventId]: nextType }));
    try {
      chartPrefs.set(eventId, nextType);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">History</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Create an event first to see history.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">History</h2>
      
      <div className="space-y-4">
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.event_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">{chartTypes[selectedEventId] === 'bar' ? 'Bar Chart' : 'Line Chart'}</h3>
            <div>
              <button
                className="px-2 py-1 rounded bg-muted text-sm"
                onClick={() => toggleChartType(selectedEventId)}
              >
                Switch to {chartTypes[selectedEventId] === 'bar' ? 'Line' : 'Bar'}
              </button>
            </div>
          </div>
          {chartTypes[selectedEventId] === 'bar' ? (
            <CustomBarChart data={chartData} yAxisLabel={yAxisLabel} />
          ) : (
            <CustomLineChart data={chartData} yAxisLabel={yAxisLabel} />
          )}
        </Card>
      </div>
    </div>
  );
};
