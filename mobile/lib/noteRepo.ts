import { supabase } from './supabase';
import type { Database } from './database.types';
import { localStorage } from './localStorage';
import { dataEmitter, DATA_UPDATED_EVENT } from './eventEmitter';

export type Note = Database['public']['Tables']['notes']['Row'];
export type NoteInsert = Database['public']['Tables']['notes']['Insert'];
export type NoteUpdate = Database['public']['Tables']['notes']['Update'];

const NOTES_REFRESH_COOLDOWN_MS = 10_000;
let notesRefreshInFlight: Promise<void> | null = null;
let notesLastRefreshStartedAt = 0;

export const noteRepo = {
  async list(): Promise<Note[]> {
    const cachedNotes = await localStorage.getNotes();

    const refreshFromBackend = () => {
      if (notesRefreshInFlight) return notesRefreshInFlight;
      notesLastRefreshStartedAt = Date.now();
      notesRefreshInFlight = (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const notes = data || [];
        await localStorage.setNotes(notes);
        dataEmitter.emit(DATA_UPDATED_EVENT);
      })().finally(() => {
        notesRefreshInFlight = null;
      });
      return notesRefreshInFlight;
    };

    const maybeRefreshInBackground = () => {
      const now = Date.now();
      if (now - notesLastRefreshStartedAt < NOTES_REFRESH_COOLDOWN_MS) return;
      void refreshFromBackend().catch(err => {
        console.error('[noteRepo.list] Background refresh failed:', err);
      });
    };

    if (cachedNotes) {
      maybeRefreshInBackground();
      return cachedNotes;
    }

    await refreshFromBackend();
    return (await localStorage.getNotes()) || [];
  },

  async getById(id: string): Promise<Note | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEventId(eventId: string): Promise<Note[]> {
    const cachedNotes = await localStorage.getNotes();
    const cachedFiltered = cachedNotes ? cachedNotes.filter(n => n.event_id === eventId) : null;

    const refreshEventFromBackend = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const eventNotes = data || [];

      const base = (await localStorage.getNotes()) || [];
      const byId = new Map<string, Note>(base.map(n => [n.id, n]));
      for (const item of eventNotes) byId.set(item.id, item);
      const merged = Array.from(byId.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      await localStorage.setNotes(merged);
      dataEmitter.emit(DATA_UPDATED_EVENT);
    };

    if (cachedFiltered) {
      void refreshEventFromBackend().catch(err => {
        console.error('[noteRepo.getByEventId] Background refresh failed:', err);
      });
      return cachedFiltered;
    }

    await refreshEventFromBackend();
    const notes = (await localStorage.getNotes()) || [];
    return notes.filter(n => n.event_id === eventId);
  },

  async create(note: NoteInsert): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...note, user_id: user?.id } as any)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update local storage cache
    const cachedNotes = await localStorage.getNotes();
    if (cachedNotes) {
      await localStorage.setNotes([data, ...cachedNotes]);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
    
    return data;
  },

  async update(id: string, updates: NoteUpdate): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Update local storage cache
    const cachedNotes = await localStorage.getNotes();
    if (cachedNotes) {
      const updatedNotes = cachedNotes.map(n => n.id === id ? data : n);
      await localStorage.setNotes(updatedNotes);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Update local storage cache
    const cachedNotes = await localStorage.getNotes();
    if (cachedNotes) {
      const updatedNotes = cachedNotes.filter(n => n.id !== id);
      await localStorage.setNotes(updatedNotes);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
  }
};
