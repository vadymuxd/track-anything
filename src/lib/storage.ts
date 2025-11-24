export interface Event {
  id: string;
  created_at: string;
  event_name: string;
  event_type: 'boolean' | 'scale';
  scale_label?: string;
  scale_max?: number;
}

export interface Log {
  id: string;
  created_at: string;
  event_name: string;
  value: number;
}

const EVENTS_KEY = 'track_anything_events';
const LOGS_KEY = 'track_anything_logs';

export const storage = {
  // Events
  getEvents: (): Event[] => {
    const data = localStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveEvents: (events: Event[]) => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  },
  
  addEvent: (event: Omit<Event, 'id' | 'created_at'>) => {
    const events = storage.getEvents();
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    events.push(newEvent);
    storage.saveEvents(events);
    return newEvent;
  },
  
  updateEvent: (id: string, updates: Partial<Event>) => {
    const events = storage.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      storage.saveEvents(events);
      return events[index];
    }
    return null;
  },
  
  deleteEvent: (id: string) => {
    const events = storage.getEvents().filter(e => e.id !== id);
    storage.saveEvents(events);
    // Also delete all logs for this event
    const logs = storage.getLogs().filter(l => l.event_name !== storage.getEvents().find(e => e.id === id)?.event_name);
    storage.saveLogs(logs);
  },
  
  // Logs
  getLogs: (): Log[] => {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveLogs: (logs: Log[]) => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  },
  
  addLog: (log: Omit<Log, 'id' | 'created_at'>) => {
    const logs = storage.getLogs();
    const newLog: Log = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    logs.push(newLog);
    storage.saveLogs(logs);
    return newLog;
  },
  
  getLogsByEvent: (eventName: string): Log[] => {
    return storage.getLogs().filter(log => log.event_name === eventName);
  },
};
