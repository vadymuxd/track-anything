import { useState, useEffect } from 'react';
import { Event, eventRepo } from '@/lib/eventRepo';
import { logRepo } from '@/lib/logRepo';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadEvents();
    }
  }, [open]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventRepo.list();
      setEvents(allEvents);
      if (allEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(allEvents[0].event_name);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!selectedEvent) return;

    const event = events.find(e => e.event_name === selectedEvent);
    if (!event) return;

    const value = event.event_type === 'Count' ? 1 : scaleValue;
    
    setSaving(true);
    try {
      await logRepo.create({
        event_id: event.id,
        event_name: selectedEvent,
        value,
      });

      toast.success('Event logged successfully');
      setScaleValue(1);
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error logging event:', error);
      toast.error('Failed to log event');
    } finally {
      setSaving(false);
    }
  };

  const selectedEventData = events.find(e => e.event_name === selectedEvent);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Event</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-center">Loading...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

          {selectedEventData?.event_type === 'Scale' && (
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
          <Button onClick={handleLog} disabled={saving} className="w-full">
            {saving ? 'Logging...' : 'Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
