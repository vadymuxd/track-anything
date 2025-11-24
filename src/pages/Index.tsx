import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Calendar, ClipboardList } from 'lucide-react';
import { EventsTab } from '@/components/EventsTab';
import { HistoryTab } from '@/components/HistoryTab';
import { LogTab } from '@/components/LogTab';
import { LogEventDialog } from '@/components/LogEventDialog';

const Index = () => {
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Tabs defaultValue="history" className="space-y-6">
          <TabsContent value="history" key={`history-${refreshKey}`}>
            <HistoryTab />
          </TabsContent>

          <TabsContent value="events" key={`events-${refreshKey}`}>
            <EventsTab />
          </TabsContent>

          <TabsContent value="log" key={`log-${refreshKey}`}>
            <LogTab />
          </TabsContent>

          <TabsList className="fixed bottom-0 left-0 right-0 h-16 grid grid-cols-3 rounded-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <TabsTrigger value="history" className="flex-col gap-1 h-full data-[state=active]:bg-transparent">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">History</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-col gap-1 h-full data-[state=active]:bg-transparent">
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Events</span>
            </TabsTrigger>
            <TabsTrigger value="log" className="flex-col gap-1 h-full data-[state=active]:bg-transparent">
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs">Log</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          className="fixed bottom-20 right-6 rounded-full w-14 h-14 shadow-lg z-50 bg-red-500 hover:bg-red-600"
          size="icon"
          onClick={() => setIsLogDialogOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>

        <LogEventDialog
          open={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          onSave={handleLogSaved}
        />
      </div>
    </div>
  );
};

export default Index;
