const KEY = 'track_anything_chart_prefs_v1';
export type ChartType = 'line' | 'bar';

export const chartPrefs = {
  getAll(): Record<string, ChartType> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  get(eventName: string): ChartType | undefined {
    return this.getAll()[eventName];
  },
  set(eventName: string, type: ChartType) {
    const all = this.getAll();
    all[eventName] = type;
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  },
  remove(eventName: string) {
    const all = this.getAll();
    delete all[eventName];
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }
};
