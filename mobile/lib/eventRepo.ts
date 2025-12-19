import { supabase } from './supabase';
import type { Database } from './database.types';
import { positionPrefs } from './positionPrefs';
import { colorPrefs } from './colorPrefs';
import { localStorage } from './localStorage';
import { dataEmitter, DATA_UPDATED_EVENT } from './eventEmitter';

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

const EVENTS_REFRESH_COOLDOWN_MS = 10_000;
let eventsRefreshInFlight: Promise<void> | null = null;
let eventsLastRefreshStartedAt = 0;

export const eventRepo = {
  async list(): Promise<Event[]> {
    const [cachedEvents, localPositions, localColors] = await Promise.all([
      localStorage.getEvents(),
      positionPrefs.getAll(),
      colorPrefs.getAll(),
    ]);

    const applyLocalPrefs = (events: Event[]) => {
      const eventsWithLocalPrefs = events.map(event => {
        const localPos = localPositions[event.id];
        const localColor = localColors[event.id];
        return {
          ...event,
          position: localPos !== undefined ? localPos : event.position,
          color: localColor !== undefined ? localColor : event.color,
        };
      });
      eventsWithLocalPrefs.sort((a, b) => a.position - b.position);
      return eventsWithLocalPrefs;
    };

    const refreshFromBackend = () => {
      if (eventsRefreshInFlight) return eventsRefreshInFlight;
      eventsLastRefreshStartedAt = Date.now();
      eventsRefreshInFlight = (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true });

        if (error) throw error;

        const events = applyLocalPrefs(data || []);
        await localStorage.setEvents(events);
        dataEmitter.emit(DATA_UPDATED_EVENT);
      })().finally(() => {
        eventsRefreshInFlight = null;
      });

      return eventsRefreshInFlight;
    };

    const maybeRefreshInBackground = () => {
      const now = Date.now();
      if (now - eventsLastRefreshStartedAt < EVENTS_REFRESH_COOLDOWN_MS) return;
      void refreshFromBackend().catch(err => {
        console.error('[eventRepo.list] Background refresh failed:', err);
      });
    };

    // If we have cached data, return it immediately and refresh in background.
    if (cachedEvents) {
      maybeRefreshInBackground();
      return applyLocalPrefs(cachedEvents);
    }

    // No cache available: block on backend.
    await refreshFromBackend();
    const fresh = await localStorage.getEvents();
    return applyLocalPrefs(fresh || []);
  },

  async getById(id: string): Promise<Event | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByName(eventName: string): Promise<Event | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_name', eventName)
      .eq('user_id', user?.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(event: EventInsert): Promise<Event> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('events')
      .insert({ ...event, user_id: user?.id } as any)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update local storage cache
    const cachedEvents = await localStorage.getEvents();
    if (cachedEvents) {
      await localStorage.setEvents([...cachedEvents, data]);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
    
    return data;
  },

  async update(id: string, updates: EventUpdate): Promise<Event> {
    // fetch current event to detect name changes
    const current = await eventRepo.getById(id);

    const { data, error } = await supabase
      .from('events')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // if the event name changed, update logs to reflect the new name
    try {
      if ((updates as any).event_name && current && current.event_name !== (updates as any).event_name) {
        await supabase
          .from('logs')
          .update({ event_name: (updates as any).event_name, updated_at: new Date().toISOString() })
          .eq('event_id', id);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to backfill logs with new event_name:', e);
    }

    // Update local storage cache
    const cachedEvents = await localStorage.getEvents();
    if (cachedEvents) {
      const updatedEvents = cachedEvents.map(e => e.id === id ? data : e);
      await localStorage.setEvents(updatedEvents);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Update local storage cache
    const cachedEvents = await localStorage.getEvents();
    if (cachedEvents) {
      const updatedEvents = cachedEvents.filter(e => e.id !== id);
      await localStorage.setEvents(updatedEvents);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
  },

  async swapPositions(eventId1: string, eventId2: string): Promise<void> {
    const event1 = await this.getById(eventId1);
    const event2 = await this.getById(eventId2);

    if (!event1 || !event2) throw new Error('Events not found');

    // Update local storage first for instant UI update
    await positionPrefs.set(eventId1, event2.position);
    await positionPrefs.set(eventId2, event1.position);

    // Swap positions in database in the background (don't await)
    const tempPosition = event1.position;
    this.update(eventId1, { position: event2.position }).catch(err => 
      console.error('Failed to update position in DB:', err)
    );
    this.update(eventId2, { position: tempPosition }).catch(err => 
      console.error('Failed to update position in DB:', err)
    );

    dataEmitter.emit(DATA_UPDATED_EVENT);
  },

  async moveUp(eventId: string, allEvents: Event[]): Promise<void> {
    const currentIndex = allEvents.findIndex(e => e.id === eventId);
    if (currentIndex <= 0) return; // Already at top or not found

    const currentEvent = allEvents[currentIndex];
    const previousEvent = allEvents[currentIndex - 1];
    
    await this.swapPositions(currentEvent.id, previousEvent.id);
  },

  async moveDown(eventId: string, allEvents: Event[]): Promise<void> {
    const currentIndex = allEvents.findIndex(e => e.id === eventId);
    if (currentIndex === -1 || currentIndex >= allEvents.length - 1) return; // Already at bottom or not found

    const currentEvent = allEvents[currentIndex];
    const nextEvent = allEvents[currentIndex + 1];
    
    await this.swapPositions(currentEvent.id, nextEvent.id);
  },

  async syncPositionsToDatabase(events: Event[]): Promise<void> {
    // Helper method to sync all local positions to database at once
    const localPositions = await positionPrefs.getAll();
    const updates = events
      .filter(event => localPositions[event.id] !== undefined)
      .map(event => this.update(event.id, { position: localPositions[event.id] }));
    
    await Promise.all(updates).catch(err => 
      console.error('Failed to sync positions to DB:', err)
    );
  }
};
