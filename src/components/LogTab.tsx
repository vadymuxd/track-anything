import { useState, useEffect } from 'react';
import { storage, Log } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

export const LogTab = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const allLogs = storage.getLogs().sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setLogs(allLogs);
  }, []);

  const formatValue = (log: Log) => {
    const event = storage.getEvents().find(e => e.event_name === log.event_name);
    if (!event) return log.value.toString();
    
    if (event.event_type === 'boolean') {
      return 'Logged';
    }
    return `${log.value} ${event.scale_label || ''}`;
  };

  if (logs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Log</h2>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No logs yet. Start tracking to see your history.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Log</h2>
      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex justify-between items-start">
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
          </Card>
        ))}
      </div>
    </div>
  );
};
