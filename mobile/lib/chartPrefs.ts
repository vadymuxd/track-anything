import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'track_anything_chart_prefs_v1';
export type ChartType = 'line' | 'bar';

export const chartPrefs = {
  async getAll(): Promise<Record<string, ChartType>> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  async get(eventName: string): Promise<ChartType | undefined> {
    const all = await this.getAll();
    return all[eventName];
  },
  async set(eventName: string, type: ChartType) {
    const all = await this.getAll();
    all[eventName] = type;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  },
  async remove(eventName: string) {
    const all = await this.getAll();
    delete all[eventName];
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }
};
