import { supabase } from './supabase';
import type { Database } from './database.types';

export type Log = Database['public']['Tables']['logs']['Row'];
export type LogInsert = Database['public']['Tables']['logs']['Insert'];

export const logRepo = {
  async list(): Promise<Log[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async listByEvent(eventId: string): Promise<Log[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async listByEventName(eventName: string): Promise<Log[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('event_name', eventName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(log: LogInsert): Promise<Log> {
    const { data, error } = await supabase
      .from('logs')
      .insert(log as any)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
