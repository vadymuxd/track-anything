import { useState, useEffect } from 'react';
import { Log, logRepo } from '@/lib/logRepo';
import { Event, eventRepo } from '@/lib/eventRepo';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const LogTab = () => {
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
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (log: Log) => {
    const event = events.find(e => e.event_name === log.event_name);
    if (!event) return log.value.toString();
    
    if (event.event_type === 'Count') {
      return 'Logged';
    }
    return `${log.value} ${event.scale_label || ''}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Log</h2>
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Log</h2>
        <p className="text-muted-foreground text-center py-8">No logs yet. Start tracking to see your history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Log</h2>
      <div className="divide-y divide-border">
        {logs.map((log) => (
          <div key={log.id} className="py-3 flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{log.event_name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatValue(log)}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(log.created_at), 'MMM d, h:mm a')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
