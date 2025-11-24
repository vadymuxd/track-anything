import { useState, useEffect } from 'react';
import { Event, eventRepo } from '@/lib/eventRepo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSave: () => void;
}

export const EventDialog = ({ open, onOpenChange, event, onSave }: EventDialogProps) => {
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<'boolean' | 'scale'>('boolean');
  const [scaleLabel, setScaleLabel] = useState('');
  const [scaleMax, setScaleMax] = useState('5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setEventName(event.event_name);
      setEventType(event.event_type);
      setScaleLabel(event.scale_label || '');
      setScaleMax(event.scale_max?.toString() || '5');
    } else {
      setEventName('');
      setEventType('boolean');
      setScaleLabel('');
      setScaleMax('5');
    }
  }, [event]);

  const handleSave = async () => {
    if (!eventName.trim()) {
      toast.error('Event name is required');
      return;
    }

    setSaving(true);
    try {
      if (event) {
        await eventRepo.update(event.id, {
          event_name: eventName,
          event_type: eventType,
          scale_label: eventType === 'scale' ? scaleLabel : null,
          scale_max: eventType === 'scale' ? parseInt(scaleMax) : null,
        });
        toast.success('Event updated');
      } else {
        await eventRepo.create({
          event_name: eventName,
          event_type: eventType,
          scale_label: eventType === 'scale' ? scaleLabel : null,
          scale_max: eventType === 'scale' ? parseInt(scaleMax) : null,
        });
        toast.success('Event created');
      }
      
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Morning workout"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as 'boolean' | 'scale')}>
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {eventType === 'scale' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="scale-label">Scale Label</Label>
                <Input
                  id="scale-label"
                  value={scaleLabel}
                  onChange={(e) => setScaleLabel(e.target.value)}
                  placeholder="e.g., cups, km, hours"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scale-max">Scale Max (2-10)</Label>
                <Input
                  id="scale-max"
                  type="number"
                  min="2"
                  max="10"
                  value={scaleMax}
                  onChange={(e) => setScaleMax(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
