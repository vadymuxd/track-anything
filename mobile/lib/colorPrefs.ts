import AsyncStorage from '@react-native-async-storage/async-storage';

const COLOR_PREFS_KEY = '@chart_colors';

export const DEFAULT_COLORS = [
  '#000000', // Black
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

export const colorPrefs = {
  async get(eventId: string): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(COLOR_PREFS_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        return prefs[eventId] || DEFAULT_COLORS[0];
      }
      return DEFAULT_COLORS[0];
    } catch (error) {
      console.error('Error reading color prefs:', error);
      return DEFAULT_COLORS[0];
    }
  },

  async set(eventId: string, color: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(COLOR_PREFS_KEY);
      const prefs = stored ? JSON.parse(stored) : {};
      prefs[eventId] = color;
      await AsyncStorage.setItem(COLOR_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving color pref:', error);
    }
  },

  async getAll(): Promise<Record<string, string>> {
    try {
      const stored = await AsyncStorage.getItem(COLOR_PREFS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading all color prefs:', error);
      return {};
    }
  },
};
