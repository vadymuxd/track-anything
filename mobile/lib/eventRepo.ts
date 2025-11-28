import { supabase } from './supabase';
import type { Database } from './database.types';

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export const eventRepo = {
  async list(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('events')
      .insert(event as any)
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
  }
};
