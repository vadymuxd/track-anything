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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, subMonths, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { toast } from 'sonner';
import { chartPrefs, ChartType } from '@/lib/chartPrefs';

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
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
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
          date: format(date, 'MMM d'),
          value: Math.round(value * 10) / 10,
        });
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
          <ResponsiveContainer width="100%" height={250}>
            {chartTypes[selectedEventId] === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} stroke="hsl(var(--foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                <Bar dataKey="value" fill="hsl(var(--foreground))" />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} stroke="hsl(var(--foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ fill: 'hsl(var(--foreground))' }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
