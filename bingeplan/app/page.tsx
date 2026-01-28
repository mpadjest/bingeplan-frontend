'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import EventModal from '@/components/EventModal';
import { toast } from 'react-toastify';
import { addWeeks } from 'date-fns';
import { RefreshCw } from 'lucide-react';

// Setup Localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // CONTROLLED STATE (Fixes unresponsiveness)
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<any | undefined>(undefined);

  const handleSyncGoogle = async () => {
    // Optional: Check if user is connected first to give better feedback
    if (!user?.is_google_connected) {
      toast.error("Please connect Google Calendar in your Profile first.");
      return;
    }

    const toastId = toast.loading("Syncing with Google...");
    try {
      const res = await api.post('/events/sync-google');
      toast.update(toastId, { 
        render: res.data.message, 
        type: "success", 
        isLoading: false, 
        autoClose: 3000 
      });
    } catch (err: any) {
      toast.update(toastId, { 
        render: "Sync failed. Try reconnecting in Profile.", 
        type: "error", 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  };


  // Fetch Events
  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/events');
      const formattedEvents = res.data.map((e: any) => ({
        ...e,
        start: new Date(e.start), // Ensure Date Object
        end: new Date(e.end),     // Ensure Date Object
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events');
    }
  }, []);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, fetchEvents]);

  // Handlers for Calendar Control
  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleViewChange = (newView: View) => setView(newView);

  // Interaction Handlers
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedEvent(undefined);
    setSelectedDate(start);
    setModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setModalOpen(true);
  };

  // Submit Handler
  const handleEventSubmit = async (data: any, episodes: number) => {
    try {
      if (selectedEvent && selectedEvent.id) {
        await api.put(`/events/${selectedEvent.id}`, data);
        toast.success('Event updated');
      } else {
        const eventsPayload = [];
        const baseStart = new Date(data.start);
        const baseEnd = new Date(data.end);

        for (let i = 0; i < episodes; i++) {
          const shiftWeeks = i;
          const currentStart = addWeeks(baseStart, shiftWeeks);
          const currentEnd = addWeeks(baseEnd, shiftWeeks);

          eventsPayload.push({
            ...data,
            title: episodes > 1 ? `${data.title} (Ep ${i + 1})` : data.title,
            start: currentStart.toISOString(),
            end: currentEnd.toISOString(),
          });
        }
        await api.post('/events/batch', eventsPayload);
        toast.success(episodes > 1 ? `${episodes} episodes scheduled` : 'Event created');
      }
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error('Operation failed');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.info('Event deleted');
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-6 overflow-hidden flex flex-col h-screen">
        
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            My Watch Schedule
          </h1>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncGoogle}
              className="flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-2.5 font-medium text-green-700 shadow-sm transition-all hover:bg-green-100 active:scale-95 dark:border-green-900 dark:bg-green-900/30 dark:text-green-400"
              title="Sync to Google Calendar"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Sync with Google</span>
            </button>
            <button
              onClick={() => handleSelectSlot({ start: new Date() })}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
            >
              + Add Plan to watch event
            </button>
          </div>
        </header>

        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            
            // Controlled Props (Fixes unresponsiveness)
            view={view}
            date={date}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            
            style={{ height: '100%' }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
          />
        </div>
      </main>

      <EventModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSubmit={handleEventSubmit}
        onDelete={handleDeleteEvent}
        initialDate={selectedDate}
        initialEvent={selectedEvent}
      />
    </div>
  );
}