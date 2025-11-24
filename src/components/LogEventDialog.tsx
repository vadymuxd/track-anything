import { useState, useEffect } from 'react';
import { storage, Event } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface LogEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export const LogEventDialog = ({ open, onOpenChange, onSave }: LogEventDialogProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [scaleValue, setScaleValue] = useState<number>(1);

  useEffect(() => {
    const allEvents = storage.getEvents();
    setEvents(allEvents);
    if (allEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(allEvents[0].event_name);
    }
  }, [open]);

  const handleLog = () => {
    if (!selectedEvent) return;

    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return;

    const value = event.event_type === 'boolean' ? 1 : scaleValue;
    
    storage.addLog({
      event_name: selectedEvent,
      value,
    });

    toast.success('Event logged successfully');
    setScaleValue(1);
    onSave();
    onOpenChange(false);
  };

  const selectedEventData = events.find(e => e.event_name === selectedEvent);

  if (events.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Event</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-center">
              Create an event first to start logging.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="event-select">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event-select">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.event_name}>
                    {event.event_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEventData?.event_type === 'scale' && (
            <div className="space-y-2">
              <Label>
                Value: {scaleValue} {selectedEventData.scale_label}
              </Label>
              <Slider
                value={[scaleValue]}
                onValueChange={(v) => setScaleValue(v[0])}
                min={1}
                max={selectedEventData.scale_max || 5}
                step={1}
                className="py-4"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleLog}>Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
