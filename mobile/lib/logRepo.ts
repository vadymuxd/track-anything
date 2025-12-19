import { supabase } from './supabase';
import type { Database } from './database.types';
import { localStorage } from './localStorage';
import { dataEmitter, DATA_UPDATED_EVENT } from './eventEmitter';

export type Log = Database['public']['Tables']['logs']['Row'];
export type LogInsert = Database['public']['Tables']['logs']['Insert'];

const LOGS_REFRESH_COOLDOWN_MS = 10_000;
let logsRefreshInFlight: Promise<void> | null = null;
let logsLastRefreshStartedAt = 0;

export const logRepo = {
  async list(): Promise<Log[]> {
    const cachedLogs = await localStorage.getLogs();

    const refreshFromBackend = () => {
      if (logsRefreshInFlight) return logsRefreshInFlight;
      logsLastRefreshStartedAt = Date.now();
      logsRefreshInFlight = (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const logs = data || [];
        await localStorage.setLogs(logs);
        dataEmitter.emit(DATA_UPDATED_EVENT);
      })().finally(() => {
        logsRefreshInFlight = null;
      });
      return logsRefreshInFlight;
    };

    const maybeRefreshInBackground = () => {
      const now = Date.now();
      if (now - logsLastRefreshStartedAt < LOGS_REFRESH_COOLDOWN_MS) return;
      void refreshFromBackend().catch(err => {
        console.error('[logRepo.list] Background refresh failed:', err);
      });
    };

    if (cachedLogs) {
      maybeRefreshInBackground();
      return cachedLogs;
    }

    await refreshFromBackend();
    return (await localStorage.getLogs()) || [];
  },

  async listByDateRange(startDate: string, endDate: string): Promise<Log[]> {
    const cachedLogs = await localStorage.getLogs();
    const cachedFiltered = cachedLogs
      ? cachedLogs.filter(log => log.created_at >= startDate && log.created_at <= endDate)
      : null;

    const refreshRangeFromBackend = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rangeLogs = data || [];

      // Merge range results into the full cache (best-effort)
      const base = (await localStorage.getLogs()) || [];
      const byId = new Map<string, Log>(base.map(l => [l.id, l]));
      for (const item of rangeLogs) byId.set(item.id, item);
      const merged = Array.from(byId.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      await localStorage.setLogs(merged);
      dataEmitter.emit(DATA_UPDATED_EVENT);
    };

    if (cachedFiltered) {
      void refreshRangeFromBackend().catch(err => {
        console.error('[logRepo.listByDateRange] Background refresh failed:', err);
      });
      return cachedFiltered;
    }

    await refreshRangeFromBackend();
    const logs = (await localStorage.getLogs()) || [];
    return logs.filter(log => log.created_at >= startDate && log.created_at <= endDate);
  },

  async listByEvent(eventId: string): Promise<Log[]> {
    const cachedLogs = await localStorage.getLogs();
    const cachedFiltered = cachedLogs ? cachedLogs.filter(l => (l as any).event_id === eventId) : null;

    const refreshEventFromBackend = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const eventLogs = data || [];

      const base = (await localStorage.getLogs()) || [];
      const byId = new Map<string, Log>(base.map(l => [l.id, l]));
      for (const item of eventLogs) byId.set(item.id, item);
      const merged = Array.from(byId.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      await localStorage.setLogs(merged);
      dataEmitter.emit(DATA_UPDATED_EVENT);
    };

    if (cachedFiltered) {
      void refreshEventFromBackend().catch(err => {
        console.error('[logRepo.listByEvent] Background refresh failed:', err);
      });
      return cachedFiltered;
    }

    await refreshEventFromBackend();
    const logs = (await localStorage.getLogs()) || [];
    return logs.filter(l => (l as any).event_id === eventId);
  },

  async listByEventName(eventName: string): Promise<Log[]> {
    const cachedLogs = await localStorage.getLogs();
    const cachedFiltered = cachedLogs ? cachedLogs.filter(l => l.event_name === eventName) : null;

    const refreshEventNameFromBackend = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_name', eventName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const nameLogs = data || [];

      const base = (await localStorage.getLogs()) || [];
      const byId = new Map<string, Log>(base.map(l => [l.id, l]));
      for (const item of nameLogs) byId.set(item.id, item);
      const merged = Array.from(byId.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      await localStorage.setLogs(merged);
      dataEmitter.emit(DATA_UPDATED_EVENT);
    };

    if (cachedFiltered) {
      void refreshEventNameFromBackend().catch(err => {
        console.error('[logRepo.listByEventName] Background refresh failed:', err);
      });
      return cachedFiltered;
    }

    await refreshEventNameFromBackend();
    const logs = (await localStorage.getLogs()) || [];
    return logs.filter(l => l.event_name === eventName);
  },

  async create(log: LogInsert): Promise<Log> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('logs')
      .insert({ ...log, user_id: user?.id } as any)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update local storage cache
    const cachedLogs = await localStorage.getLogs();
    if (cachedLogs) {
      await localStorage.setLogs([data, ...cachedLogs]);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
    
    return data;
  },

  async update(id: string, log: Partial<LogInsert>): Promise<Log> {
    const { error } = await supabase
      .from('logs')
      .update(log as any)
      .eq('id', id);
    
    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    // Fetch the updated log
    const { data, error: fetchError } = await supabase
      .from('logs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !data) {
      console.error('Failed to fetch updated log:', id, fetchError);
      throw new Error('Failed to fetch updated log');
    }
    
    // Update local storage cache
    const cachedLogs = await localStorage.getLogs();
    if (cachedLogs) {
      const updatedLogs = cachedLogs.map(l => l.id === id ? data : l);
      await localStorage.setLogs(updatedLogs);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Update local storage cache
    const cachedLogs = await localStorage.getLogs();
    if (cachedLogs) {
      const updatedLogs = cachedLogs.filter(l => l.id !== id);
      await localStorage.setLogs(updatedLogs);
    }

    dataEmitter.emit(DATA_UPDATED_EVENT);
  }
};
