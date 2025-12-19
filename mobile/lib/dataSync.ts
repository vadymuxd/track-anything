import { eventRepo } from './eventRepo';
import { logRepo } from './logRepo';
import { noteRepo } from './noteRepo';
import { localStorage } from './localStorage';

/**
 * Preload all user data into local storage
 * This runs in the background after user authentication
 */
export const dataSync = {
  async preloadAll(): Promise<void> {
    try {
      // Fetch all data in parallel
      const [events, logs, notes] = await Promise.all([
        eventRepo.list(),
        logRepo.list(),
        noteRepo.list(),
      ]);

      // Data is already saved to local storage by the repo methods
      console.log('[DataSync] Preloaded data:', {
        events: events.length,
        logs: logs.length,
        notes: notes.length,
      });

      // Update last sync timestamp
      await localStorage.setLastSync(Date.now());
    } catch (error) {
      console.error('[DataSync] Failed to preload data:', error);
      // Don't throw - preloading is optional
    }
  },

  async syncInBackground(): Promise<void> {
    // Run preload without blocking
    this.preloadAll().catch(err => {
      console.error('[DataSync] Background sync failed:', err);
    });
  },
};
