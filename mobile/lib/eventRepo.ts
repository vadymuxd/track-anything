import { supabase } from './supabase';
import type { Database } from './database.types';
import { positionPrefs } from './positionPrefs';
import { colorPrefs } from './colorPrefs';

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export const eventRepo = {
  async list(): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user?.id)
      .order('position', { ascending: true });
    
    if (error) throw error;
    
    // Merge with local preferences for faster/optimistic ordering and colors
    const events = data || [];
    const [localPositions, localColors] = await Promise.all([
      positionPrefs.getAll(),
      colorPrefs.getAll()
    ]);
    
    // Apply local positions and colors if they exist
    const eventsWithLocalPrefs = events.map(event => {
      const localPos = localPositions[event.id];
      const localColor = localColors[event.id];
      return {
        ...event,
        position: localPos !== undefined ? localPos : event.position,
        color: localColor !== undefined ? localColor : event.color
      };
    });
    
    // Sort by position (local positions take precedence)
    eventsWithLocalPrefs.sort((a, b) => a.position - b.position);
    
    return eventsWithLocalPrefs;
  },

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByName(eventName: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_name', eventName)
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

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
