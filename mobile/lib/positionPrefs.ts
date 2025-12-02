import AsyncStorage from '@react-native-async-storage/async-storage';

const POSITION_PREFS_KEY = '@event_positions';

export const positionPrefs = {
  async get(eventId: string): Promise<number | undefined> {
    try {
      const stored = await AsyncStorage.getItem(POSITION_PREFS_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        return prefs[eventId];
      }
      return undefined;
    } catch (error) {
      console.error('Error reading position prefs:', error);
      return undefined;
    }
  },

  async set(eventId: string, position: number): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(POSITION_PREFS_KEY);
      const prefs = stored ? JSON.parse(stored) : {};
      prefs[eventId] = position;
      await AsyncStorage.setItem(POSITION_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving position pref:', error);
    }
  },

  async getAll(): Promise<Record<string, number>> {
    try {
      const stored = await AsyncStorage.getItem(POSITION_PREFS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading all position prefs:', error);
      return {};
    }
  },

  async setAll(positions: Record<string, number>): Promise<void> {
    try {
      await AsyncStorage.setItem(POSITION_PREFS_KEY, JSON.stringify(positions));
    } catch (error) {
      console.error('Error saving all position prefs:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(POSITION_PREFS_KEY);
    } catch (error) {
      console.error('Error clearing position prefs:', error);
    }
  },
};
