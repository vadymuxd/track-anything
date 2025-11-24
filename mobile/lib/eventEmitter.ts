type EventListener = () => void;

class EventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit(event: string) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener());
    }
  }
}

export const dataEmitter = new EventEmitter();
export const DATA_UPDATED_EVENT = 'data:updated';
