import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Event } from './eventRepo';
import type { Log } from './logRepo';
import type { Note } from './noteRepo';

// Storage keys
const STORAGE_KEYS = {
  EVENTS: '@track-anything:events',
  LOGS: '@track-anything:logs',
  NOTES: '@track-anything:notes',
  LAST_SYNC: '@track-anything:last-sync',
};

export interface CachedData<T> {
  data: T[];
  timestamp: number;
}

export const localStorage = {
  // Events
  async getEvents(): Promise<Event[] | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!cached) return null;
      const parsed: CachedData<Event> = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      console.error('Error reading events from local storage:', error);
      return null;
    }
  },

  async setEvents(events: Event[]): Promise<void> {
    try {
      const cached: CachedData<Event> = {
        data: events,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(cached));
    } catch (error) {
      console.error('Error saving events to local storage:', error);
    }
  },

  // Logs
  async getLogs(): Promise<Log[] | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
      if (!cached) return null;
      const parsed: CachedData<Log> = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      console.error('Error reading logs from local storage:', error);
      return null;
    }
  },

  async setLogs(logs: Log[]): Promise<void> {
    try {
      const cached: CachedData<Log> = {
        data: logs,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(cached));
    } catch (error) {
      console.error('Error saving logs to local storage:', error);
    }
  },

  // Notes
  async getNotes(): Promise<Note[] | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      if (!cached) return null;
      const parsed: CachedData<Note> = JSON.parse(cached);
      return parsed.data;
    } catch (error) {
      console.error('Error reading notes from local storage:', error);
      return null;
    }
  },

  async setNotes(notes: Note[]): Promise<void> {
    try {
      const cached: CachedData<Note> = {
        data: notes,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(cached));
    } catch (error) {
      console.error('Error saving notes to local storage:', error);
    }
  },

  // Last sync timestamp
  async getLastSync(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Error reading last sync timestamp:', error);
      return null;
    }
  },

  async setLastSync(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('Error saving last sync timestamp:', error);
    }
  },

  // Clear all cached data (useful for sign out)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EVENTS,
        STORAGE_KEYS.LOGS,
        STORAGE_KEYS.NOTES,
        STORAGE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  },
};
