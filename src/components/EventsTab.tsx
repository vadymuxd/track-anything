import { useState, useEffect } from 'react';
import { Event, eventRepo } from '@/lib/eventRepo';
import { logRepo } from '@/lib/logRepo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus } from 'lucide-react';
import { EventDialog } from './EventDialog';
import { toast } from 'sonner';

export const EventsTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});

  const loadEvents = async () => {
    try {
      const data = await eventRepo.list();
      setEvents(data);
      
      // Load log counts for each event
      const counts: Record<string, number> = {};
      for (const event of data) {
        const logs = await logRepo.listByEventName(event.event_name);
        counts[event.event_name] = logs.length;
      }
      setLogCounts(counts);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await eventRepo.delete(id);
      toast.success('Event deleted');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    loadEvents();
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const getEntryCount = (eventName: string) => {
    return logCounts[eventName] || 0;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Events</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events</h2>
        <Button onClick={() => setIsDialogOpen(true)} size="icon" aria-label="New Event" variant="ghost" className="bg-transparent">
          <Plus className="w-5 h-5 text-black" />
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No events yet. Create your first event to get started.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{event.event_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getEntryCount(event.event_name)} entries • {event.event_type}
                    {event.event_type === 'Scale' && ` (1-${event.scale_max} ${event.scale_label})`}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(event)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(event.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={editingEvent}
        onSave={handleSave}
      />
    </div>
  );
};
