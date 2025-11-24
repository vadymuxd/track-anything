import { useState, useEffect, useMemo } from 'react';
import { storage, Event, Log } from '@/lib/storage';
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

type Timeframe = 'week' | 'month' | 'year';

export const HistoryTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('week');

  useEffect(() => {
    const allEvents = storage.getEvents();
    setEvents(allEvents);
    if (allEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(allEvents[0].event_name);
    }
  }, []);

  const chartData = useMemo(() => {
    if (!selectedEvent) return [];

    const logs = storage.getLogsByEvent(selectedEvent);
    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return [];

    const now = new Date();
    let dataPoints: { date: string; value: number }[] = [];

    if (timeframe === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayLogs = logs.filter(log => 
          format(new Date(log.created_at), 'yyyy-MM-dd') === dateStr
        );
        
        let value = 0;
        if (event.event_type === 'boolean') {
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
        const dayLogs = logs.filter(log => 
          format(new Date(log.created_at), 'yyyy-MM-dd') === dateStr
        );
        
        let value = 0;
        if (event.event_type === 'boolean') {
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
        const monthLogs = logs.filter(log => 
          format(new Date(log.created_at), 'yyyy-MM') === monthStr
        );
        
        let value = 0;
        if (event.event_type === 'boolean') {
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
  }, [selectedEvent, timeframe, events]);

  const yAxisLabel = useMemo(() => {
    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return '';
    if (event.event_type === 'boolean') return 'Count';
    return `Avg ${event.scale_label || 'Value'}`;
  }, [selectedEvent, events]);

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
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger>
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.event_name}>
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
          <h3 className="text-sm font-medium mb-4">Line Chart</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--foreground))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--foreground))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Bar Chart</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--foreground))"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
